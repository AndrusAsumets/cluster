var io = require('socket.io-client')
var PF = require('pathfinding')

import { CONNECT, JOIN, ON_JOIN, HOST, DISCONNECT, RESTART, GET_STATE, SET_STATE, SET_ENERGY, SET_ELEMENTS, SET_BUILDING, SET_UPGRADE, SET_SELL, SET_REPAIR } from './actions'
import { defaultTick, defaultEnergy, defaultHealth, defaultDamage, defaultShapes, defaultBuildings, defaultOptions, defaultPatterns, defaultResourceCount, defaultResourceMultiplier, defaultEnergyMultiplier } from './defaults'
import { decodeQuery, encodeQuery, convertRange, size, getUrlParams } from './helpers'
import { buildPopup, selectFromPopup } from './menu'
import { isNear, setWalkableAt, findOpenPath, findBuildingIndex, createBoundaries, findBoundary, getSide, getSideColor, createResource } from './util'

import { upgrade, sell, upgradeCost, sellBackValue, calculateDamage, repair, calculateRepairCost } from './dynamics'
import { createElements } from './dynamics/create-elements'
import { shiftPaths } from './dynamics/shift-paths'
import { buildingCollision } from './dynamics/building-collision'
import { elementCollision } from './dynamics/element-collision'
import { deepHit } from './dynamics/deep-hit'
import { checkHealth } from './dynamics/check-health'
import { resetElements } from './dynamics/reset-elements'
import { resetProjectiles } from './dynamics/reset-projectiles'

import { ctx, createMatrix } from './draw'
import { createBoard} from './draw/create-board'
import { drawBoundaries } from './draw/draw-boundaries'
import { refreshBuildings } from './draw/refresh-buildings'
import { move } from './draw/move'
import { showStartingPosition } from './draw/show-starting-position'

