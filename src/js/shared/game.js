var io = require('socket.io-client')
var PF = require('pathfinding')

import { CONNECT, GET_STATE, SET_STATE, SET_ENERGY, SET_ELEMENT, SET_BUILDING, SET_UPGRADE, SET_SELL, SET_REPAIR, SET_BUILDING_DAMAGE } from './actions'
import { defaultEnergy, defaultHealth, defaultDamage, defaultShapes, defaultBuildings, defaultOptions, defaultResourceCount, defaultResourceMultiplier } from './defaults'
import { convertRange, size, getUrlParams } from './helpers'
import { buildPopup, selectFromPopup } from './menu'
import { isNear, setWalkableAt, findOpenPath, findBuildingIndex, createBoundaries, findBoundary, getSide, getSideColor, createResource, isOnResource } from './util'
import { createMatrix, ctx, chessboard, line, rectangle, circle, dot, donut, image, label, drawBoundaries } from './draw'
import { dotGroup } from './draw/dot-group'
import { upgrade, sell, upgradeCost, sellBackValue, calculateDamage, repair } from './dynamic'

export function game() {
	// gameplay
	const tick = 1000 // how often should the events happen
	const fps = 60
	const speed = convertRange(1 / fps * 2, [0, fps], [0, 100])
	var charge = 0
	var gameOver = false
	var time = (new Date).getTime()
	var players = {}

	// platform
	const client = window ? true : false
	const host = !window ? true : false

	// window
	const smallHorizontal = 10 // how many blocks to have on x scale
	const smallVertical = 5 // how many blocks to have on y scale
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

	// resources
	var resources = {
		left: [],
		right: []
	}

	if (host) {
		for (var i = 0; i < defaultResourceCount; i++) {
			var resource = createResource({ width: smallHorizontal / 2, height: smallVertical, resources: resources.left })

			resources.left.push(resource)
			resources.right.push({ x: smallHorizontal - resource.x - 1, y: smallVertical - resource.y - 1 })
		}
	}

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
			background: ctx(container, 'background', w, h, false),
			buildings: ctx(container, 'buildings', w, h, false),
			boundaries: ctx(container, 'boundaries', w, h, false),
			start: ctx(container, 'start', w, h, false),
			selection: ctx(container, 'selection', w, h, false),
			movement: ctx(container, 'movement', w, h, true),
			menu: ctx(container, 'menu', w, (h + marginBottom) / smallVertical, true)
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

					socket.emit('message', { action: SET_STATE, data: { players: players, resources: resources }})
				}
				break

			case SET_STATE:
				if (client) {
					resources = data.resources

					for (var key in data.players) {
						if (!players[key]) players[key] = new Player({ id: key })

						players[key].buildings = data.players[key].buildings
						players[key].elements = data.players[key].elements
						boundaries({ playerId: key })

						for (var i = 0; i < players[key].elements.length; i++) {
							var side = getSide(key)
							var shape = getSideColor(defaultShapes, side == 'left' ? 'right' : 'left')
							players[key].elements[i].shape = shape
						}

						if (key == me) showStartingPosition()

						refreshBuildings()
					}
				}
				break

			case SET_ENERGY:
				if (client) {
					for (var key in data) {
						if (!players[key]) continue

						players[key].energy = data[key].energy
						document.getElementsByClassName('score-' + key)[0].innerHTML = Math.floor(data[key].energy)
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

				if (client) {
					canvas.start.clearRect(0, 0, w, h)
					refreshBuildings()
				}

				// find boundaries where the player would be able to build
				boundaries({ playerId: building.playerId })

				break

			case SET_BUILDING_DAMAGE:
				var playerId = data.playerId
				var buildingIndex = data.buildingIndex
				var elementIndex = data.elementIndex
				var damage = data.damage
				var currentBuildingHealth = players[playerId].buildings[buildingIndex].health
				var health = currentBuildingHealth - damage
				var elementHealth = players[playerId].elements[elementIndex].dynamics.health
				var extra = 0

				if (health < 1) {
					players[playerId].buildings.splice(buildingIndex, 1)
					extra = Math.abs(health) // but don't destroy the element just yet
				}
				else {
					players[playerId].buildings[buildingIndex].health = health
				}

				if (elementHealth < 1) players[playerId].elements[elementIndex].path = []
				else players[playerId].elements[elementIndex].dynamics.health = elementHealth - damage + extra

				// find boundaries where the player would be able to build
				boundaries({ playerId: playerId })

				if (client) refreshBuildings()
				break

			case SET_ELEMENT:
				var element = data.element
				var playerId = element.playerId
				var buildingIndex = data.buildingIndex

				var side = getSide(playerId)
				var shape = getSideColor(defaultShapes, side)
				element.shape = shape

				for (var key in players) if (key != playerId) players[key].elements.push(element)

				charge = 0

				break

			case SET_UPGRADE:
				players[data.playerId] = upgrade({ player: players[data.playerId], buildingIndex: data.buildingIndex })

				if (client) refreshBuildings()
				break

			case SET_SELL:
				players[data.playerId] = sell({ player: players[data.playerId], buildingIndex: data.buildingIndex })

				// find boundaries where the player would be able to build
				boundaries({ playerId: data.playerId })

				if (client) {
					if (data.playerId == me) canvas.selection.clearRect(0, 0, w, h)
					if (!players[data.playerId].buildings.length) showStartingPosition()
					refreshBuildings()
				}
				break

			case SET_REPAIR:
				players[data.playerId] = repair({ player: players[data.playerId], buildingIndex: data.buildingIndex })

				if (client) refreshBuildings()
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
		
		var xBlock = Math.floor(x / blockWidth)
		var yBlock = Math.floor(y / blockHeight)
		var menuXBlock = side == 'left'
			? Math.floor(x / (h / (smallVertical - 1)))
			: Math.floor((event.clientX - w / 2) / (h / (smallVertical - 1)))
			
		var buildingIndex = findBuildingIndex(player.buildings, {
			start: Number.isInteger(gameMenu.xBlock) && Number.isInteger(gameMenu.yBlock)
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
				var upgradeable = players[user].buildings[buildingIndex].level < 3 ? true : false

				// select repair instead
				if (optionType == 'upgrade' && !upgradeable) optionType = 'repair'

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
				var message = selectFromPopup({
					player: player,
					side: side,
					resources: resources,
					buildings: gameMenu.submenu,
					building: building,
					gameMenu: gameMenu,
					xBlock: menuXBlock,
					gm: gm,
					type: type
				})

				socket.emit('message', message)

				gameMenu = {}
				canvas.selection.clearRect(0, 0, w, h)
			}

			// if a building has no options
			else if (!submenu) {

				// select from the first level popup
				var message = selectFromPopup({
					player: player,
					side: side,
					resources: resources,
					buildings: defaultBuildings,
					gameMenu: gameMenu,
					xBlock: menuXBlock,
					gm: gm,
					type: type
				})

				socket.emit('message', message)

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
			var repair = defaultOptions.repair

			if (building) {
				var cost = building.cost
				var level = building.level

				buildings.sell = {}
				buildings.sell.cost = building.level ? sellBackValue({ building: building }) : false
				buildings.sell.level = level

				buildings.upgrade = {}
				buildings.upgrade.cost = cost && building.level ? upgradeCost({ building: building }) : false
				buildings.upgrade.level = level

				buildings.repair = {}
				buildings.repair.cost = building.initialHealth * building.level - building.health > 0 ? building.initialHealth * building.level - building.health : false
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

		else if (
			(
					dev
				&&
					(
						xBlock == smallHorizontal / 2
					||
						xBlock == smallHorizontal / 2 - 1
					)
				&&
					yBlock > smallVertical - 1
			)
		) {
			socket.emit('restart')
		}

		// otherwise just clear the menu
		else {
			gameMenu = {}
			canvas.selection.clearRect(0, 0, w, h)
		}
	}

	function displayResources(o) {
		var resources = o.resources

		for (var i = 0; i < resources.length; i++) {
			var x1 = resources[i].x
			var y1 = resources[i].y

			image({
				ctx: canvas.buildings,
				type: 'resource',
				file: defaultShapes.resource.file,
				x1: x1 * blockWidth,
				y1: y1 * blockHeight,
				width: blockWidth,
				height: blockHeight,
				size: 14,
				alpha: 0.4
			})
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

			if (element.inactive) {
				continue
			}
			else if (
				!element.path ||
				!element.path[1] ||
				!element.path[1].length
			) {
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

				var last = path.length - 1

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
						if (positionB[2] == 9) {
							var projectile = {
								path: [
									player.elements[r].path[a - 1],
									anotherPlayer.elements[r2].path[b]
								],
								shape: defaultShapes[player.elements[r].type],
								level: player.elements[r].level,
								dynamics: {
									damage: anotherPlayer.elements[r2].dynamics.damage
								}
							}

							players[player.id].deepProjectiles.push(projectile)
						}

						if (positionA[2] == 9) {
							var projectile = {
								path: [
									anotherPlayer.elements[r2].path[a - 1],
									player.elements[r].path[b]
								],
								shape: defaultShapes[anotherPlayer.elements[r2].type],
								level: anotherPlayer.elements[r2].level,
								dynamics: {
									damage: player.elements[r].dynamics.damage
								}
							}

							players[anotherPlayer.id].deepProjectiles.push(projectile)
						}

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

			// only deal damage when threshold has been exceeded
			if (
				!player.elements[r].path ||
				!player.elements[r].path.length ||
				!player.elements[r].path[a] ||
				!player.elements[r].path[a][2]
			) continue

			var positionA = player.elements[r].path[a]
			if (!positionA) continue
			if (!positionA.length) continue

			var damage = player.elements[r].dynamics.damage

			for (var p2 in players) {
				if (p == p2) continue

				var anotherPlayer = players[p]

				for (var r2 = 0; r2 < anotherPlayer.buildings.length; r2++) {
					var positionB = anotherPlayer.buildings[r2].start

					if (
						player.elements[r].path[a][2] == 9 ||
						anotherPlayer.buildings[r2].defensive
					) {}
					else continue

					if (!positionB) continue
					if (!positionB.length) continue

					if (isNear(1, positionA, positionB)) {
						if (host) socket.emit('message', { action: SET_BUILDING_DAMAGE, data: { playerId: p, buildingIndex: r2, damage: damage, elementIndex: r } })

						break
					}
				}
			}
		}
	}

	function refreshBuildings() {
		canvas.buildings.clearRect(0, 0, w, h)

		displayResources({ resources: resources.left })
		displayResources({ resources: resources.right })

		for (var p in players) {
			displayBuildings('buildings', 'buildings', p)
		}
	}

	function displayBuildings(layer, type, key) {
		var objects = players[key][type] ? players[key][type] : []

		for (var p = 0; p < objects.length; p++) {
			var side = getSide(key)
			var object = objects[p]
			var pattern = object.pattern
			var size = 3.5
			var level = object.level
			var marginX = blockWidth / size
			var marginY = blockHeight / size
			var width = blockWidth / size / 3
			var height = blockHeight / size / 3
			var maxWidth = blockWidth - marginX * 2
			var maxHeight = blockHeight - marginY * 2
			var onResource = isOnResource(resources[side], object.start[0] / gm, object.start[1] / gm)
			var initialHealth = onResource ? object.initialHealth * defaultResourceMultiplier : object.initialHealth

			/*`
			// show level bar
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
			*/

			// show pattern
			if (pattern) {
				var count = 3

				for (var i = 0; i < pattern.length; i++) {
					var centeredVertically = (i + 2) % count

					if (centeredVertically === 0) {
						var column = pattern[i]

						var sizes = []
						if (side == 'left') {
							for (var j = 0; j < pattern.length; j++) {
								var centeredHorizontally = (j + 2) % count

								if (centeredHorizontally === 0) {
									var block = column[j] / count
									sizes.push(block - 0.5)
								}
							}
						}
						else {
							for (var j = pattern.length - 1; j > 0; j--) {
								var centeredHorizontally = (j + 2) % count

								if (centeredHorizontally === 0) {
									var block = column[j] / count
									sizes.push(block - 0.5)
								}
							}
						}

						var side = getSide(key)
						var shape = getSideColor(defaultShapes, side)

						dotGroup({
							count: count,
							ctx: canvas[layer],
							shape: shape,
							width: width,
							x1: object.start[0] * blockWidth / gm + width,
							y1: object.start[1] * blockHeight / gm + (blockHeight / 17) * i + (blockHeight / 24),
							maxWidth: maxWidth,
							maxHeight: maxHeight,
							sizes: sizes,
							alpha: 1
						})
					}
				}

				var alpha = 0.33

				// grid
				line({
					ctx: canvas[layer],
					shape: defaultShapes.light,
					x1: object.start[0] * blockWidth / gm + (width * 4.25),
					y1: object.start[1] * blockHeight / gm + (height * 2.75),
					x2: object.start[0] * blockWidth / gm + (width * 4.25),
					y2: (object.start[1] + gm) * blockHeight / gm - (height * 2.75),
					alpha: alpha
				})

				line({
					ctx: canvas[layer],
					shape: defaultShapes.light,
					x1: object.start[0] * blockWidth / gm + (width * 4.25) + (width * 2),
					y1: object.start[1] * blockHeight / gm + (height * 2.75),
					x2: object.start[0] * blockWidth / gm + (width * 4.25) + (width * 2),
					y2: (object.start[1] + gm) * blockHeight / gm - (height * 2.75),
					alpha: alpha
				})

				line({
					ctx: canvas[layer],
					shape: defaultShapes.light,
					x1: object.start[0] * blockWidth / gm + (width * 2.5),
					y1: object.start[1] * blockHeight / gm + (height * 4.25),
					x2: (object.start[0] + gm) * blockWidth / gm - (width * 2.5),
					y2: object.start[1] * blockHeight / gm + (height * 4.25),
					alpha: alpha
				})

				line({
					ctx: canvas[layer],
					shape: defaultShapes.light,
					x1: object.start[0] * blockWidth / gm + (width * 2.5),
					y1: object.start[1] * blockHeight / gm + (height * 4.25) + (height * 2),
					x2: (object.start[0] + gm) * blockWidth / gm - (width * 2.5),
					y2: object.start[1] * blockHeight / gm + (height * 4.25) + (height * 2),
					alpha: alpha
				})
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

			// health label
			label({
				ctx: canvas[layer],
				string: object.health + ' / ' + (initialHealth * object.level),
				shape: defaultShapes.light,
				x1: object.start[0] * blockWidth / gm + blockWidth / 2,
				y1: (object.start[1] + gm) * blockHeight / gm - blockHeight / 7,
				height: blockHeight,
				size: 10,
				center: true
			})

			// damage label
			if (object.offensive) {
				var damage = object.damage

				label({
					ctx: canvas[layer],
					string: damage,
					shape: defaultShapes.light,
					x1: object.start[0] * blockWidth / gm + blockWidth / 2,
					y1: object.start[1] * blockHeight / gm + blockHeight / 8,
					height: blockHeight,
					size: 10,
					center: true
				})
			}

			// levels
			var marginY = blockHeight / size
			var width = blockWidth / size / 3
			var maxHeight = blockHeight - marginY * 2
			var height = convertRange(object.level, [0, 3], [0, -maxHeight])

			rectangle({
				ctx: canvas[layer],
				shape: defaultShapes.light,
				x1: object.start[0] * blockWidth / gm + width,
				y1: object.start[1] * blockHeight / gm + blockHeight - marginY,
				width: width,
				height: height,
				alpha: 0.5
			})
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
				var d1 = projectiles[p].path[1][2]

				if (
					x1 == x2 &&
					y1 == y2 &&
					x1 % 3 === 0 &&
					y1 % 3 === 0 &&
					d1 == 9
				) {
					var health = players[player.id].elements[r].dynamics.health
					var damage = projectiles[p].dynamics.damage
					players[player.id].elements[r].dynamics.health = health - damage
					if (players[player.id].elements[r].dynamics.health < 1) players[player.id].elements[r].path = []
					break
				}
			}
		}
	}

	// move the elements according to their positions in space and time
	function move(layer, type, key) {
		var objects = players[key] && players[key][type] ? players[key][type] : []
		var width = blockWidth / gm
		var height = blockHeight / gm
		var newTime = (new Date).getTime()

		for (var p = 0; p < objects.length; p++) {
			var object = objects[p]
			var path = object.path

			if (
				!path ||
				!path[1] ||
				!path[1].length
			) continue

			var x1 = path[0][0] * width
			var y1 = path[0][1] * height
			var x2 = path[1][0] * width
			var y2 = path[1][1] * height
			var dt = newTime - time
			var dx = x1 - (x1 - x2) * dt / tick
			var dy = y1 - (y1 - y2) * dt / tick

			if (object.type) {
				var health = object.dynamics.health >= 0 ? object.dynamics.health : 0
				var percentage = convertRange(health, [0, object.dynamics.totalHealth], [0, 100])
				var size = path[1][2] | 0

				donut({
					ctx: canvas[layer],
					shape: object.shape,
					percentage: percentage,
					x1: dx,
					y1: dy,
					width: blockWidth,
					height: blockHeight,
					alpha: 1,
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
				building.producer == true
			) {
				increaseEnergy(player, building.level * building.resource / 2)
			}
		}
	}

	function broadcastEnergy() {
		var currentPlayer = {}

		for (var p in players) {
			currentPlayer[p] = {}
			currentPlayer[p].energy = players[p].energy
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
				alpha: 0.15
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

		for (var i = 2; i < path.length; i++) {
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

	function createElements(p) {
		var objects = players[p].buildings

		for (var i = 0; i < objects.length; i++) {
			var object = objects[i]

			if (!object.offensive) continue

			for (var r in players) {
				if (p != r) {
					var start = object.start
					var end = object.end

					//change direction to right
					if (r == 'player2') end[0] = horizontal - gm

					// make a temporary hole into the grid
					grid = setWalkableAt(grid, gm, start[0], start[1], true)

					// see if a path was found using default positions
					var path = finder.findPath(start[0], start[1], end[0], end[1], grid.clone())

					var pattern = object.pattern
					var patternizedPath = patternizePath(path, pattern)

					var element = {
						id: players[r].elements.length,
						playerId: p,
						active: true,
						type: object.type,
						start: patternizedPath[0],
						path: patternizedPath,
						level: object.level,
						dynamics: {
							totalHealth: object.damage,
							health: object.damage,
							damage: object.damage
						}
					}

					socket.emit('message', { action: SET_ELEMENT, data: { element: element, buildingIndex: i } })
				}
			}
		}
	}

	function displayCharge(left, right) {
		var share = convertRange(charge, [0, 100], [0, w / 2])
		left.style.width = share + 'px'
		right.style.width = share + 'px'

		/*
		for (var i = 0; i < players[p].buildings.length; i++) {
			var object = players[p].buildings[i]

			if (!object.offensive) continue

			if (object.charge < 100) object.charge = object.charge + speed

			var size = 3.5
			var marginY = blockHeight / size
			var width = blockWidth / size / 3
			var maxHeight = blockHeight - marginY * 2
			var height = convertRange(object.charge, [0, 100], [0, -maxHeight])

			rectangle({
				ctx: canvas.movement,
				shape: defaultShapes.light,
				x1: (object.start[0] + gm) * blockWidth / gm - (width * 3 / 2) - (width / 3),
				y1: object.start[1] * blockHeight / gm + blockHeight - marginY,
				width: width,
				height: height,
				alpha: 0.75
			})

			players[p].buildings[i].charge = object.charge
		}
		*/
	}

	setInterval(function() {
		time = (new Date).getTime()

		for (var p in players) {
			deepHit(players[p])
			health(players[p])
			resetProjectiles(players[p])
			shiftPaths(players[p])
		}

		// then run the last part because deep projectiles couldn't be updated otherwise
		for (var p in players) {
			elementCollision(p)
			buildingCollision(p)

			if (!gameOver) {
				energy(players[p])
				end(players[p])
			}
		}

		if (host && !gameOver) broadcastEnergy()
	}, tick)

	// render
	function animationFrame() {
		canvas.movement.clearRect(0, 0, w, h)

		for (var p in players) move('movement', 'elements', p)

		requestAnimationFrame(animationFrame)
	}
	if (client) requestAnimationFrame(animationFrame)

	// create elements in the server
	if (host) {
		setInterval(function() {
			charge += speed

			if (Math.ceil(charge) >= 100) {
				charge = 0

				for (var p in players) createElements(p)
			}
		}, tick / fps)
	}

	// display charge bar
	if (client) {
		var left = document.getElementsByClassName('scorebar-player1')[0]
		var right = document.getElementsByClassName('scorebar-player2')[0]
		var slow = 5

		setInterval(function() {
			charge += speed * slow
			if (Math.ceil(charge) >= 100) charge = 0
			displayCharge(left, right)
		}, tick / fps * slow)
	}
}
