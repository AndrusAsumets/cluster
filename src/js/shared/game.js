var io = require('socket.io-client')
var PF = require('pathfinding')

import { CONNECT, GET_STATE, SET_STATE, SET_ENERGY, SET_ELEMENT, SET_BUILDING, SET_UPGRADE, SET_SELL, SET_BUILDING_DAMAGE } from './actions'
import { defaultEnergy, defaultHealth, defaultDamage, defaultAbsorb, defaultShapes, defaultBuildings, defaultOptions } from './defaults'
import { convertRange, size, getUrlParams } from './helpers'
import { buildPopup, selectFromPopup } from './menu'
import { isNear, setWalkableAt, findOpenPath, findBuildingIndex, createBoundaries, findBoundary, getSide } from './util'
import { createMatrix, ctx, chessboard, line, rectangle, circle, dot, donut, image, label, drawBoundaries } from './draw'
import { dotGroup } from './draw/dot-group'
import { upgrade, sell, upgradeCost, sellBackValue } from './dynamic'

export function game() {
	// gameplay
	const tick = 1000 // how often should the events happen
	const cooldown = 2 // how often should the buildings create new elements
	const fps = 60
	var gameOver = false
	var time = (new Date).getTime()
	var players = {}

	// platform
	const client = window ? true : false
	const host = !window ? true : false

	// window
	const smallHorizontal = 14 // how many blocks to have on x scale
	const smallVertical = 7 // how many blocks to have on y scale
	const gm = 3 // grid multiplier (how much to upscale the grid for gameplay)
	const horizontal = smallHorizontal * gm
	const vertical = smallVertical * gm
	const sizes = client ? size() : { x: horizontal, y: vertical }
	const marginBottom = sizes.y / smallVertical + 1 // height of the scoring menu in pixels
	const w = sizes.x
	const h = sizes.y - marginBottom
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
		this.energy = defaultEnergy
		this.boundaries = []
	}

	var canvas = {}

	if (client) {
		var container = document.createElement('div')
		container.className = 'player'
		document.getElementsByClassName('game')[0].appendChild(container)
		canvas = {
			background: ctx(container, 'background', w, h, 1),
			movement: ctx(container, 'movement', w, h, 2),
			boundaries: ctx(container, 'boundaries', w, h, 3),
			start: ctx(container, 'start', w, h, 4),
			selection: ctx(container, 'selection', w, h, 5),
			menu: ctx(container, 'menu', w, (h + marginBottom) / smallVertical, 6)
		}

		// create a visual UI grid
		/*
		chessboard({
			canvas: canvas.background,
			shape1: defaultShapes.dark,
			shape2: defaultShapes.background,
			smallHorizontal: smallHorizontal,
			smallVertical: smallVertical,
			blockWidth: blockWidth,
			blockHeight: blockHeight,
			alpha: 0.25
		})
		*/
		
		for (var i = 0; i < smallHorizontal + 2; i++) {
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

		for (var i = 0; i < smallVertical + 2; i++) {
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

		line({
			ctx: canvas.background,
			shape: defaultShapes.dark,
			x1: w / 2,
			y1: 0,
			x2: w / 2,
			y2: h,
			alpha: 0.75
		})

		document.getElementsByClassName(container.className)[0].addEventListener('touchstart', function(event) { createMenu(event) })
		document.getElementsByClassName(container.className)[0].addEventListener('mousedown', function(event) { createMenu(event) })
	}

	// networking
	var me = client ? getUrlParams('me') : null
	if (!me && !host) return console.log('add ?me=some_player_id to your url')
	
	// development
	var dev = client && getUrlParams('dev') ? true : false

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
						boundaries({ playerId: key })

						for (var i = 0; i < data[key].buildings.length; i++) {
							grid = setWalkableAt(grid, gm, data[key].buildings[i].start[0], data[key].buildings[i].start[1], false)
						}
						
						if (key == me) showStartingPosition()
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
				if (player.energy - data.buildings[building.type].cost < 0) return

				// check if there's an building on that location already
				if (Number.isInteger(findBuildingIndex(player.buildings, building))) return

				decreaseEnergy(players[building.playerId], data.buildings[building.type].cost)
				players[building.playerId].buildings.push(building)
				for (var p in players) createPaths(players[p])
				
				if (client) canvas.start.clearRect(0, 0, w, h)
				
				// find boundaries where the player would be able to build
				boundaries({ playerId: building.playerId })
				
				break
			
			case SET_BUILDING_DAMAGE:
				var playerId = data.playerId
				var buildingIndex = data.buildingIndex
				var damage = data.damage
				var health = players[playerId].buildings[buildingIndex].health - damage
				
				if (health < 1) players[playerId].buildings.splice(buildingIndex, 1)
				else players[playerId].buildings[buildingIndex].health = health
				
				// find boundaries where the player would be able to build
				boundaries({ playerId: playerId })
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

			case SET_UPGRADE:
				players[data.playerId] = upgrade({ player: players[data.playerId], buildingIndex: data.buildingIndex })
				break

			case SET_SELL:
				players[data.playerId] = sell({ player: players[data.playerId], buildingIndex: data.buildingIndex })
				
				// find boundaries where the player would be able to build
				boundaries({ playerId: data.playerId })
				
				 
				if (client) {
					if (data.playerId == me) canvas.selection.clearRect(0, 0, w, h)
					if (!players[data.playerId].buildings.length) showStartingPosition()
				}
				break
		}
	})

	var gameMenu = {}
	function createMenu(event) {
		if (gameOver) return

		event.preventDefault()
		if ('touches' in event) event = event.touches[0]
		
		canvas.menu.clearRect(0, 0, w, h)
		
		showStartingPosition()

		var x = event.clientX
		var y = event.clientY
		
		var user = dev
			? x < w / 2
				? 'player1'
				: 'player2'
			: me
		
		var side = getSide(user)
		var player = players[user]
		
		var yBlock = Math.floor(y / blockHeight)
		var xBlock = Math.floor(x / blockWidth)
		var menuXBlock = side == 'left'
			? Math.floor(x / (h / (smallVertical - 1)))
			: Math.floor((event.clientX - w / 2) / (h / (smallVertical - 1)))
		var buildingIndex = findBuildingIndex(player.buildings, { 
			start: gameMenu.xBlock && gameMenu.yBlock
				? [gameMenu.xBlock * gm, gameMenu.yBlock * gm]
				: [xBlock * gm, yBlock * gm]
		})
		var building = player.buildings[buildingIndex]
		var buildingIsFound = buildingIndex > -1
		var inBounds = findBoundary(players[user].boundaries, { x: xBlock * gm, y: yBlock * gm })
		
		var inCenter
		if (
			user == 'player1' &&
			xBlock == Math.floor(smallHorizontal / 4) &&
			yBlock == Math.floor(smallVertical / 2) &&
			!buildingIsFound
		) inCenter = true
		
		else if (
			user == 'player2' &&
			xBlock == Math.floor(smallHorizontal * 3 / 4) &&
			yBlock == Math.floor(smallVertical / 2) &&
			!buildingIsFound
		) inCenter = true
		
		// disallow for clicking on the opposite side
		if (
			(side == 'left' && xBlock * gm >= horizontal / 2 && !gameMenu.x) ||
			(side == 'right' && xBlock * gm < horizontal / 2 && !gameMenu.x)
		) {
			gameMenu = {}
			canvas.selection.clearRect(0, 0, w, h)
			return
		}
			
		else if (
			(
				'xBlock' in gameMenu &&
				'yBlock' in gameMenu &&
				yBlock >= smallVertical
			)
		) {
			var buildings = Object.keys(gameMenu.submenu ? gameMenu.submenu : defaultBuildings)
			var type = buildings[menuXBlock]
			if (!type) return gameMenu = {}
			var submenu = defaultBuildings[type] ? defaultBuildings[type].submenu : {} // submenu
			
			// choose from the options (upgrade, sell, etc.)
			if (gameMenu.options) {				
				var optionType = Object.keys(defaultOptions)[menuXBlock]
				
				var message = {
					action: defaultOptions[optionType].action,
					data: { playerId: user, buildingIndex: buildingIndex }
				}
			
				socket.emit('message', message)
				
				// leave the menu open if there are more upgrades left
				if (building.level > 2) {
					gameMenu = {}
					canvas.selection.clearRect(0, 0, w, h)
				}
				else {
					gameMenu.upgrading = true
				}
			}

			// choose from a second level popup
			else if (gameMenu.submenu) {
				selectFromPopup({
					player: player,
					buildings: gameMenu.submenu,
					building: building,
					socket: socket,
					gameMenu: gameMenu,
					xBlock: menuXBlock,
					gm: gm,
					type: type
				})
				
				gameMenu = {}
				canvas.selection.clearRect(0, 0, w, h)
			}

			// if a building has no options
			else if (!submenu) {
				
				// select from the first level popup
				selectFromPopup({
					player: player,
					buildings: defaultBuildings,
					socket: socket,
					gameMenu: gameMenu,
					xBlock: menuXBlock,
					gm: gm,
					type: type
				})
				
				gameMenu = {}
				canvas.selection.clearRect(0, 0, w, h)
			}

			else {
				canvas.selection.clearRect(0, 0, w, h)

				//highlight the selected building block
				rectangle({
					ctx: canvas.selection,
					shape: defaultShapes.light,
					x1: gameMenu.xBlock * blockWidth,
					y1: gameMenu.yBlock * blockHeight,
					width: blockWidth,
					height: blockHeight,
					alpha: 0.1
				})

				// build a second level popup
				buildPopup({
					canvas: canvas,
					buildings: submenu,
					blockWidth: blockWidth,
					blockHeight: blockHeight,
					xBlock: xBlock,
					yBlock: yBlock,
					side: side,
					width: w,
					height: (h + marginBottom) / smallVertical,
					vertical: vertical,
					gm: gm
				})

				gameMenu.submenu = submenu
			}
		}
		
		// menu for upgrade, sell etc.
		else if (player.buildings[findBuildingIndex(player.buildings, { start: [xBlock * gm, yBlock * gm] })]) {
			canvas.selection.clearRect(0, 0, w, h)
			
			// make sure we're working with the current building
			building = player.buildings[findBuildingIndex(player.buildings, { start: [xBlock * gm, yBlock * gm] })]
			
			var buildings = {}
			var sell = defaultOptions.sell
			var upgrade = defaultOptions.upgrade
			
			if (building) {
				var cost = building.cost
				var level = building.level
				
				buildings.sell = {}
				buildings.sell.cost = building.level ? sellBackValue({ building: building }) : false
				buildings.sell.level = level
				buildings.upgrade = {}
				buildings.upgrade.cost = cost && building.level ? upgradeCost({ building: building }) : false
				buildings.upgrade.level = level
			}
			
			// build a second level popup
			buildPopup({
				canvas: canvas,
				buildings: buildings,
				blockWidth: blockWidth,
				blockHeight: blockHeight,
				xBlock: xBlock,
				yBlock: yBlock,
				side: side,
				width: w,
				height: (h + marginBottom) / smallVertical,
				vertical: vertical,
				gm: gm
			})
			
			gameMenu = { xBlock: xBlock, yBlock: yBlock, options: true }
		}

		//build a first level popup
		else if (
			(
				!gameMenu.xBlock &&
				!gameMenu.yBlock &&
				yBlock < smallVertical &&
				inCenter
			)
			||
			inBounds
		) {
			canvas.selection.clearRect(0, 0, w, h)
			
			buildPopup({
				canvas: canvas,
				building: building,
				buildings: defaultBuildings,
				blockWidth: blockWidth,
				blockHeight: blockHeight,
				xBlock: xBlock,
				yBlock: yBlock,
				side: side,
				width: w,
				height: (h + marginBottom) / smallVertical,
				vertical: vertical,
				gm: gm
			})

			gameMenu = { xBlock: xBlock, yBlock: yBlock, menu: true }
		}
		
		// otherwise just clear the menu
		else {
			gameMenu = {}
			canvas.selection.clearRect(0, 0, w, h)
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
				decreaseEnergy(player, defaultAbsorb * players[player.id].elements[p].level)
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

	function elementCollision(p) {
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

					if (isNear(1, positionA, positionB)) {
						var projectile = {
							path: [
								player.elements[r].path[a - 1],
								anotherPlayer.elements[r2].path[b]
							],
							shape: defaultShapes[player.elements[r].type],
							level: player.elements[r].level
						}

						players[anotherPlayer.id].deepProjectiles.push(projectile)

						var projectile = {
							path: [
								anotherPlayer.elements[r2].path[a - 1],
								player.elements[r].path[b]
							],
							shape: defaultShapes[anotherPlayer.elements[r2].type],
							level: anotherPlayer.elements[r2].level
						}

						players[player.id].deepProjectiles.push(projectile)

						break
					}
				}
			}
		}
	}
	
	function buildingCollision(p) {
		var player = players[p]
		var a = 0
		var b = 0

		for (var r = 0; r < player.elements.length; r++) {
			if (
				!player.elements &&
				!player.elements.length &&
				!player.elements[r] &&
				!player.elements[r].length &&
				!player.elements[r].path &&
				!player.elements[r].path[a] &&
				!player.elements[r].path[a].length &&
				!player.elements[r].path[a][2]
			) continue
			
			// only deal damage when threshold has been exceeded
			if (player.elements[r].path[a][2] < 9) continue

			var positionA = player.elements[r].path[a]
			if (!positionA) continue
			if (!positionA.length) continue
			
			var damage = player.elements[r].dynamics.damage

			for (var p2 in players) {
				if (p == p2) continue
				
				var anotherPlayer = players[p]

				for (var r2 = 0; r2 < anotherPlayer.buildings.length; r2++) {
					var positionB = anotherPlayer.buildings[r2].start
					
					if (!positionB) continue
					if (!positionB.length) continue

					if (isNear(1, positionA, positionB)) {
						if (host) socket.emit('message', { action: SET_BUILDING_DAMAGE, data: { playerId: p, buildingIndex: r2, damage: damage } })
						
						break
					}
				}
			}
		}
	}

	function charge(layer, type, key) {
		var objects = players[key][type] ? players[key][type] : []
		for (var p = 0; p < objects.length; p++) {
			var object = objects[p]
			var pattern = object.pattern
			
			if (!object.offensive) players[key].buildings[p].built = true

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

			if (client) {
				var size = 3.5				
				var level = object.level
				var marginX = blockWidth / size
				var marginY = blockHeight / size
				var width = blockWidth / size / 3
				var maxWidth = blockWidth - marginX * 2
				var maxHeight = blockHeight - marginY * 2
				
				var sizes = []
				for (var i = 0; i < object.level; i++) sizes.push(1)
					
				dotGroup({
					count: object.level,
					ctx: canvas[layer],
					shape: defaultShapes.light,
					width: width,
					x1: object.start[0] * blockWidth / gm + width,
					y1: (object.start[1] + 2) * blockHeight / gm - (blockHeight / 24),
					maxWidth: maxWidth,
					maxHeight: maxHeight,
					sizes: sizes,
					alpha: 0.75
				})
				
				if (pattern) {
					var count = 3
					for (var i = 0; i < pattern.length; i++) {
						var centeredVertically = (i + 2) % count
						
						if (centeredVertically === 0) {
							var column = pattern[i]
							
							var sizes = []
							var side = getSide(key)
							if (side == 'left') {
								for (var j = 0; j < pattern.length; j++) {
									var centeredHorizontally = (j + 2) % count
									
									if (centeredHorizontally === 0) {
										var block = column[j] / count
										sizes.push(block)
									}
								}
							}
							else {
								for (var j = pattern.length - 1; j > 0; j--) {
									var centeredHorizontally = (j + 2) % count
									
									if (centeredHorizontally === 0) {
										var block = column[j] / count
										sizes.push(block)
									}
								}					
							}
							
							dotGroup({
								count: count,
								ctx: canvas[layer],
								shape: defaultShapes.blue,
								width: width,
								x1: object.start[0] * blockWidth / gm + width,
								y1: object.start[1] * blockHeight / gm + (blockHeight / 17) * i + (blockHeight / 24),
								maxWidth: maxWidth,
								maxHeight: maxHeight,
								sizes: sizes,
								alpha: 0.75
							})
						}
					}
				}
				
				else {
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
				}

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
				
				
				// health label
				label({
					ctx: canvas[layer],
					string: object.health,
					shape: defaultShapes.light,
					x1: object.start[0] * blockWidth / gm + blockWidth / 2,
					y1: object.start[1] * blockHeight / gm + blockHeight / 8,
					height: blockHeight,
					size: 10,
					center: true
				})
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
				
				var pattern = objects[p].pattern
				
				var patternizedPath = patternizePath(path, pattern)

				var element = {
					id: players[r].elements.length,
					playerId: key,
					type: object.type,
					start: patternizedPath[0],
					end: patternizedPath[patternizedPath.length - 1],
					path: patternizedPath,
					level: object.level,
					dynamics: {
						totalHealth: defaultHealth * object.level,
						health: defaultHealth * object.level,
						damage: defaultDamage * object.level
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
					shape: defaultShapes[player.buildings[p].type],
					level: player.buildings[p].level
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
					var health = players[player.id].elements[r].dynamics.health
					var damage = defaultDamage * projectiles[p].level
					players[player.id].elements[r].dynamics.health = health - damage
					break
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
					var health = players[player.id].elements[r].dynamics.health
					var damage = defaultDamage * projectiles[p].level
					players[player.id].elements[r].dynamics.health = health - damage
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
					var size = object.path[1][2] | 0

					donut({
						ctx: canvas[layer],
						shape: defaultShapes[object.type],
						percentage: percentage,
						x1: dx,
						y1: dy,
						width: blockWidth,
						height: blockHeight,
						alpha: 0.66,
						size: object.level * size / 9
					})
				}
				else {
					dot({
						ctx: canvas[layer],
						shape: object.shape,
						x1: dx,
						y1: dy,
						width: blockWidth,
						height: blockHeight,
						size: object.level
					})
				}
			}
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
				increaseEnergy(player, building.level)
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

	function showStartingPosition() {
		canvas.start.clearRect(0, 0, w, h)
		
		if (!players[me].buildings.length) {
			var position = me == 'player1'
				? [Math.floor(smallHorizontal / 4), Math.floor(smallVertical / 2)]
				: [Math.floor(smallHorizontal * 3 / 4), Math.floor(smallVertical / 2)]

			rectangle({
				ctx: canvas.start,
				shape: defaultShapes.light,
				x1: position[0] * blockWidth,
				y1: position[1] * blockHeight,
				width: blockWidth,
				height: blockHeight,
				alpha: 0.05
			})
		}
	}
	
	function boundaries(o) {
		var side = getSide(o.playerId)
		players[o.playerId].boundaries = createBoundaries({ side: side, buildings: players[o.playerId].buildings, width: horizontal, height: vertical, gm: gm })
		if (client) drawBoundaries({ canvas: canvas.boundaries, boundaries: players[o.playerId].boundaries, width: w, height: h, blockWidth: blockWidth, blockHeight : blockHeight, gm: gm, side: side })
	}
	
	function patternizePath(path, pattern) {
		var patternizedPath = []
		var lastRow = 0
		
		for (var i = 2; i < path.length - 2; i++) {
			if (lastRow > pattern.length - 1) lastRow = 0
			
			var step = alterStep(path[i], pattern, lastRow)
			
			patternizedPath.push(step)
			lastRow++
		}
		
		return patternizedPath
	}
	
	function alterStep(step, pattern, lastRow) {
		var extra = -gm - 1
		
		for (var column = 0; column < pattern.length; column++) {
			var block = pattern[column][lastRow]
			
			if (block > 0) return [step[0], step[1] + column + extra, block]
		}
		
		return step
	}

	setInterval(function() {
		time = (new Date).getTime()

		for (var p in players) {
			hit(players[p])
			deepHit(players[p])
			health(players[p])
			resetProjectiles(players[p])
			shiftPaths(players[p])
		}

		// then run the last part because deep projectiles couldn't be updated otherwise
		for (var p in players) {
			elementCollision(p)
			buildingCollision(p)
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
		}, tick / fps)
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
			//move('movement', 'deepProjectiles', key)
		}
	}
}