export function game(roomId) {
	// gameplay
	const tick = defaultTick // how often should the events happen
	const fps = 60
	const speed = convertRange(1 / fps * 2, [0, fps], [0, 100])
	var charge = 0
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
		this.side = options.side
		this.buildings = []
		this.elements = []
		this.deepProjectiles = []
		this.energy = defaultEnergy
		this.boundaries = []
	}

	//ui
	var canvas = {}

	if (client) {
		var container = document.createElement('div')
		container.className = 'player'
		document.getElementsByClassName('game')[0].appendChild(container)

		canvas = {
			background: ctx(container, 'background', w, h),
			trail: ctx(container, 'trail', w, h),
			buildings: ctx(container, 'buildings', w, h, true),
			boundaries: ctx(container, 'boundaries', w, h),
			start: ctx(container, 'start', w, h),
			selection: ctx(container, 'selection', w, h),
			movement: ctx(container, 'movement', w, h, true),
			menu: ctx(container, 'menu', w, (h + marginBottom) / smallVertical, true)
		}

		document.getElementsByClassName(container.className)[0].addEventListener('touchstart', function(event) { createMenu(event) })
		document.getElementsByClassName(container.className)[0].addEventListener('mousedown', function(event) { createMenu(event) })

		createBoard({
			canvas: canvas,
			w: w,
			h: h,
			smallHorizontal: smallHorizontal,
			smallVertical: smallVertical,
			blockWidth: blockWidth,
			blockHeight: blockHeight
		})
	}

	// networking
	var me = 'host'

	if (client) {
		var params = decodeQuery()
		me = 'me' in params && params.me.length ? params.me : null

		if (!me) {
			me = String(Math.random()).split('.')[1]
			window.location.search = encodeQuery(Object.assign({}, params, { me: me } ))
		}
	}

	// development
	var dev = client && decodeQuery() && decodeQuery().dev ? true : false

	// websocket
	var uri = process.env.WS_SERVER && process.env.WS_PORT
		? 'ws://' + process.env.WS_SERVER + ':' + process.env.WS_PORT
		: 'ws://localhost:1337'
	var socket = io.connect(uri, { forceNew: true, transports: ['websocket'] })

	if (client) {
		socket.on('reconnect', function () {
			location.reload()
		})
	}

	socket.on('message', function (message) {
		var action = message.action
		var data = message.data

		switch(action) {
			case CONNECT:
				if (client) socket.emit('message', { action: JOIN, data: me })
				else socket.emit('message', { action: HOST, data: roomId })
				break

			case ON_JOIN:
				if (client) {
					roomId = data.id
					players[data.me] = new Player({ id: data.me, side: data.side })
					socket.emit('message', { action: GET_STATE, data: { me: data.me, side: data.side }, roomId: roomId })
				}

			case GET_STATE:
				if (host) {
					if (!players[data.me]) players[data.me] = new Player({ id: data.me, side: data.side })

					socket.emit('message', { action: SET_STATE, data: { players: players, resources: resources }, roomId: roomId })
				}
				break

			case SET_STATE:
				if (client) {
					resources = data.resources

					var i = 0
					for (var key in data.players) {
						if (!players[key]) players[key] = new Player({ id: key, side: data.players[key].side })

						document.getElementsByClassName('name-' + data.players[key].side)[0].innerHTML = key

						players[key].buildings = data.players[key].buildings
						players[key].elements = data.players[key].elements
						players[key].energy = data.players[key].energy

						boundaries({ playerId: key })

						for (var j = 0; j < players[key].elements.length; j++) {
							var side = getSide(players, key)
							var shape = getSideColor(defaultShapes, side == 'left' ? 'right' : 'left')
							players[key].elements[j].shape = shape
						}

						if (key == me) showStartingPosition({
							canvas: canvas,
							w: w,
							h: h,
							players: players,
							me: me,
							smallHorizontal: smallHorizontal,
							smallVertical : smallVertical,
							blockWidth: blockWidth,
							blockHeight: blockHeight,
						})

						refreshBuildings({
							players: players,
							resources: resources,
							canvas: canvas,
							blockWidth: blockWidth,
							blockHeight: blockHeight,
							w: w,
							h: h,
							gm: gm
						})

						i++
					}

					if (client) displayEnergy(players)
				}
				break

			case SET_ENERGY:
				charge = 0
				energy(players[data.playerId])
				if (client) displayEnergy(players)
				break

			case SET_BUILDING:
				var building = data.building
				var player = players[building.playerId]
				var menu = data.menu

				// if not sufficient energy
				if (player.energy - menu[building.type].cost < 0) return

				// check if there's an building on that location already
				if (Number.isInteger(findBuildingIndex(player.buildings, building))) return

				decreaseEnergy(players[building.playerId], menu[building.type].cost)
				players[building.playerId].buildings.push(building)

				if (client) {
					canvas.start.clearRect(0, 0, w, h)

					refreshBuildings({
						players: players,
						resources: resources,
						canvas: canvas,
						blockWidth: blockWidth,
						blockHeight: blockHeight,
						w: w,
						h: h,
						gm: gm
					})

					displayEnergy(players)
				}

				// find boundaries where the player would be able to build
				boundaries({ playerId: building.playerId })
				break

			case SET_ELEMENTS:
				var playerId = data.playerId
				var elements = data.elements[playerId]

				if (!elements) return

				var side = getSide(players, playerId)
				var shape = getSideColor(defaultShapes, side)

				for (var i = 0; i < elements.length; i++) {
					elements[i].side = side
					elements[i].shape = shape
				}

				for (var key in players) if (key != playerId) players[key].elements = elements

				if (client) canvas.trail.clearRect(0, 0, w, h)
				break

			case SET_UPGRADE:
				players[data.playerId] = upgrade({ player: players[data.playerId], buildingIndex: data.buildingIndex })

				if (!!data.pattern && players[data.playerId] && players[data.playerId].buildings[data.buildingIndex]) players[data.playerId].buildings[data.buildingIndex].pattern = data.pattern
				if (!!data.submenu && players[data.playerId] && players[data.playerId].buildings[data.buildingIndex]) players[data.playerId].buildings[data.buildingIndex].submenu = data.submenu

				if (client) {
					refreshBuildings({
						players: players,
						resources: resources,
						canvas: canvas,
						blockWidth: blockWidth,
						blockHeight: blockHeight,
						w: w,
						h: h,
						gm: gm

					})

					displayEnergy(players)
				}
				break

			case SET_SELL:
				players[data.playerId] = sell({ player: players[data.playerId], buildingIndex: data.buildingIndex })

				// find boundaries where the player would be able to build
				boundaries({ playerId: data.playerId })

				if (client) {
					if (data.playerId == me) canvas.selection.clearRect(0, 0, w, h)
					if (!players[data.playerId].buildings.length) showStartingPosition({
							canvas: canvas,
							w: w,
							h: h,
							players: players,
							me: me,
							smallHorizontal: smallHorizontal,
							smallVertical : smallVertical,
							blockWidth: blockWidth,
							blockHeight: blockHeight,
						})

					refreshBuildings({
						players: players,
						resources: resources,
						canvas: canvas,
						blockWidth: blockWidth,
						blockHeight: blockHeight,
						w: w,
						h: h,
						gm: gm
					})

					displayEnergy(players)
				}
				break

			case SET_REPAIR:
				players[data.playerId] = repair({ player: players[data.playerId], buildingIndex: data.buildingIndex })

				if (client) {
					refreshBuildings({
						players: players,
						resources: resources,
						canvas: canvas,
						blockWidth: blockWidth,
						blockHeight: blockHeight,
						w: w,
						h: h,
						gm: gm

					})

					displayEnergy(players)
				}
				break

			case DISCONNECT:
				if (client) location.reload()
		}
	})

	var gameMenu = {}
	function createMenu(originalEvent) {
		if (Object.keys(players).length != 2) return

		var event = originalEvent

		event.preventDefault()
		if ('touches' in originalEvent) event = event.touches[0]

		canvas.menu.clearRect(0, 0, w, h)

		showStartingPosition({
			canvas: canvas,
			w: w,
			h: h,
			players: players,
			me: me,
			smallHorizontal: smallHorizontal,
			smallVertical : smallVertical,
			blockWidth: blockWidth,
			blockHeight: blockHeight,
		})

		var x = event.clientX
		var y = event.clientY

		var side = (function () {
			if (dev) {
				if (x < w / 2) return 'left'
				else return 'right'
			}
			else {
				return getSide(players, me)
			}
		})()

		var user = (function () {
			if (dev) {
				if (x < w / 2) return players[Object.keys(players)[0]].id
				else return players[Object.keys(players)[1]].id
			}
			else {
				return me
			}
		})()

		var player = players[user]
		var xBlock = Math.floor(x / blockWidth)
		var yBlock = Math.floor(y / blockHeight)
		var menuXBlock = side == 'left'
			? Math.floor(x / (h / (smallVertical - 1)))
			: Math.floor((event.clientX - w / 2) / (h / (smallVertical - 1)))

		var bottom = yBlock > smallVertical - 1

		var buildingIndex = findBuildingIndex(player.buildings, {
			start: Number.isInteger(gameMenu.xBlock) && Number.isInteger(gameMenu.yBlock) && bottom
				? [gameMenu.xBlock * gm, gameMenu.yBlock * gm]
				: [xBlock * gm, yBlock * gm]
		})

		var building = player.buildings[buildingIndex]
		var buildingIsFound = buildingIndex > -1
		var inBounds = findBoundary(players[user].boundaries, { x: xBlock * gm, y: yBlock * gm })

		var options = (
							buildingIsFound
					&&
						(
							!!building.submenu
						)
				)
			? { sell: building.submenu.sell, upgrade: building.submenu.upgrade, repair: building.submenu.repair}
			: false

		var inCenter
		if (
			xBlock == Math.floor(smallHorizontal / 4) &&
			yBlock == Math.floor(smallVertical / 2) &&
			!buildingIsFound
		) inCenter = true

		else if (
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

		if (
			!('pattern' in gameMenu) &&
			!!gameMenu.options &&
			gameMenu.options &&
			bottom
		) {
			if (!buildingIndex && Number.isInteger(gameMenu.buildingIndex)) buildingIndex = gameMenu.buildingIndex

			building = player.buildings[buildingIndex]

			var optionType = Object.keys(defaultOptions)[menuXBlock]
			var upgradeable = players[user].buildings[buildingIndex].level < 3 ? true : false
			var type = players[user].buildings[buildingIndex].type

			// select repair instead
			if (optionType == 'upgrade' && !upgradeable) optionType = 'repair'

			if (
					optionType == 'upgrade' &&
					building.offensive &&
					!Number.isInteger(gameMenu.buildingIndex)
			) {

				gameMenu.pattern = 'upgrade' in building.submenu ? defaultPatterns : building.submenu
				gameMenu.isMenuOpen = false
				gameMenu.buildingIndex = buildingIndex

				createMenu(originalEvent)
			}

			else if (Number.isInteger(gameMenu.buildingIndex)) {
				optionType = Object.keys('upgrade' in building.submenu ? defaultPatterns : building.submenu)[menuXBlock]

				var pattern = 'upgrade' in building.submenu ? defaultPatterns[optionType].pattern : building.submenu[optionType].pattern
				var submenu = 'upgrade' in building.submenu ? defaultPatterns[optionType].submenu : building.submenu[optionType]

				var message = {
					action: defaultOptions.upgrade.action,
					data: {
						playerId: user,
						buildingIndex: buildingIndex,
						pattern: pattern,
						submenu: submenu
					},
					roomId: roomId,
					me: user
				}

				socket.emit('message', message)

				gameMenu = {}
			}

			else {
				var message = {
					action: defaultOptions[optionType].action,
					data: { playerId: user, buildingIndex: buildingIndex },
					roomId: roomId
				}

				message.user = user

				socket.emit('message', message)

				gameMenu = {}
			}
		}

		else if (
				gameMenu.isMenuOpen &&
				bottom
			) {
				// select from the first level popup
				var selectedBuildings = Object.keys(gameMenu.submenu ? gameMenu.submenu : defaultBuildings)
				var type = selectedBuildings[menuXBlock]

				var message = selectFromPopup({
					player: player,
					side: side,
					resources: resources,
					submenu: !!options ? options : defaultBuildings,
					gameMenu: gameMenu,
					xBlock: menuXBlock,
					gm: gm,
					type: type,
					horizontal: horizontal
				})

				message.roomId = roomId
				message.user = player.id

				socket.emit('message', message)

				gameMenu = {}
				canvas.selection.clearRect(0, 0, w, h)
			}

		//build a first level popup
		else if (
				(
					!bottom &&
					inCenter
				)
			||
				inBounds
			||
				options

			|| gameMenu.pattern
		) {
			canvas.selection.clearRect(0, 0, w, h)

			// make sure we're working with the current building
			building = player.buildings[findBuildingIndex(player.buildings, { start: [xBlock * gm, yBlock * gm] })]

			if (!('pattern' in gameMenu) && options && !!building && !!building.level) {
				var selectedBuildings = Object.keys(defaultOptions)
				var type = selectedBuildings[menuXBlock]
				var level = building.level

				options.sell = {}
				options.sell.cost = level ? sellBackValue({ building: building }) : false
				options.sell.level = level

				var repairCost = calculateRepairCost(building)
				options.repair = {}
				options.repair.cost = repairCost > 0
					? repairCost
					: false

				options.upgrade = {}
				options.upgrade.cost = building.cost && level ? upgradeCost({ building: building }) : false
				options.upgrade.level = building.level
			}

			var buildings = !!options
					? options
					: defaultBuildings

			buildings = 'pattern' in gameMenu
				? gameMenu.pattern
				: buildings

			buildPopup({
				canvas: canvas,
				building: building,
				buildings: buildings,
				blockWidth: blockWidth,
				blockHeight: blockHeight,
				xBlock: xBlock,
				yBlock: yBlock,
				side: side,
				width: w,
				height: (h + marginBottom) / smallVertical,
				vertical: vertical,
				gm: gm,
				w: w,
				h: h
			})

			gameMenu = { xBlock: xBlock, yBlock: yBlock, isMenuOpen: true, options: !!options ? options : null, buildingIndex: gameMenu.buildingIndex }
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
					bottom
			)
		) {
			socket.emit('message', { action: RESTART })
		}

		// otherwise just clear the menu
		else {
			gameMenu = {}
			canvas.selection.clearRect(0, 0, w, h)
		}
	}

	function increaseEnergy(player, amount = 1) {
		players[player.id].energy = players[player.id].energy + amount
	}

	function decreaseEnergy(player, amount = 1) {
		players[player.id].energy = players[player.id].energy - amount
	}

	function energy(player) {
		if (!player) return

		for (var i = 0; i < player.buildings.length; i++) {
			var building = player.buildings[i]

			if (
				building.producer == true
			) {
				increaseEnergy(player, building.level * building.resource * defaultEnergyMultiplier)
			}
		}
	}

	function displayEnergy(players) {
		for (var key in players) {
			document.getElementsByClassName('energy-' + players[key].side)[0].innerHTML = Math.floor(players[key].energy)
		}

		displayProduction(players)
	}

	function displayProduction(players) {
		for (var key in players) {
			var production = Math.floor(getProduction(players[key]))
			if (production) {
				var string = 'Production: +' + production
				document.getElementsByClassName('production-' + players[key].side)[0].innerHTML = string
			}
		}
	}

	function getProduction(player) {
		if (!player) return

		var production = 0
		for (var i = 0; i < player.buildings.length; i++) {
			var building = player.buildings[i]

			if (
				building.producer == true
			) {
				production = production + building.level * building.resource * defaultEnergyMultiplier
			}
		}
		return production
	}

	function boundaries(o) {
		var side = getSide(players, o.playerId)

		players[o.playerId].boundaries = createBoundaries({ side: side, buildings: players[o.playerId].buildings, width: horizontal, height: vertical, gm: gm })
		if (client) drawBoundaries({ canvas: canvas.boundaries, boundaries: players[o.playerId].boundaries, width: w, height: h, blockWidth: blockWidth, blockHeight : blockHeight, gm: gm, side: side })
	}

	function displayCharge(left, right) {
		var share = convertRange(charge, [0, 100], [0, w / 2])
		left.style.width = share + 'px'
		right.style.width = share + 'px'
	}

	setInterval(function() {
		time = (new Date).getTime()

		for (var p in players) players = resetElements(players, players[p])

		for (var p in players) {
			players = deepHit(players, players[p])
			players = checkHealth(players, players[p])
			players = resetProjectiles(players, players[p])
			players = shiftPaths(players, players[p])
		}

		// then run the last part because deep projectiles couldn't be updated otherwise
		for (var p in players) {
			players = elementCollision(players, p)
			players = buildingCollision({ players: players, p: p })

			// find boundaries where the player would be able to build
			if (client) boundaries({ playerId: p })
		}

		if (client) {
			refreshBuildings({
				players: players,
				resources: resources,
				canvas: canvas,
				blockWidth: blockWidth,
				blockHeight: blockHeight,
				w: w,
				h: h,
				gm: gm
			})
		}
	}, tick)

	// render
	function animationFrame() {
		canvas.movement.clearRect(0, 0, w, h)

		for (var p in players) move({
			layer: 'movement',
			type: 'elements',
			key: p,
			players: players,
			gm: gm,
			blockWidth: blockWidth,
			blockHeight: blockHeight,
			w: w,
			h: h,
			time: time,
			tick: tick,
			canvas: canvas
		})

		requestAnimationFrame(animationFrame)
	}
	if (client) requestAnimationFrame(animationFrame)

	// create elements in the server
	if (host) {
		setInterval(function() {
			charge += speed

			if (Math.ceil(charge) >= 100) {
				charge = 0

				for (var p in players) {
					var elements = createElements({
						players: players,
						p: p,
						finder: finder,
						grid: grid,
						gm: gm,
						socket: socket,
						roomId: roomId
					})

					socket.emit('message', { action: SET_ELEMENTS, data: { elements: elements, playerId: p }, roomId: roomId })
					socket.emit('message', { action: SET_ENERGY, data: { playerId: p }, roomId: roomId })
				}
			}
		}, tick / fps)
	}

	// display charge bar
	if (client) {
		var left = document.getElementsByClassName('scorebar-left')[0]
		var right = document.getElementsByClassName('scorebar-right')[0]
		var slow = 5

		setInterval(function() {
			charge += speed * slow
			if (Math.ceil(charge) >= 100) charge = 0
			displayCharge(left, right)
		}, tick / fps * slow)
	}
}
