var io = require('socket.io-client')
var PF = require('pathfinding')

import { defaultShapes, defaultBuildings } from './defaults'
import { convertRange, createCookie, readCookie, size, getUrlParams } from './helpers'
import { isNear, setWalkableAt, alreadyLinked, isPathOpen } from './util'
import { createMatrix, canvas, line, rectangle, circle, donut } from './draw'

export function game() {
	// actions
	const CONNECT = 'CONNECT'
	const GET_STATE = 'GET_STATE'
	const SET_STATE = 'SET_STATE'
	const SET_ELEMENT = 'SET_ELEMENT'
	const SET_BUILDING = 'SET_BUILDING'
	const SET_LINK = 'SET_LINK'
	
	// platform
	const client = window ? true : false
	const host = !window ? true : false

	// window
	const smallHorizontal = 32 // how many blocks to have on x scale
	const smallVertical = 18 // how many blocks to have on y scale
	const gm = 3 // grid multiplier (how much to upscale the grid for gameplay)
	const horizontal = smallHorizontal * gm
	const vertical = smallVertical * gm
	const sizes = client ? size() : { x: horizontal, y: vertical }
	const w = sizes.x
	const h = sizes.y
	const blockWidth = w / smallHorizontal
	const blockHeight = h / smallVertical
	
	// grid
	const finder = new PF.AStarFinder({ allowDiagonal: true })
	const matrix = createMatrix(vertical, horizontal)
	var grid = new PF.Grid(matrix)

	// gameplay
	const defaultEnergy = 100
	const defaultHealth = 100
	const defaultDamage = 20
	const defaultRange = 2
	const shapes = defaultShapes()
	const buildings = defaultBuildings()
	const gameLength = 1 * 60 * 1000
	const recharge = 60 * 1000 // how often should the buildings create new elements
	const cycle = 1000 // how often should the events happen
	const fps = 1000 / 60
	var time = (new Date).getTime()
	var players = {}
	
	// player
	function Player (options) {
		const self = this
		
		this.id = options.id
		this.buildings = []
		this.elements = []
		this.projectiles = []
		this.deepProjectiles = []
		this.links = []
		this.energy = defaultEnergy
		
		if (client) {
			this.container = document.createElement('div')
			this.container.className = 'player ' + this.id
			document.getElementsByClassName('game')[0].appendChild(this.container)
			this.canvas = {
				background: canvas(this.container, 'background_' + this.id, w, h, 1, blockHeight),
				link: canvas(this.container, 'link_' + this.id, w, h, 2, blockHeight),
				movement: canvas(this.container, 'movement_' + this.id, w, h, 3, blockHeight),
				menu: canvas(this.container, 'menu_' + this.id, w, h, 4, blockHeight)
			} 
			
			// create a visual UI grid
			for (var i = 0; i < smallHorizontal + 1; i++) {
				line({
					ctx: this.canvas.background,
					shape: shapes.light,
					x1: blockWidth * i,
					y1: 0,
					x2: blockWidth * i,
					y2: h, 
					alpha: 0.075
				})
			}
			
			for (var i = 0; i < smallVertical + 1; i++) {
				line({
					ctx: this.canvas.background,
					shape: shapes.light,
					x1: 0,
					y1: blockHeight * i,
					x2: w,
					y2: blockHeight * i,
					alpha: 0.075
				})
			}
			
			document.getElementsByClassName(this.container.className)[0].addEventListener('touchstart', function(event) { createMenu(event) })
			document.getElementsByClassName(this.container.className)[0].addEventListener('mousedown', function(event) { createMenu(event) })
		}  
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
					
						var buildings = data[key].buildings
						for (var i = 0; i < buildings.length; i++) {
							grid = setWalkableAt(grid, gm, buildings[i].start[0], buildings[i].start[1], false)
						}
					}
				}
				break
				
			case SET_BUILDING:
				if (!energy()) return
				
				var building = data
				var player = players[building.playerId]
				
				// check if there's an building on that location already
				if (Object.keys(findBuilding(player.buildings, building)).length > 0) return
				
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

				//if (client) document.getElementsByClassName('player-' + building.position)[0].innerHTML = players[building.position].energy - 1
				
				//players[building.position].energy = players[building.position].energy - 1
				players[building.playerId].buildings.push(building)
				for (var p in players) createPaths(players[p])
				if (client) link()
				break
				
			case SET_LINK:
				if (!energy()) return

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
	function createMenu(event) {
		if (!energy()) return
		
		event.preventDefault()
		if ('touches' in event) event = event.touches[0]
		
		var player = players[me]
		player.canvas.menu.clearRect(0, 0, w, h)
		
		var x = event.clientX
		var y = event.clientY
		var xBlock = Math.floor(x / blockWidth)
		var yBlock = Math.floor(y / blockHeight)
		var position = me == 'player1' ? 'left' : 'right'
		if (position == 'left' && xBlock * gm >= horizontal / 2) return
		if (position == 'right' && xBlock * gm < horizontal / 2) return
		var building = findBuilding(player.buildings, { start: [xBlock * gm, yBlock * gm] })
		
		// make sure we dont act when user tries to click outside of stage. also, disable first and last rows
		if (
			xBlock < 0 ||
			yBlock < 0 ||
			xBlock >= smallHorizontal ||
			yBlock >= smallVertical
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
			
			rectangle({
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
			(position == 'left' && gameMenu.x     == xBlock && gameMenu.y == yBlock) ||
			(position == 'left' && gameMenu.x + 1 == xBlock && gameMenu.y == yBlock) ||
			(position == 'left' && gameMenu.x + 2 == xBlock && gameMenu.y == yBlock) ||
			(position == 'left' && gameMenu.x + 3 == xBlock && gameMenu.y == yBlock)
		) {	
			gameMenu.direction = 'toRight'
			selectFromPopup(player, gameMenu, xBlock)
			gameMenu = {}
		}
		
		// build options popup that goes to left
		else if (
			(position == 'right' && gameMenu.x - 3 == xBlock && gameMenu.y == yBlock) ||
			(position == 'right' && gameMenu.x - 2 == xBlock && gameMenu.y == yBlock) ||
			(position == 'right' && gameMenu.x - 1 == xBlock && gameMenu.y == yBlock) ||
			(position == 'right' && gameMenu.x     == xBlock && gameMenu.y == yBlock)
		) {
			gameMenu.direction = 'toLeft'
			selectFromPopup(player, gameMenu, xBlock)
			gameMenu = {}
		}
		
		//build a menu if no options can't be found
		else if (
			!gameMenu.x &&
			!gameMenu.y
		) {
			if (position == 'left') { 
				buildPopup(player, xBlock, yBlock, position)
				gameMenu = { x: xBlock, y: yBlock}
			}
			else {
				buildPopup(player, xBlock, yBlock, position)
				gameMenu = { x: xBlock, y: yBlock}
			}
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
	
	function buildPopup(player, xBlock, yBlock, position) {
		if (position == 'left') {
			var i = 0
			
			for (var building in buildings) {
				rectangle({
					ctx: player.canvas.menu,
					shape: shapes.dark,
					x1: (xBlock + i) * blockWidth,
					y1: yBlock * blockHeight,
					x2: blockWidth,
					y2: blockHeight,
					alpha: 0.1
				})
				
				donut({
					ctx: player.canvas.menu,
					shape: shapes[building],
					x1: (xBlock + i) * blockWidth,
					y1: yBlock * blockHeight,
					x2: blockWidth,
					y2: blockHeight,
					percentage: 100
				})
				
				i++
			}
		}
		else {
			var reversedbuildings = JSON.parse(JSON.stringify(Object.keys(buildings))).reverse()
			var i = 0
			for (var building in buildings) {
				rectangle({
					ctx: player.canvas.menu,
					shape: shapes.light,
					x1: (xBlock + i - reversedbuildings.length + 1) * blockWidth,
					y1: yBlock * blockHeight,
					x2: blockWidth,
					y2: blockHeight,
					alpha: 0.1
				})
				
				donut({
					ctx: player.canvas.menu,
					shape: shapes[building],
					x1: (xBlock + i - reversedbuildings.length + 1) * blockWidth,
					y1: yBlock * blockHeight,
					x2: blockWidth,
					y2: blockHeight,
					percentage: 100
				})
				
				i++
			}
		}
	}

	function selectFromPopup(player, gameMenu, xBlock) {
		if (gameMenu.direction == 'toRight') {
			var type = xBlock - gameMenu.x
			var id = player.elements.length
			var start = [gameMenu.x * gm, gameMenu.y * gm]
			var end = [horizontal, gameMenu.y * gm]
			
			// create a building
			var building = {
				playerId: player.id,
				id: id,
				type: Object.keys(buildings)[type],
				start: start,
				end: end,
				charge: 0,
				dynamics: {}
			}
			
			socket.emit('message', { action: SET_BUILDING, data: building, playerId: me })
		}
		else {
			var type = xBlock - gameMenu.x + Object.keys(buildings).length - 1
			var id = player.elements.length
			var start = [gameMenu.x * gm, gameMenu.y * gm]
			var end = [0, gameMenu.y * gm]
			
			// create a building
			var building = {
				playerId: player.id,
				id: id,
				type: Object.keys(buildings)[type],
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
			
			if (
				!element.path ||
				!element.path[1] ||
				!element.path[1].length
			) continue
			
			players[player.id].elements[p].path.shift()
			
			/*
			if (element.path[0][0] >= smallHorizontal * gm - 2) {
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
							shape: shapes[player.elements[r].type]
						}
						
						players[anotherPlayer.id].deepProjectiles.push(projectile)
						
						var projectile = {
							path: [
								anotherPlayer.elements[r2].path[a - 1],
								player.elements[r].path[b]
							],
							shape: shapes[anotherPlayer.elements[r2].type]
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
					players[player.id].elements[r].dynamics.health = players[player.id].elements[r].dynamics.health - defaultDamage
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
				object.charge = object.charge + convertRange(1 / 60, [0, recharge / 1000], [0, 100])
				objects[p].charge = object.charge
			}
			else if (object.charge >= 100) {
				players[key].buildings[p].charge = 0
				players[key].buildings[p].built = true
				
				if (host) {
					for (var r in players) {
						if (key != r) {
							var start = [objects[p].start[0], objects[p].start[1]]
							var end = [objects[p].end[0], objects[p].end[1]]
							
							//change direction to right
							if (r == 'player2') end[0] = horizontal - gm
							
							// make a temporary hole into the grid
							grid = setWalkableAt(grid, gm, objects[p].start[0], objects[p].start[1], true)
							var path = finder.findPath(start[0], start[1], end[0], end[1], grid.clone())
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
			//if (!player.buildings[p].built) continue
			
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
			var dx = x1 - (x1 - x2) * dt / cycle
			var dy = y1 - (y1 - y2) * dt / cycle	
			
			if (client) {
				if (object.type) {
					var health = object.dynamics.health >= 0 ? object.dynamics.health : 0
					var percentage = convertRange(health, [0, object.dynamics.totalHealth], [0, 100])

					donut({
						ctx: players[key].canvas[layer],
						shape: shapes[object.type],
						percentage: percentage,
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
	
	function walkBuildings(player) {
		for (var i = 0; i < player.buildings.length; i++) {
			grid = setWalkableAt(grid, gm, player.buildings[i].start[0], player.buildings[i].start[1], false)
		}
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
		
		// then run the last part because projectiles of the projectiles couldn't be updated otherwise
		for (var p in players) {
			collision(p)
			attack(players[p])
		}
	}, cycle)
	
	if (host) {
		setInterval(function() {
			for (var p in players) animate(p)
		}, fps)
	}
	
	function animationFrame() {
		requestAnimationFrame(animationFrame)
		for (var p in players) animate(p)
	}
	if (client) requestAnimationFrame(animationFrame)
	
	function animate(key) {
		if (client) players[key].canvas.movement.clearRect(0, 0, w, h)
		charge('movement', 'buildings', key)
		
		if (client) {
			move('movement', 'elements', key)
			move('movement', 'projectiles', key)
			move('movement', 'deepProjectiles', key)
		}
	}
}