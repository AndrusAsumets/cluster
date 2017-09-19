var io = require('socket.io-client')
var PF = require('pathfinding')

import { CONNECT, GET_STATE, SET_STATE, SET_ENERGY, SET_ELEMENT, SET_BUILDING, SET_LINK, SET_SELL } from './actions'
import { defaultEnergy, defaultHealth, defaultDamage, defaultAbsorb, defaultShapes, defaultBuildings, defaultOptions } from './defaults'
import { convertRange, size, getUrlParams } from './helpers'
import { isNear, setWalkableAt, isLinked, findOpenPath, findBuildingIndex } from './util'
import { createMatrix, ctx, line, rectangle, circle, dot, donut, image } from './draw'
import { sell } from './dynamic'

export function game() {
	// gameplay
	const tick = 1000 // how often should the events happen
	const cooldown = 10 // how often should the buildings create new elements
	const fps = 60
	var gameOver = false
	var time = (new Date).getTime()
	var players = {}

	// platform
	const client = window ? true : false
	const host = !window ? true : false

	// window
	const smallHorizontal = 24 // how many blocks to have on x scale
	const smallVertical = 14 // how many blocks to have on y scale
	const gm = 3 // grid multiplier (how much to upscale the grid for gameplay)
	const horizontal = smallHorizontal * gm
	const vertical = smallVertical * gm
	const marginTop = 60 // height of the scoring menu in pixels
	const sizes = client ? size() : { x: horizontal, y: vertical }
	const w = sizes.x
	const h = sizes.y - marginTop
	const blockWidth = w / smallHorizontal
	const blockHeight = h / smallVertical

	// grid
	const finder = new PF.AStarFinder({ allowDiagonal: true })
	const matrix = createMatrix(vertical, horizontal)
	var grid = new PF.Grid(matrix)

	// player
	function Player (options) {
		this.id = options.id
		this.buildings = []
		this.elements = []
		this.projectiles = []
		this.deepProjectiles = []
		this.links = []
		this.energy = defaultEnergy
	}

	var canvas = {}

	if (client) {
		var container = document.createElement('div')
		container.className = 'player'
		document.getElementsByClassName('game')[0].appendChild(container)
		canvas = {
			background: ctx(container, 'background', w, h, 1, blockHeight),
			link: ctx(container, 'link', w, h, 2, blockHeight),
			movement: ctx(container, 'movement', w, h, 3, blockHeight),
			menu: ctx(container, 'menu', w, h, 4, blockHeight)
		}

		// create a visual UI grid
		for (var i = 0; i < smallHorizontal + 1; i++) {
			line({
				ctx: canvas.background,
				shape: defaultShapes.light,
				x1: blockWidth * i,
				y1: 0,
				x2: blockWidth * i,
				y2: h,
				alpha: 0.075
			})
		}

		for (var i = 0; i < smallVertical + 1; i++) {
			line({
				ctx: canvas.background,
				shape: defaultShapes.light,
				x1: 0,
				y1: blockHeight * i,
				x2: w,
				y2: blockHeight * i,
				alpha: 0.075
			})
		}

		document.getElementsByClassName(container.className)[0].addEventListener('touchstart', function(event) { createMenu(event) })
		document.getElementsByClassName(container.className)[0].addEventListener('mousedown', function(event) { createMenu(event) })
	}

	// networking
	var me = client ? getUrlParams('me') : null
	if (!me && !host) return console.log('add ?me=some_player_id to your url')

	var uri = process.env.WS_SERVER && process.env.WS_PORT
		? 'ws://' + process.env.WS_SERVER + ':' + process.env.WS_PORT
		: 'ws://localhost:1337'
	var socket = io.connect(uri)

	if (client) {
		socket.on('reconnect', function () {
			// for dev purposes, reload the page after reconnect
			location.reload()
		})
	}

	socket.on('message', function (message) {
		var action = message.action
		var data = message.data

		switch(action) {
			case CONNECT:
				console.log('connected to ws')

				if (client) {
					if (me == 'player1' || me == 'player2') {
						players[me] = new Player({ id: me })
						socket.emit('message', { action: GET_STATE, data: me })
					}
				}
				break

			case GET_STATE:
				if (host) {
					if (!players[data]) players[data] = new Player({ id: data })

					socket.emit('message', { action: SET_STATE, data: players })
				}
				break

			case SET_STATE:
				if (client) {
					for (var key in data) {
						if (!players[key]) players[key] = new Player({ id: key })

						players[key].buildings = data[key].buildings
						players[key].elements = data[key].elements
						players[key].links = data[key].links
						link()

						for (var i = 0; i < data[key].buildings.length; i++) {
							grid = setWalkableAt(grid, gm, data[key].buildings[i].start[0], data[key].buildings[i].start[1], false)
						}
					}
				}
				break

			case SET_ENERGY:
				if (client) {
					for (var key in data) {
						if (!players[key]) continue

						players[key].energy = data[key].energy
						document.getElementsByClassName('score-' + key)[0].innerHTML = Math.floor(data[key].energy)
						
						var share = convertRange(data[key].energyShare, [0, 100], [0, w / 2])
						document.getElementsByClassName('scorebar-' + key)[0].style.width = share + 'px'
					}
				}
				break

			case SET_BUILDING:
				var building = data
				var player = players[building.playerId]

				// if not sufficient energy
				if (player.energy - defaultBuildings[building.type].cost < 0) return

				// check if there's an building on that location already
				if (Number.isInteger(findBuildingIndex(player.buildings, building))) return

				// check for open paths
				grid = setWalkableAt(grid, gm, building.start[0], building.start[1], false)

				var found = false
				for (var i = 0; i < vertical - gm; i++) {
					if (finder.findPath(0, i, horizontal - gm, vertical - gm - i, grid.clone()).length) found = true
				}

				if (!found) {
					grid = setWalkableAt(grid, gm, building.start[0], building.start[1], true)
					return
				}

				decreaseEnergy(players[building.playerId], defaultBuildings[building.type].cost)
				players[building.playerId].buildings.push(building)
				for (var p in players) createPaths(players[p])
				if (client) link()
				break

			case SET_LINK:
				players[data.playerId].links.push(data.link)
				if (client) link()
				break

			case SET_ELEMENT:
				if (client) {
					var element = data.element
					var playerId = element.playerId
					var buildingIndex = data.buildingIndex

					for (var key in players) {
						if (key != playerId) players[key].elements.push(element)
						else players[playerId].buildings[buildingIndex].charge = 0
					}
				}
				break
			
			case SET_SELL:
				players[data.playerId] = sell({ player: players[data.playerId], buildingIndex: data.buildingIndex })
				break
		}
	})

	var gameMenu = {}
	function createMenu(event) {
		if (gameOver) return

		event.preventDefault()
		if ('touches' in event) event = event.touches[0]

		var player = players[me]
		canvas.menu.clearRect(0, 0, w, h)

		var x = event.clientX
		var y = event.clientY - marginTop
		var xBlock = Math.floor(x / blockWidth)
		var yBlock = Math.floor(y / blockHeight)
		var position = me == 'player1' ? 'left' : 'right'
		if (position == 'left' && xBlock * gm >= horizontal / 2 && !gameMenu.x) return
		if (position == 'right' && xBlock * gm < horizontal / 2 && !gameMenu.x) return
		var buildingIndex = findBuildingIndex(player.buildings, { start: [xBlock * gm, yBlock * gm] })
		var building = player.buildings[buildingIndex]
		var buildingIsFound = buildingIndex > -1
		
		// build options popup that goes to right
		if (
			gameMenu.options
		) {
			gameMenu.direction = 'toRight'
			selectFromOptionsPopup({
				player: player,
				gameMenu: gameMenu, 
				xBlock: xBlock,
				buildingIndex: findBuildingIndex(player.buildings, { start: gameMenu.fromBuilding.start })
			})
			gameMenu = {}
		}
		
		// if a building was found on that block, show the options popup
		else if (
			buildingIsFound &&
			!gameMenu.generic
		) {
			gameMenu.x = xBlock
			gameMenu.y = yBlock
			gameMenu.fromBuilding = building
			gameMenu.linking = true
			gameMenu.options = true
			
			buildOptionsPopup({
				player: player,
				xBlock: xBlock,
				yBlock: yBlock,
				position: position,
				gameMenu: gameMenu,
				building: building
			})
		}
	
		// if from and to buildings were found, then link
		else if (
			gameMenu.fromBuilding &&
			Object.keys(gameMenu.fromBuilding).length > 0 &&
			buildingIsFound
		) {
			var from = gameMenu.fromBuilding.start
			var to = building.start

			if (isLinked(players[me], from, to)) {
				gameMenu = {}
				return
			}

			// disablelinking to the same building
			if (from == to) return

			socket.emit('message', { action: SET_LINK, data: { link: { from: from, to: to, type: gameMenu.fromBuilding.type }, playerId: me }})
			link()

			gameMenu = {}
		}

		// build generic popup that goes to right
		else if (
			(position == 'left' && gameMenu.x     == xBlock && gameMenu.y == yBlock) ||
			(position == 'left' && gameMenu.x + 1 == xBlock && gameMenu.y == yBlock) ||
			(position == 'left' && gameMenu.x + 2 == xBlock && gameMenu.y == yBlock) ||
			(position == 'left' && gameMenu.x + 3 == xBlock && gameMenu.y == yBlock)
		) {
			gameMenu.direction = 'toRight'
			selectFromGenericPopup(player, gameMenu, xBlock)
			gameMenu = {}
		}

		// build generic popup that goes to left
		else if (
			(position == 'right' && gameMenu.x - 3 == xBlock && gameMenu.y == yBlock) ||
			(position == 'right' && gameMenu.x - 2 == xBlock && gameMenu.y == yBlock) ||
			(position == 'right' && gameMenu.x - 1 == xBlock && gameMenu.y == yBlock) ||
			(position == 'right' && gameMenu.x     == xBlock && gameMenu.y == yBlock)
		) {
			gameMenu.direction = 'toLeft'
			selectFromGenericPopup(player, gameMenu, xBlock)
			gameMenu = {}
		}

		//build a generic popup
		else if (
			!gameMenu.x &&
			!gameMenu.y
		) {
			buildGenericPopup(player, xBlock, yBlock, position)
			gameMenu = { x: xBlock, y: yBlock, generic: true }
		}

		// otherwise just clear the menu
		else {
			gameMenu = {}
		}
	}

	function buildGenericPopup(player, xBlock, yBlock, position) {
		if (position == 'left') {
			var i = 0

			for (var building in defaultBuildings) {
				rectangle({
					ctx: canvas.menu,
					shape: defaultShapes.light,
					x1: (xBlock + i) * blockWidth,
					y1: yBlock * blockHeight,
					width: blockWidth,
					height: blockHeight,
					alpha: 0.1
				})

				image({
					ctx: canvas.menu,
					type: building,
					file: defaultShapes[building].file,
					x1: (xBlock + i) * blockWidth,
					y1: yBlock * blockHeight,
					width: blockWidth,
					height: blockHeight,
					size: 3.5,
					percentage: 100
				})

				i++
			}
		}
		else {
			var reversedDefaultBuildings = JSON.parse(JSON.stringify(Object.keys(defaultBuildings))).reverse()
			var i = 0
			for (var building in defaultBuildings) {
				rectangle({
					ctx: canvas.menu,
					shape: defaultShapes.light,
					x1: (xBlock + i - reversedDefaultBuildings.length + 1) * blockWidth,
					y1: yBlock * blockHeight,
					width: blockWidth,
					height: blockHeight,
					alpha: 0.1
				})

				image({
					ctx: canvas.menu,
					type: building,
					file: defaultShapes[building].file,
					x1: (xBlock + i - reversedDefaultBuildings.length + 1) * blockWidth,
					y1: yBlock * blockHeight,
					width: blockWidth,
					height: blockHeight,
					size: 3.5,
					percentage: 100
				})

				i++
			}
		}
	}

	function selectFromGenericPopup(player, gameMenu, xBlock) {
		var index, type, id, start, end
		if (gameMenu.direction == 'toRight') {
			index = xBlock - gameMenu.x
			type = Object.keys(defaultBuildings)[index]
			id = player.elements.length
			start = [gameMenu.x * gm, gameMenu.y * gm]
			end = [horizontal, gameMenu.y * gm]
		}
		else {
			index = xBlock - gameMenu.x + Object.keys(defaultBuildings).length - 1
			type = Object.keys(defaultBuildings)[index]
			id = player.elements.length
			start = [gameMenu.x * gm, gameMenu.y * gm]
			end = [0, gameMenu.y * gm]
		}

		var building = {
			playerId: player.id,
			id: id,
			type: type,
			start: start,
			end: end,
			charge: 0,
			dynamics: {}
		}

		var message = {
			action: SET_BUILDING,
			data: Object.assign({}, defaultBuildings[type], building),
			playerId: me
		}

		socket.emit('message', message)
	}
	
	function buildOptionsPopup(o) {
		var options = Object.keys(defaultOptions)
		
		// make the building visually active
		rectangle({
			ctx: canvas.menu,
			shape: defaultShapes.light,
			x1: o.xBlock * blockWidth,
			y1: o.yBlock * blockHeight,
			width: blockWidth,
			height: blockHeight,
			alpha: 0.1
		})

		image({
			ctx: canvas.menu,
			type: o.building.type,
			file: defaultShapes[o.gameMenu.fromBuilding.type].file,
			x1: o.xBlock * blockWidth,
			y1: o.yBlock * blockHeight,
			width: blockWidth,
			height: blockHeight,
			size: 3.5
		})

		if (o.position == 'left') {
			var i = 0

			options.map(function (option, i) {
				rectangle({
					ctx: canvas.menu,
					shape: defaultShapes.dark,
					x1: (o.xBlock + i) * blockWidth,
					y1: o.yBlock * blockHeight - blockHeight,
					width: blockWidth,
					height: blockHeight,
					alpha: 1
				})
				
				rectangle({
					ctx: canvas.menu,
					shape: defaultShapes.light,
					x1: (o.xBlock + i) * blockWidth,
					y1: o.yBlock * blockHeight - blockHeight,
					width: blockWidth,
					height: blockHeight,
					alpha: 0.1
				})

				image({
					ctx: canvas.menu,
					type: option,
					file: defaultShapes[option].file,
					x1: (o.xBlock + i) * blockWidth,
					y1: o.yBlock * blockHeight - blockHeight,
					width: blockWidth,
					height: blockHeight,
					size: 4
				})

				i++
			})
		}
	}
	
	function selectFromOptionsPopup(o) {
		var action
		if (o.gameMenu.direction == 'toRight') {
			var index = o.xBlock - o.gameMenu.x
			var key = Object.keys(defaultOptions)[index]
			if (!key) return
			action = defaultOptions[key].action
		}
		else {
			index = xBlock - gameMenu.x + Object.keys(defaultOptions).length - 1
			type = Object.keys(defaultBuildings)[index]
			id = player.elements.length
			start = [gameMenu.x * gm, gameMenu.y * gm]
			end = [0, gameMenu.y * gm]
		}

		var message = {
			action: action,
			data: { playerId: me, buildingIndex: o.buildingIndex }
		}

		socket.emit('message', message)
	}
	

	function link() {
		canvas.link.clearRect(0, 0, w, h)

		for (var key in players) {
			var player = players[key]
			var links = player.links

			for (var l = 0; l < links.length; l++) {
				var from = links[l].from
				var to = links[l].to
				var type = links[l].type

				// make positions temporarily walkable
				grid = setWalkableAt(grid, gm, from[0], from[1], true)
				grid = setWalkableAt(grid, gm, to[0], to[1], true)

				// find a path between the buildings
				var path = finder.findPath(from[0], from[1], to[0], to[1], grid.clone())

				// make positions unwalkable again
				grid = setWalkableAt(grid, gm, from[0], from[1], false)
				grid = setWalkableAt(grid, gm, to[0], to[1], false)

				if (!path.length) continue

				var width = blockWidth / gm
				var height = blockHeight / gm

				var last = [
					path[0][0] * width + (width * gm / 2),
					path[0][1] * height + (height * gm / 2)
				]

				for (var i = 0; i < path.length ; i++) {
					var x1 = last[0]
					var y1 = last[1]
					var x2 = path[i][0] * width + (width * gm / 2)
					var y2 = path[i][1] * height + (height * gm / 2)

					line({
						ctx: canvas.link,
						shape: defaultShapes[type],
						x1: x1,
						y1: y1,
						x2: x2,
						y2: y2,
						lineWidth: 2,
						lineDash: [8, 24],
						alpha: 0.5
					})
					last = [x2, y2]
				}
			}
		}
	}

	function resetProjectiles(player) {
		players[player.id].projectiles = []
		players[player.id].deepProjectiles = []

		var buildings = player.buildings ? player.buildings : []
		for (var r = 0; r < buildings.length; r++) {
			if (!'fired' in buildings[r].dynamics) continue
			players[player.id].buildings[r].dynamics.fired = 0
		}
	}

	function health(player) {
		var elements = player.elements ? player.elements : []
		for (var r = 0; r < elements.length; r++) {
			if (elements[r].dynamics.health <= 0) players[player.id].elements.splice(r, 1)
		}
	}

	function shiftPaths(player) {
		var elements = player.elements ? player.elements : []
		for (var p = 0; p < elements.length; p++) {
			var element = player.elements[p]

			if (element.inactive) { continue }
			else if (
				!element.path ||
				!element.path[1] ||
				!element.path[1].length
			) {
				decreaseEnergy(player, defaultAbsorb)
				players[player.id].elements[p].inactive = true
			} else {
				players[player.id].elements[p].path.shift()
			}
		}
	}

	function createPaths(player) {
		for (var p = 0; p < player.elements.length; p++) {
			var element = player.elements[p]

			if (
				!element.path ||
				!element.path[0] ||
				!element.path[0].length
			) {
				var path = finder.findPath(player.elements[p].start[0], player.elements[p].start[1], player.elements[p].end[0], player.elements[p].end[1], grid.clone())
				players[player.id].elements[p].path = path
			}
		}
	}

	function collision(p) {
		var player = players[p]
		var a = 1
		var b = 1

		for (var r = 0; r < player.elements.length; r++) {
			if (
				!player.elements &&
				!player.elements.length &&
				!player.elements[r] &&
				!player.elements[r].length &&
				!player.elements[r].path &&
				!player.elements[r].path[a] &&
				!player.elements[r].path[a].length
			) continue

			var positionA = player.elements[r].path[a]
			if (!positionA) continue
			if (!positionA.length) continue

			for (var p2 in players) {
				if (p == p2) continue
				var anotherPlayer = players[p2]

				for (var r2 = 0; r2 < anotherPlayer.elements.length; r2++) {
					if (
						!anotherPlayer.elements &&
						!anotherPlayer.elements.length &&
						!anotherPlayer.elements[r2] &&
						!anotherPlayer.elements[r2].length &&
						!anotherPlayer.elements[r2].path &&
						!anotherPlayer.elements[r2].path[b] &&
						!anotherPlayer.elements[r2].path[b].length
					) continue

					var positionB = anotherPlayer.elements[r2].path[b]
					if (!positionB) continue
					if (!positionB.length) continue

					if (isNear(gm, positionA, positionB)) {
						var path = []
						try {
							// make positions unwalkable
							grid = setWalkableAt(grid, gm, positionB[0], positionB[1], false)

							// find a path between the buildings
							var path = finder.findPath(player.elements[r].path[0][0], player.elements[r].path[0][1], player.elements[r].end[0], player.elements[r].end[1], grid.clone())

							// make positions walkable again
							grid = setWalkableAt(grid, gm, positionB[0], positionB[1], true)

							if (path.length) players[p].elements[r].path = path
						} catch (err) { continue }


						var projectile = {
							path: [
								player.elements[r].path[a - 1],
								anotherPlayer.elements[r2].path[b]
							],
							shape: defaultShapes[player.elements[r].type]
						}

						players[anotherPlayer.id].deepProjectiles.push(projectile)

						var projectile = {
							path: [
								anotherPlayer.elements[r2].path[a - 1],
								player.elements[r].path[b]
							],
							shape: defaultShapes[anotherPlayer.elements[r2].type]
						}

						players[player.id].deepProjectiles.push(projectile)

						break
					}
				}
			}
		}
	}

	function deepHit(player) {
		for (var r = 0; r < player.elements.length; r++) {
			var element = player.elements[r]

			if (
				!element.path ||
				!element.path[1] ||
				!element.path[1].length
			) continue

			var x2 = element.path[1][0]
			var y2 = element.path[1][1]

			var projectiles = player.deepProjectiles
			for (var p = 0; p < projectiles.length; p++) {
				var x1 = projectiles[p].path[1][0]
				var y1 = projectiles[p].path[1][1]

				if (x1 == x2 && y1 == y2) {
					players[player.id].elements[r].dynamics.health = players[player.id].elements[r].dynamics.health - defaultDamage / 4
					break
				}
			}
		}
	}

	function charge(layer, type, key) {
		var objects = players[key][type] ? players[key][type] : []
		for (var p = 0; p < objects.length; p++) {
			var object = objects[p]

			if (object.charge < 100) {
				object.charge = object.charge + convertRange(1 / fps * cooldown, [0, fps], [0, 100])
				objects[p].charge = object.charge
			}

			else if (object.charge >= 100) {
				players[key].buildings[p].built = true

				if (object.offensive) {
					players[key].buildings[p].charge = 0
					if (host) newElement(objects, key, p)
				}
			}

			/*
			if (client) donut({
				ctx: canvas[layer],
				shape: defaultShapes[object.type],
				x1: object.start[0] * blockWidth / gm,
				y1: object.start[1] * blockHeight / gm,
				x2: blockWidth,
				y2: blockHeight,
				percentage: object.charge
			})
			*/

			if (client) {
				var size = 3.5
				
				image({
					ctx: canvas[layer],
					type: object.type,
					file: defaultShapes[object.type].file,
					x1: object.start[0] * blockWidth / gm,
					y1: object.start[1] * blockHeight / gm,
					width: blockWidth,
					height: blockHeight,
					size: size,
					percentage: object.charge
				})
				
				if (object.offensive) {
					var marginY = blockHeight / size
					var width = blockWidth / size / 3
					var maxHeight = blockHeight - marginY * 2
					var height = convertRange(object.charge, [0, 100], [0, -maxHeight])
					
					rectangle({
						ctx: canvas[layer],
						shape: defaultShapes.light,
						x1: object.start[0] * blockWidth / gm + width,
						y1: object.start[1] * blockHeight / gm + blockHeight - marginY,
						width: width,
						height: height,
						alpha: 0.75
					})
				}
			}
		}
	}

	function newElement(objects, key, p) {
		var object = objects[p]
		for (var r in players) {
			if (key != r) {
				var start = objects[p].start
				var end = objects[p].end

				//change direction to right
				if (r == 'player2') end[0] = horizontal - gm

				// make a temporary hole into the grid
				grid = setWalkableAt(grid, gm, start[0], start[1], true)

				// see if a path was found using default positions
				var path = finder.findPath(start[0], start[1], end[0], end[1], grid.clone())

				//if something is blocking, then find a better path
				if (!path.length) path = findOpenPath({ finder: finder, grid: grid, gm: gm, height: vertical, start: start, end: end })

				grid = setWalkableAt(grid, gm, objects[p].start[0], objects[p].start[1], false)

				var element = {
					id: players[r].elements.length,
					playerId: key,
					type: object.type,
					start: start,
					end: end,
					path: path,
					dynamics: {
						totalHealth: defaultHealth,
						health: defaultHealth
					}
				}

				socket.emit('message', { action: SET_ELEMENT, data: { element: element, buildingIndex: p } })

				players[r].elements.push(element)
			}
		}
	}

	function attack(player) {
		var buildings = player.buildings ? player.buildings : []
		var x = 1
		for (var p = 0; p < buildings.length; p++) {
			if (!player.buildings[p].defensive) continue
			if (!player.buildings[p].built) continue

			var positionA = player.buildings[p].start
			for (var r = 0; r < player.elements.length; r++) {
				if (
					!player.elements[r].path ||
					!player.elements[r].path[x] ||
					!player.elements[r].path[x].length
				) continue

				var positionB = player.elements[r].path[x]
				if (!isNear(gm, positionA, positionB)) continue

				var projectile = {
					path: [
						player.buildings[p].start,
						player.elements[r].path[1]
					],
					shape: defaultShapes[player.buildings[p].type]
				}

				players[player.id].projectiles.push(projectile)
				players[player.id].buildings[p].dynamics.fired++
				break
			}
		}
	}

	function hit(player) {
		var projectiles = player.projectiles
		for (var p = 0; p < projectiles.length; p++) {
			var x1 = projectiles[p].path[1][0]
			var y1 = projectiles[p].path[1][1]

			for (var r = 0; r < player.elements.length; r++) {
				var element = player.elements[r]

				if (
					!element.path ||
					!element.path[1] ||
					!element.path[1].length
				) continue

				var x2 = element.path[1][0]
				var y2 = element.path[1][1]

				if (x1 == x2 && y1 == y2) {
					players[player.id].elements[r].dynamics.health = players[player.id].elements[r].dynamics.health - defaultDamage
					break
				}
			}
		}
	}

	// move the elements according to their positions in space and time
	function move(layer, type, key) {
		var objects = players[key] && players[key][type] ? players[key][type] : []

		for (var p = 0; p < objects.length; p++) {
			var object = objects[p]

			if (
				!object.path ||
				!object.path[1] ||
				!object.path[1].length
			) continue

			var x1 = object.path[0][0] * blockWidth / gm
			var y1 = object.path[0][1] * blockHeight / gm
			var x2 = object.path[1][0] * blockWidth / gm
			var y2 = object.path[1][1] * blockHeight / gm
			var dt = (new Date).getTime() - time
			var dx = x1 - (x1 - x2) * dt / tick
			var dy = y1 - (y1 - y2) * dt / tick

			if (client) {
				if (object.type) {
					var health = object.dynamics.health >= 0 ? object.dynamics.health : 0
					var percentage = convertRange(health, [0, object.dynamics.totalHealth], [0, 100])

					donut({
						ctx: canvas[layer],
						shape: defaultShapes[object.type],
						percentage: percentage,
						x1: dx,
						y1: dy,
						x2: blockWidth,
						y2: blockHeight,
						alpha: 0.55
					})
				}
				else {
					dot({
						ctx: canvas[layer],
						shape: object.shape,
						x1: dx,
						y1: dy,
						x2: blockWidth,
						y2: blockHeight
					})
				}
			}
		}
	}

	function walkBuildings(player) {
		for (var i = 0; i < player.buildings.length; i++) {
			grid = setWalkableAt(grid, gm, player.buildings[i].start[0], player.buildings[i].start[1], false)
		}
	}

	function increaseEnergy(player, amount = defaultBuildings.turbine.income) {
		players[player.id].energy = players[player.id].energy + amount
	}

	function decreaseEnergy(player, amount = 1) {
		players[player.id].energy = players[player.id].energy - amount
	}

	function energy(player) {
		for (var i = 0; i < player.buildings.length; i++) {
			var building = player.buildings[i]

			if (
				building.producer == true &&
				building.built == true
			) {
				increaseEnergy(player)
			}
		}
	}

	function broadcastEnergy() {
		var currentPlayer = {}

		for (var p in players) {
			currentPlayer[p] = {}
			currentPlayer[p].energy = players[p].energy
			
			for (var r in players) {
				if (p == r) continue
				
				currentPlayer[p].energyShare = players[p].energy / players[r].energy * 100
			}
		}

		socket.emit('message', { action: SET_ENERGY, data: currentPlayer })
	}

	function end(player) {
		if (player.energy < 0) gameOver = true
	}

	setInterval(function() {
		time = (new Date).getTime()

		for (var p in players) {
			walkBuildings(players[p]) // just a safety measure, because collion's setwalkable isn't sometimes firing
			hit(players[p])
			deepHit(players[p])
			health(players[p])
			resetProjectiles(players[p])
			shiftPaths(players[p])
		}

		// then run the last part because deep projectiles couldn't be updated otherwise
		for (var p in players) {
			collision(p)
			attack(players[p])

			if (!gameOver) {
				energy(players[p])
				end(players[p])
			}
		}

		if (host && !gameOver) broadcastEnergy()
	}, tick)

	if (host) {
		setInterval(function() {
			for (var p in players) animate(p)
		}, tick / 60)
	}

	function animationFrame() {
		requestAnimationFrame(animationFrame)
		if (client) canvas.movement.clearRect(0, 0, w, h)
		for (var p in players) animate(p)
	}
	if (client) requestAnimationFrame(animationFrame)

	function animate(key) {
		charge('movement', 'buildings', key)
		if (client) {
			move('movement', 'elements', key)
			move('movement', 'projectiles', key)
			move('movement', 'deepProjectiles', key)
		}
	}
}
