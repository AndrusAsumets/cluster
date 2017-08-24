var io = require('socket.io-client')
var PF = require('pathfinding')

import { convertRange, createCookie, readCookie, size, getUrlParams } from './helpers'
import { isNear, setWalkableAt, alreadyLinked, findOpenPath, isPathOpen } from './util'
import { createMatrix, canvas, line, rect, circle, donut, image } from './draw'
import { defaultShapes } from './shapes'

export function game() {
	const CONNECT = 'CONNECT'
	const GET_STATE = 'GET_STATE'
	const SET_STATE = 'SET_STATE'
	const SET_ELEMENT = 'SET_ELEMENT'
	const SET_BUILDING = 'SET_BUILDING'
	const SET_LINK = 'SET_LINK'
	
	// platform
	var client = window ? true : false
	var host = !window ? true : false
	
	// gameplay constants
	const defaultEnergy = 100
	const defaultHealth = 1000
	const defaultDamage = 10
	const defaultRange = 2
	const gameLength = 1 * 60 * 1000
	const recharge = 15 * 1000
	const materialTypes = ['earth', 'water', 'fire', 'wind']
	const speedMultiplier = 1
	const sHorizontal = 9 // mobile: 8
	const sVertical = 16 // mobile: 18
	const gm = 3 // grid multiplier
	const bHorizontal = sHorizontal * gm
	const bVertical = sVertical * gm
	const cycle = 1000 / speedMultiplier
	const defaultBuildings = {
		factory: {
			cost: 250,
			linkable: false,
			offensive: false
		},
		powerplant: {
			cost: 25,
			linkable: true,
			offensive: false
		}	
	}

	// gameplay variables
	var time = (new Date).getTime()
	var players = {}
	
	// window
	const splitScreen = 2
	var w = client ? size().x : bHorizontal
	var h = client ? size().y : bVertical
	w = w / splitScreen
	h = h
	const blockWidth = w / sHorizontal
	const blockHeight = h / sVertical
	
	// ui
	const shapes = defaultShapes()
	
	// create matrices
	const matrix = createMatrix(bVertical, bHorizontal)
	
	function Player (options) {
		this.id = options.id
		this.buildings = []
		this.elements = []
		this.projectiles = []
		this.links = []
		
		// gameplay
		this.energy = defaultEnergy
		this.factoryBuilt = false
		
		// make grids from the matrices
		this.grid = new PF.Grid(matrix)
		
		var self = this
		
		if (client) {
			this.container = document.createElement('div')
			this.container.className = 'player player_' + this.id
			document.getElementsByClassName('game')[0].appendChild(this.container)
			this.canvas = client ? {
				background: canvas(this.container, 'background_' + this.id, w, h, 1, blockHeight),
				link: canvas(this.container, 'link_' + this.id, w, h, 2, blockHeight),
				movement: canvas(this.container, 'movement_' + this.id, w, h, 3, blockHeight),
				menu: canvas(this.container, 'menu_' + this.id, w, h, 4, blockHeight)
			} : null
			
			// create a visual UI grid
			for (var i = 0; i < sHorizontal; i++) {
				line({
					ctx: this.canvas.background,
					shape: shapes.light,
					x1: blockWidth * i,
					y1: 0,
					x2: blockWidth * i,
					y2: h, 
					alpha: 0.1
				})
			}
			
			for (var i = 0; i < sVertical; i++) {
				line({
					ctx: this.canvas.background,
					shape: shapes.light,
					x1: 0,
					y1: blockHeight * i,
					x2: w,
					y2: blockHeight * i,
					alpha: 0.1
				})
			}
			
			document.getElementsByClassName(this.container.className)[0].addEventListener('touchstart', function(event) { createElement(event) })
			document.getElementsByClassName(this.container.className)[0].addEventListener('mousedown', function(event) { createElement(event) })
		}
	}
	
	var finder = new PF.AStarFinder({
	    allowDiagonal: true
	})
	
	var me = client ? getUrlParams('me') : null
	if (!me && !host) return console.log('add ?me=some_player_id to your url')
	
	var uri = client ? 'ws://188.166.0.158:1337' : 'ws://localhost:1337'
	var socket = io.connect(uri)
	
	if (client) {
		socket.on('reconnect', function () {
			location.reload()
		})
	}
	
	socket.on('message', function (message) {
		var to = message.to
		var action = message.action
		var data = message.data
		
		switch(action) {
			case CONNECT:
				console.log('connected to ws')
				//var room = window ? (window.location.hash ? '/' + window.location.hash : '/') : room
				
				if (client) {
					//if (players[id]) return
					//var playerId = readCookie('playerId') && readCookie('playerId') != 'undefined' ? readCookie('playerId') : id ? id : String(Math.random()).split('.')[1]
					//createCookie(String(playerId), playerId, 1)
					
					players[me] = new Player({ id: me })
					
					socket.emit('message', { action: GET_STATE, data: me })
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
					
						var buildings = data[key].buildings
						for (var i = 0; i < buildings.length; i++) {
							players = setWalkableAt(players, players[key], gm, buildings[i].start[0], buildings[i].start[1], false)
						}
					}
				}
				break
				
			case SET_BUILDING:
				if (!energy()) return
				
				var player = players[data.playerId]
				
				// check if there's an building on that location already
				if (Object.keys(findBuilding(player.buildings, data)).length > 0) return
				
				// check for open paths
				players = setWalkableAt(players, player, gm, data.start[0], data.start[1], false)
				
				var pathCheck = {
					finder: finder,
					grid: player.grid,
					gm: gm,
					bHorizontal: bHorizontal,
					bVertical: bVertical
				}
				
				if (!isPathOpen(pathCheck)) {
					players = setWalkableAt(players, player, gm, data.start[0], data.start[1], true)
					return
				}
				
				//if (client) document.getElementsByClassName('player-' + data.position)[0].innerHTML = players[data.position].energy - 1
				
				//players[data.position].energy = players[data.position].energy - 1
				players[data.playerId].buildings.push(data)
				createPaths(player)
				if (client) link()
				break
				
			case SET_LINK:
				if (!energy()) return

				players[data.playerId].links.push(data.link)
				if (client) link()
				break
				
			case SET_ELEMENT:
				if (client) {
					var playerId = data.playerId
					var element = data.element
					
					for (var key in players) {
						if (key != playerId) {
							element.path = finder.findPath(element.start[0], element.start[1], element.end[0], element.end[1], players[key].grid.clone())
							 players[key].elements.push(element)
						}
						
						else {
							players[playerId].buildings[element.parentIndex].charge = 0
						}	
					}
				}
				break
		}
	})
	
	function energy() {
		return true
		var playing = true
		if (client) document.getElementsByClassName('player-left')[0].innerHTML = players.left.energy > 0 ? players.left.energy : 0
		if (client) document.getElementsByClassName('player-right')[0].innerHTML = players.right.energy > 0 ? players.right.energy : 0
		
		if (gameLength < 0) {
			if (client) document.getElementsByClassName('energy')[0].innerHTML = 'PlayerB won!'
			playing = false
		}
		else if (players.left.energy < 0) {
			if (client) document.getElementsByClassName('energy')[0].innerHTML = 'PlayerB won!'
			playing = false
		}
		else if (players.right.energy < 0) {
			if (client) document.getElementsByClassName('energy')[0].innerHTML = 'PlayerA won!'
			playing = false
		}
		
		return playing
	}
	
	/*
	var gameInterval = setInterval(function() {
		gameLength = gameLength - 1000
		var ms = gameLength
		ms = 1000 * Math.round(ms / 1000)
		var d = new Date(ms)
		if (client) document.getElementsByClassName('energy')[0].innerHTML = d.getUTCMinutes() + ':' + d.getUTCSeconds()
		
		if (!energy()) clearInterval(gameInterval)
	}, 1000)
	*/
	
	var gameMenu = {}
	function createElement(event) {
		if (!energy()) return
		
		event.preventDefault()
		if ('touches' in event) event = event.touches[0]
		
		var player = players[me]
		player.canvas.menu.clearRect(0, 0, w, h)
		
		var x = event.clientX
		var y = event.clientY
		var xBlock = Math.floor(x / blockWidth)
		var yBlock = Math.floor(y / blockHeight)
		var left = xBlock < sHorizontal / splitScreen
		var building = findBuilding(player.buildings, { start: [xBlock * gm, yBlock * gm] })
		
		// make sure we dont act when user tries to click outside of stage. also, disable first and last rows
		if (
			xBlock < 0 ||
			yBlock < 0 ||
			xBlock >= sHorizontal ||
			yBlock >= sVertical
		) {
			return
		}
		
		// if from and to buildings were found
		else if (
			gameMenu.fromBuilding &&
			Object.keys(gameMenu.fromBuilding).length > 0 &&
			Object.keys(building).length > 0
		) {
			var from = gameMenu.fromBuilding.start
			var to = building.start
			
			if (alreadyLinked(players[me], from, to)) {
				gameMenu = {}
				return
			}
			
			// disablelinking to the same building
			if (from == to) return 
			
			socket.emit('message', { action: SET_LINK, data: { link: { from: from, to: to, type: gameMenu.fromBuilding.type }, playerId: me }})
			link()
			
			gameMenu = {}
		}
		
		// if a building was found on that block
		else if (
			Object.keys(building).length > 0
		) {
			gameMenu.fromBuilding = building
			gameMenu.linking = true
			
			rect({
				ctx: player.canvas.menu,
				shape: shapes.light,
				x1: xBlock * blockWidth,
				y1: yBlock * blockHeight,
				x2: blockWidth,
				y2: blockHeight,
				alpha: 0.1
			})

			donut({
				ctx: player.canvas.menu,
				shape: shapes[gameMenu.fromBuilding.type],
				x1: xBlock * blockWidth,
				y1: yBlock * blockHeight,
				x2: blockWidth,
				y2: blockHeight
			})
		}
		
		// build options popup that goes to right
		else if (
			(gameMenu.left && gameMenu.x     == xBlock && gameMenu.y == yBlock) ||
			(gameMenu.left && gameMenu.x + 1 == xBlock && gameMenu.y == yBlock) ||
			(gameMenu.left && gameMenu.x + 2 == xBlock && gameMenu.y == yBlock) ||
			(gameMenu.left && gameMenu.x + 3 == xBlock && gameMenu.y == yBlock)
		) {	
			selectFromPopup(player, gameMenu, xBlock)
			gameMenu = {}
		}
		
		// build options popup that goes to left
		else if (
			(!gameMenu.left && gameMenu.x - 3 == xBlock && gameMenu.y == yBlock) ||
			(!gameMenu.left && gameMenu.x - 2 == xBlock && gameMenu.y == yBlock) ||
			(!gameMenu.left && gameMenu.x - 1 == xBlock && gameMenu.y == yBlock) ||
			(!gameMenu.left && gameMenu.x     == xBlock && gameMenu.y == yBlock)
		) {
			selectFromPopup(player, gameMenu, xBlock)
			gameMenu = {}
		}
		
		//build a menu if no options can't be found
		else if (
			//!gameMenu.linking && // if the last action was not about linking, then it would be better to skip it
			!gameMenu.x &&
			!gameMenu.y
		) {
			buildPopup(player, xBlock, yBlock, left)
			gameMenu = { x: xBlock, y: yBlock, left: left }
		}
		
		// otherwise just clear the menu
		else {
			gameMenu = {}
		}
	}
	
	function link() {
		for (var key in players) {
			var player = players[key]
			var links = player.links
			
			player.canvas.link.clearRect(0, 0, w, h)
			
			for (var l = 0; l < links.length; l++) {
				var from = links[l].from
				var to = links[l].to
				var type = links[l].type
				
				// make positions temporarily walkable
				players = setWalkableAt(players, player, gm, from[0], from[1], true)
				players = setWalkableAt(players, player, gm, to[0], to[1], true)
				
				// find a path between the buildings
				var path = finder.findPath(from[0], from[1], to[0], to[1], player.grid.clone())
				
				// make positions unwalkable again
				players = setWalkableAt(players, player, gm, from[0], from[1], false)
				players = setWalkableAt(players, player, gm, to[0], to[1], false)
				
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
						ctx: player.canvas.link,
						shape: shapes[type],
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
	
	function findBuilding(buildings, building) {
		for (var p = 0; p < buildings.length; p++) {
			if (
				buildings[p].start[0] == building.start[0] &&
				buildings[p].start[1] == building.start[1]
			) return buildings[p]
		}
		
		return {}
	}
	
	function buildPopup(player, xBlock, yBlock, left) {
		//var availableBuildings = Object.keys(defaultBuildings)
		if (left) {
			var i = 0
			for (var building in defaultBuildings) {
				rect({
					ctx: player.canvas.menu,
					shape: shapes.light,
					x1: (xBlock + i) * blockWidth,
					y1: yBlock * blockHeight,
					x2: blockWidth,
					y2: blockHeight,
					alpha: 0.1
				})
				
				image({
					ctx: player.canvas.menu,
					file: shapes[building].file,
					x1: (xBlock + i) * blockWidth,
					y1: yBlock * blockHeight,
					width: blockWidth,
					height: blockHeight
				})
				
				i++
			}
		}
		else {
			var reversedDefaultBuildings = JSON.parse(JSON.stringify(Object.keys(defaultBuildings))).reverse()
			var i = 0
			for (var building in defaultBuildings) {
				rect({
					ctx: player.canvas.menu,
					shape: shapes.light,
					x1: (xBlock + i - reversedDefaultBuildings.length + 1) * blockWidth,
					y1: yBlock * blockHeight,
					x2: blockWidth,
					y2: blockHeight,
					alpha: 0.1
				})
				
				image({
					ctx: player.canvas.menu,
					file: shapes[building].file,
					x1: (xBlock + i - reversedDefaultBuildings.length + 1) * blockWidth,
					y1: yBlock * blockHeight,
					width: blockWidth,
					height: blockHeight
				})
				
				i++
			}
		}
	}

	function selectFromPopup(player, gameMenu, xBlock) {
		if (gameMenu.left) {
			var listOfDefaultBuildings = JSON.parse(JSON.stringify(Object.keys(defaultBuildings)))
			var type = xBlock - gameMenu.x
			var id = player.elements.length
			var start = [gameMenu.x * gm, gameMenu.y * gm]
			var end = [sHorizontal * gm, gameMenu.y * gm]	
			
			// create a building
			var building = {
				playerId: player.id,
				id: id,
				type: materialTypes[type],
				//type: listOfDefaultBuildings[type],
				start: start,
				end: end,
				charge: 0,
				dynamics: {}
			}
			
			socket.emit('message', { action: SET_BUILDING, data: building, playerId: me })
		}
		else {
			var type = xBlock - gameMenu.x + materialTypes.length - 1
			var id = player.elements.length
			var start = [gameMenu.x * gm, gameMenu.y * gm]
			var end = [0, gameMenu.y * gm]
			var reversedmaterialTypes = JSON.parse(JSON.stringify(materialTypes)).reverse()
			
			// create a building
			var building = {
				playerId: player.id,
				id: id,
				type: reversedmaterialTypes[type],
				start: start,
				end: end,
				charge: 0,
				dynamics: {
					fired: 0
				}
			}
			
			socket.emit('message', { action: SET_BUILDING, data: building, playerId: me })
		}
	}
	
	function resetProjectiles(player) {
		var buildings = player.buildings ? player.buildings : []
		for (var r = 0; r < buildings.length; r++) {
			if (!'fired' in buildings[r].dynamics) continue
			players[player.id].buildings[r].dynamics.fired = 0
		}
	}
	
	function health(player) {
		var elements = player.elements ? player.elements : []
		for (var r = 0; r < elements.length; r++) {
			if (elements[r].dynamics.health <= 0) players[player.id].elements.shift()
		}
	}
	
	function shiftPaths(player) {
		var elements = player.elements ? player.elements : []
		for (var p = 0; p < elements.length; p++) {
			var element = player.elements[p]
			
			if (
				!element.path ||
				!element.path[1] ||
				!element.path[1].length
			) continue
			
			players[player.id].elements[p].path.shift()
			
			/*
			if (element.path[0][0] >= sHorizontal * gm - 2) {
				players[player.id].elements.splice(p, 1)
				//players.right.energy = players.right.energy - 1
			}
			*/
		}
	}
	
	function createPaths(player) {
		for (var p = 0; p < player.elements.length; p++) {
			var element = player.elements[p]
			
			if (
				!element.path ||
				!element.path[1] ||
				!element.path[1].length
			) {
				var path = finder.findPath(player.elements[p].start[0], player.elements[p].start[1], player.elements[p].end[0], player.elements[p].end[1], player.grid.clone())
				players[player.id].elements[p].path = path
			}
			
			else {
				var path = finder.findPath(element.path[0][0], element.path[0][1], player.elements[p].end[0], player.elements[p].end[1], player.grid.clone())
				
				players[player.id].elements[p].path = path
			}
		}
	}
	
	function getDirection(index) {
		index = parseInt(index) - 1
		index = 6
		
		return [
			[[bHorizontal / splitScreen, bVertical / splitScreen], [0, 0]], // for the top left player
			[[0, bVertical / splitScreen], [bHorizontal / splitScreen, 0]], // top right
			[[bHorizontal / splitScreen, 0], [0, bVertical / splitScreen]], // bottom left
			[[0, 0 ], [bHorizontal / splitScreen, bVertical / splitScreen]], // bottom right
			[[0, bVertical / 2 / splitScreen], [bHorizontal / splitScreen, bVertical / 2 / splitScreen]], // coming from left
			[[bHorizontal / splitScreen, bVertical - gm], [bHorizontal / splitScreen, 0]], // coming from bottom
			[[bHorizontal / splitScreen, 0], [bHorizontal / splitScreen, bVertical - gm]] //coming from top
		][index]
	}
	
	function charge(layer, type, key) {
		var objects = players[key][type] ? players[key][type] : []
		for (var p = 0; p < objects.length; p++) {
			var object = objects[p]
			
			if (object.charge < 100) {
				object.charge = object.charge + convertRange(1 / 60, [0, recharge / 1000], [0, 100])
				objects[p].charge = object.charge
			}
			else if (object.charge >= 100) {
				players[key].buildings[p].charge = 0
				players[key].buildings[p].built = true
				
				if (host) {
					for (var r in players) {
						if (key != r) {
							var direction = getDirection(r)
							var start = [objects[p].start[0], direction[0][1]]
							var end = [objects[p].start[0], direction[1][1]]
							
							// first find open path from top
							if (!finder.findPath(start[0], start[1], end[0], end[1], players[r].grid.clone()).length) {
								var findOpenPathCheck = {
									finder: finder,
									grid: players[r].grid,
									bHorizontal: bHorizontal,
									gm: gm,
									y1: 0,
									y2: gm
								}
								start[0] = findOpenPath(findOpenPathCheck)
								
								// and then find open path from bottom
								if (!finder.findPath(start[0], start[1], end[0], end[1], players[r].grid.clone()).length) {
									var findOpenPathCheck = {
										finder: finder,
										grid: players[r].grid,
										bHorizontal: bHorizontal,
										gm: gm,
										y1: bVertical - (gm * 2),
										y2: bVertical - gm
									}
									end[0] = findOpenPath(findOpenPathCheck)
								}
							}
							
							var element = {
								id: players[r].elements.length,
								playerId: key,
								parentIndex: p,
								type: object.type,
								start: start,
								end: end,
								path: finder.findPath(start[0], start[1], end[0], end[1], players[r].grid.clone()),
								dynamics: {
									totalHealth: defaultHealth,
									health: defaultHealth
								}
							}
							players[r].elements.push(element)
							
							socket.emit('message', { action: SET_ELEMENT, data: { element: element, playerId: key } })
						}
					}
				}
			}
			
			if (client) donut({
				ctx: players[key].canvas[layer],
				shape: shapes[object.type],
				x1: object.start[0] * blockWidth / gm,
				y1: object.start[1] * blockHeight / gm,
				x2: blockWidth,
				y2: blockHeight,
				percentage: object.charge
			})
		}
	}
	
	function attack(player) {
		var buildings = player.buildings ? player.buildings : []
		var x = 1
		for (var p = 0; p < buildings.length; p++) {
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
						player.elements[r].path[1],
						player.elements[r].path[2]
					],
					shape: shapes[player.buildings[p].type]
				}
				
				players[player.id].projectiles.push(projectile)
				players[player.id].buildings[p].dynamics.fired++
				break
			}
		}
	}
	
	function hit(player) {
		var projectiles = player.projectiles
		var x = 1
		for (var p = 0; p < projectiles.length; p++) {
			var x1 = host ? projectiles[p].path[1][0] : projectiles[p].path[1][0]
			var y1 = host ? projectiles[p].path[1][1] : projectiles[p].path[1][1]
				
			for (var r = 0; r < player.elements.length; r++) {
				var element = player.elements[r]
				
				if (
					!element.path ||
					!element.path[x] ||
					!element.path[x].length
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
			var dx = x1 - (x1 - x2) * dt / cycle
			var dy = y1 - (y1 - y2) * dt / cycle	
			
			if (client) {
				if (object.type) {
					var health = object.dynamics.health >= 0 ? object.dynamics.health : 0
					var percentage = convertRange(health, [0, object.dynamics.totalHealth], [0, 100])

					donut({
						ctx: players[key].canvas[layer],
						shape: shapes[object.type],
						x1: dx,
						y1: dy,
						x2: blockWidth,
						y2: blockHeight,
						alpha: 0.55
					})
				}
				else {
					circle({
						ctx: players[key].canvas[layer],
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
	
	setInterval(function() {
		time = (new Date).getTime()
		
		for (var p in players) {
			players[p].projectiles = []
			resetProjectiles(players[p])
			shiftPaths(players[p])
			health(players[p])
			attack(players[p])
			hit(players[p])
		}
	}, cycle)
	
	setInterval(function() {
		for (var key in players) animate(key)
	}, 1000 / 60)
	
	function animate(key) {
		if (client) players[key].canvas.movement.clearRect(0, 0, w, h)
		charge('movement', 'buildings', key)
		
		if (client) {
			move('movement', 'elements', key)
			move('movement', 'projectiles', key)
		}
	}
}