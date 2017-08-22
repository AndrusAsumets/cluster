export function game() {
	var io = require('socket.io-client')
	var PF = require('pathfinding')
	
	const GET_STATE = 'GET_STATE'
	const SET_STATE = 'SET_STATE'
	
	//network
	var client = window ? true : false
	var host = !window ? true : false
	var pingpong = null
	
	// gameplay
	var defaultScore = 10000
	var defaultHealth = 1000
	var defaultDamage = 100
	var defaultRange = 2
	var gameLength = 1 * 60 * 1000
	var recharge = 30 * 1000
	var types = ['earth', 'water', 'fire', 'wind']
	var speedMultiplier = 1
	var uiXNum = 9 // mobile: 8
	var uiYNum = 16 // mobile: 18
	var gridMultiplier = 3
	var gameXNum = uiXNum * gridMultiplier
	var gameYNum = uiYNum * gridMultiplier
	var cycle = 1000 / speedMultiplier
	var attackable = true
	var time = (new Date).getTime()
	var players = {}
	
	//window
	var PIXEL_RATIO = client ? (function () {
	    var ctx = document.createElement('canvas').getContext('2d'),
	        dpr = window.devicePixelRatio || 1,
	        bsr = ctx.webkitBackingStorePixelRatio ||
				ctx.mozBackingStorePixelRatio ||
				ctx.msBackingStorePixelRatio ||
				ctx.oBackingStorePixelRatio ||
				ctx.backingStorePixelRatio || 1
	
	    return dpr / bsr
	})() : null
	var splitScreen = 2
	var horizontal = uiXNum
	var vertical = uiYNum
	var w = client ? size().x : gameXNum
	var h = client ? size().y : gameYNum
	w = w / splitScreen
	h = h// / splitScreen
	var blockWidth = w / horizontal
	var blockHeight = h / vertical
	
	//ui
	var shapes = {
		background: {
			fillStyle: function (alpha) { return 'rgba(25, 29, 49, ' + alpha + ')' }
		},
		dark: {
			fillStyle: function (alpha) { return 'rgba(11, 7, 35, ' + alpha + ')' },
			strokeStyle: function (alpha) { return 'rgba(0, 0, 0, ' + alpha + ')' }
		},
		light: {
			fillStyle: function (alpha) { return 'rgba(255, 255, 255, ' + alpha + ')' },
			strokeStyle: function (alpha) { return 'rgba(255, 255, 255, ' + alpha + ')' }
		},
		earth: {
			fillStyle: function (alpha) { return 'rgba(194, 97, 204, ' + alpha + ')' },
			strokeStyle: function (alpha) { return 'rgba(194, 97, 204, ' + alpha + ')' }
		},
		water: {
			fillStyle: function (alpha) { return 'rgba(0, 190, 229, ' + alpha + ')' },
			strokeStyle: function (alpha) { return 'rgba(0, 190, 229, ' + alpha + ')' }
		},
		fire: {
			fillStyle: function (alpha) { return 'rgba(255, 74, 61, ' + alpha + ')' },
			strokeStyle: function (alpha) { return 'rgba(255, 74, 61, ' + alpha + ')' }
		},
		wind: {
			fillStyle: function (alpha) { return 'rgba(255, 255, 255, ' + alpha + ')' },
			strokeStyle: function (alpha) { return 'rgba(255, 255, 255, ' + alpha + ')' }
		}
	}
	
	// create matrices
	var matrix = []
	for (var i = 0; i < gameYNum; i++) {
		matrix.push([])
		
		for (var j = 0; j < gameXNum; j++) {
			matrix[i].push(0)
		}
	}
	
	function Player (options) {
		this.id = options.id
		this.buildings = []
		this.elements = []
		this.projectiles = []
		this.links = []
		
		// make grids from the matrices
		this.grid = new PF.Grid(matrix)
		
		var self = this
		
		if (client) {
			this.container = document.createElement('div')
			this.container.className = 'player player_' + this.id
			document.getElementsByClassName('game')[0].appendChild(this.container)
			this.canvas = client ? {
				background: createCanvas(this.container, 'background_' + this.id, w, h, 1, blockHeight),
				link: createCanvas(this.container, 'movement_' + this.id, w, h, 2, blockHeight),
				movement: createCanvas(this.container, 'movement_' + this.id, w, h, 3, blockHeight),
				menu: createCanvas(this.container, 'menu_' + this.id, w, h, 4, blockHeight)
			} : null
			
			// create a visual UI grid
			for (var i = 0; i < horizontal; i++) {
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
			
			for (var i = 0; i < vertical; i++) {
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
	if (!me && !host) return console.log('add ?me=second to your url')
	
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
			case 'connect':
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
					
						var buildings = data[key].buildings
						for (var i = 0; i < buildings.length; i++) {
							setWalkableAt(players[key], buildings[i].start[0], buildings[i].start[1], false)
						}
					}
				}
				break
				
			case 'building':
				if (!score()) return
				
				var player = players[data.playerId]
				
				// check if findBuilding on that location already
				if (Object.keys(findBuilding(player.buildings, data)).length > 0) return
				
				// check for open paths
				setWalkableAt(player, data.start[0], data.start[1], false)
				var path = finder.findPath(0, 0, 0, gameYNum - 1, player.grid.clone())
				if (!path.length) return setWalkableAt(player, data.start[0], data.start[1], true)
				
				//if (client) document.getElementsByClassName('player-' + data.position)[0].innerHTML = players[data.position].score - 1
				
				//players[data.position].score = players[data.position].score - 1
				players[data.playerId].buildings.push(data)
				if (host) createPaths(player) // host
				if (client) link()
				break
		}
	})
	
	function score() {
		return true
		var playing = true
		if (client) document.getElementsByClassName('player-left')[0].innerHTML = players.left.score > 0 ? players.left.score : 0
		if (client) document.getElementsByClassName('player-right')[0].innerHTML = players.right.score > 0 ? players.right.score : 0
		
		if (gameLength < 0) {
			if (client) document.getElementsByClassName('score')[0].innerHTML = 'PlayerB won!'
			playing = false
		}
		else if (players.left.score < 0) {
			if (client) document.getElementsByClassName('score')[0].innerHTML = 'PlayerB won!'
			playing = false
		}
		else if (players.right.score < 0) {
			if (client) document.getElementsByClassName('score')[0].innerHTML = 'PlayerA won!'
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
		if (client) document.getElementsByClassName('score')[0].innerHTML = d.getUTCMinutes() + ':' + d.getUTCSeconds()
		
		if (!score()) clearInterval(gameInterval)
	}, 1000)
	*/
	
	var gameMenu = {}
	function createElement(event) {
		if (!score()) return
		
		event.preventDefault()
		if ('touches' in event) event = event.touches[0]
		
		var player = players[me]
		player.canvas.menu.clearRect(0, 0, w, h)
		
		var x = event.clientX
		var y = event.clientY
		var xBlock = Math.floor(x / blockWidth)
		var yBlock = Math.floor(y / blockHeight)
		var left = xBlock < horizontal / splitScreen
		var building = findBuilding(player.buildings, { start: [xBlock * gridMultiplier, yBlock * gridMultiplier] })
		
		// make sure we dont act when user tries to click outside of stage. also, disable first and last rows
		if (
			xBlock < 0 ||
			yBlock <= 0 ||
			xBlock >= uiXNum ||
			yBlock >= uiYNum - 1
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
			
			if (alreadyLinked(from, to)) {
				gameMenu = {}
				return
			}
			
			players[me].links.push({ from: from, to: to, type: gameMenu.fromBuilding.type })
			link()
			
			rect(player.canvas.menu, shapes.dark, from[0] / gridMultiplier * blockWidth, from[1] * blockHeight / gridMultiplier, blockWidth, blockHeight)
			borderedCircle(player.canvas.menu, shapes[gameMenu.fromBuilding.type], from[0] / gridMultiplier * blockWidth, from[1] / gridMultiplier * blockHeight, blockWidth, blockHeight)
			
			gameMenu.linking = true
		}
		
		// if a building was found on that block
		else if (
			Object.keys(building).length > 0
		) {
			gameMenu.fromBuilding = building
			gameMenu.linking = true
			
			rect(player.canvas.menu, shapes.dark, xBlock * blockWidth, yBlock * blockHeight, blockWidth, blockHeight)
			borderedCircle(player.canvas.menu, shapes[gameMenu.fromBuilding.type], xBlock * blockWidth, yBlock * blockHeight, blockWidth, blockHeight)
		}
		
		// build options popup that goes to right
		else if (
			(gameMenu.left && gameMenu.x     == xBlock && gameMenu.y == yBlock) ||
			(gameMenu.left && gameMenu.x + 1 == xBlock && gameMenu.y == yBlock) ||
			(gameMenu.left && gameMenu.x + 2 == xBlock && gameMenu.y == yBlock) ||
			(gameMenu.left && gameMenu.x + 0 == xBlock && gameMenu.y == yBlock)
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
			!gameMenu.linking && // if the last action was not about linking, then it would be better to skip it
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
	
	function alreadyLinked(from, to) {
		var links = players[me].links
		
		for (var i = 0; i < links.length; i++) {
			if (links[i].from == from && links[i].to == to) return true
		}
		
		return false
	}
	
	function link() {
		for (var key in players) {
			var player = players[key]
			var canvas = player.canvas.link
			var links = player.links
			
			canvas.clearRect(0, 0, w, h)
			
			for (var l = 0; l < links.length; l++) {
				var from = links[l].from
				var to = links[l].to
				var type = links[l].type
				
				// make positions temporarily walkable
				setWalkableAt(player, from[0], from[1], true)
				setWalkableAt(player, to[0], to[1], true)
				
				// find a path between the buildings
				var path = finder.findPath(from[0], from[1], to[0], to[1], player.grid.clone())
				
				// make positions unwalkable again
				setWalkableAt(player, from[0], from[1], false)
				setWalkableAt(player, to[0], to[1], false)
				
				if (!path.length) continue
				
				var width = blockWidth / gridMultiplier
				var height = blockHeight / gridMultiplier
				
				var last = [
					path[0][0] * (width) + (width * 1.5),
					path[0][1] * (height) + (height * 1.5)
				]
				
				for (var i = 0; i < path.length ; i++) {
					var x1 = last[0]
					var y1 = last[1]
					var x2 = path[i][0] * (width) + (width * 1.5)
					var y2 = path[i][1] * (height) + (height * 1.5)
					
					line({
						ctx: canvas,
						shape: shapes[type],
						x1: x1,
						y1: y1,
						x2: x2,
						y2: y2,
						lineWidth: 2,
						lineDash: [12, 4],
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
		if (left) {
			for (var i = 0; i < types.length; i++) {
				rect(player.canvas.menu, shapes.dark, (xBlock + i) * blockWidth, yBlock * blockHeight, blockWidth, blockHeight)
				borderedCircle(player.canvas.menu, shapes[types[i]], (xBlock + i) * blockWidth, yBlock * blockHeight, blockWidth, blockHeight)
			}
		}
		else {
			var reversedTypes = JSON.parse(JSON.stringify(types)).reverse()
			for (var i = 0; i < types.length; i++) {
				rect(player.canvas.menu, shapes.dark, (xBlock + i - types.length + 1) * blockWidth, yBlock * blockHeight, blockWidth, blockHeight)
				borderedCircle(player.canvas.menu, shapes[reversedTypes[i]], (xBlock + i - types.length + 1) * blockWidth, yBlock * blockHeight, blockWidth, blockHeight)
			}
		}
	}

	function selectFromPopup(player, gameMenu, xBlock) {
		if (gameMenu.left) {
			var type = xBlock - gameMenu.x
			var id = player.elements.length
			var start = [gameMenu.x * gridMultiplier, gameMenu.y * gridMultiplier]
			var end = [horizontal * gridMultiplier, gameMenu.y * gridMultiplier]	
			
			// create a building
			var building = {
				playerId: player.id,
				id: id,
				type: types[type],
				start: start,
				end: end,
				charge: 0,
				dynamics: {}
			}
			
			socket.emit('message', { action: 'building', data: building, playerId: me })
		}
		else {
			var type = xBlock - gameMenu.x + types.length - 1
			var id = player.elements.length
			var start = [gameMenu.x * gridMultiplier, gameMenu.y * gridMultiplier]
			var end = [0, gameMenu.y * gridMultiplier]
			var reversedTypes = JSON.parse(JSON.stringify(types)).reverse()
			
			// create a building
			var building = {
				playerId: player.id,
				id: id,
				type: reversedTypes[type],
				start: start,
				end: end,
				charge: 0,
				dynamics: {
					fired: 0
				}
			}
			
			socket.emit('message', { action: 'building', data: building, playerId: me })
		}
	}
	
	setInterval(function() {
		time = (new Date).getTime()
		
		var elements = []
		for (var p in players) {
			players[p].projectiles = []
			resetProjectiles(players[p])
			updatePaths(players[p])
			health(players[p]) // host
			attack(players[p])
			hit(players[p]) // host
			
			if (host) {
				if (
					'elements' in players[p] &&
					players[p].elements.length
				) elements.push([players[p].id, players[p].elements])
			}
		}
		
		//if (host) socket.emit('message', { action: 'elements', data: elements })
	}, cycle)
	
	setInterval(function() {
		for (var key in players) animate(key)
	}, 1000 / 60)
	
	function animate(key) {
		if (client) players[key].canvas.movement.clearRect(0, 0, w, h)
		
		charge('movement', 'buildings', key)
		move('movement', 'elements', key)
		move('movement', 'projectiles', key)	
		
		/*
		if (delay) {
			setTimeout(function() {
				delayed = delay
				move(projectiles, 'movement')
				console.log('delayed', delayed)
				play()
			}, delay)			
		}
		else {
			move(projectiles, 'movement')	
		}
		*/
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
	
	function updatePaths(player) {
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
			if (element.path[0][0] >= horizontal * gridMultiplier - 2) {
				players[player.id].elements.splice(p, 1)
				//players.right.score = players.right.score - 1
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
			) continue
			
			var path = finder.findPath(player.elements[p].start[0], player.elements[p].start[1], player.elements[p].end[0], player.elements[p].end[1], player.grid.clone())
			
			players[player.id].elements[p].path = path
		}
	}
	
	function getDirection(index) {
		index = parseInt(index) - 1
		index = 6
		
		return [
			[[gameXNum / splitScreen, gameYNum / splitScreen], [0, 0]], // for the top left player
			[[0, gameYNum / splitScreen], [gameXNum / splitScreen, 0]], // top right
			[[gameXNum / splitScreen, 0], [0, gameYNum / splitScreen]], // bottom left
			[[0, 0 ], [gameXNum / splitScreen, gameYNum / splitScreen]], // bottom right
			[[0, gameYNum / 2 / splitScreen], [gameXNum / splitScreen, gameYNum / 2 / splitScreen]], // coming from left
			[[gameXNum / splitScreen, gameYNum - 1], [gameXNum / splitScreen, 0]], // coming from bottom
			[[gameXNum / splitScreen, 0], [gameXNum / splitScreen, gameYNum - 1]] //coming from top
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
				
				for (var r in players) {
					if (key != r) {
						var direction = getDirection(r)
						var start = [objects[p].start[0], direction[0][1]]
						var end = [objects[p].start[0], direction[1][1]]
						var element = {
							id: players[r].elements.length,
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
					}
				}
			}
			
			if (client) borderedCircle(players[key].canvas[layer], shapes[object.type], (object.start[0]) * (blockWidth / gridMultiplier), object.start[1] * (blockHeight / gridMultiplier), blockWidth, blockHeight, object.charge)
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
				if (!isNear(positionA, positionB)) continue
				
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
	
	/*
	function attack(player) {
		var buildings = player.buildings ? player.buildings : []
		var x = client ? 1 : 0
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
				if (!isNear(positionA, positionB)) continue
				
				var projectile = {
					path: [
						player.buildings[p].start,
						player.elements[r].path[1],
						player.elements[r].path[2]
					],
					shape: player.buildings[p].shape
				}
				
				players[player.id].projectiles.push(projectile)
				players[player.id].buildings[p].dynamics.fired++
				break
			}
		}
	}
	
	function hit(player) {
		var projectiles = player.projectiles
		var x = client ? 2 : 1
		for (var p = 0; p < projectiles.length; p++) {
			var x1 = host ? projectiles[p].path[1][0] : projectiles[p].path[2][0]
			var y1 = host ? projectiles[p].path[1][1] : projectiles[p].path[2][1]
				
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
					players[player.id].elements[r].dynamics.health = elements[r].dynamics.health - defaultDamage
					break
				}
			}
		}
	}
	*/
	
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

			var x1 = object.path[0][0] * (blockWidth / gridMultiplier)
			var y1 = object.path[0][1] * (blockHeight / gridMultiplier)
			var x2 = object.path[1][0] * (blockWidth / gridMultiplier)
			var y2 = object.path[1][1] * (blockHeight / gridMultiplier)
			var dt = (new Date).getTime() - time
			var dx = x1 - (x1 - x2) * dt / cycle
			var dy = y1 - (y1 - y2) * dt / cycle	
			
			if (client) {
				if (object.type) {
					var health = object.dynamics.health >= 0 ? object.dynamics.health : 0
					var percentage = convertRange(health, [0, object.dynamics.totalHealth], [0, 100])
					borderedCircle(players[key].canvas[layer], shapes[object.type], dx, dy, blockWidth, blockHeight, percentage, 0.55)
				}
				else {
					circle(players[key].canvas[layer], object.shape, dx, dy, blockWidth, blockHeight, 1)
				}
			}
		}
	}
	
	function setWalkableAt(player, x, y, walkable) {
		var grid = players[player.id].grid
		for (var p = 0; p < gridMultiplier; p++) {
			for (var r = 0; r < gridMultiplier; r++) {
				var left = x + p
				var top = y + r
				
				grid.setWalkableAt(left, top, walkable)
			}
		}
		players[player.id].grid = grid
	}
	
	function isNear(positionA, positionB) {
		for (var q = -gridMultiplier * defaultRange; q < gridMultiplier * 2 * defaultRange; q++) {
			if (positionA[0] + q == positionB[0]) {
				for (var o = -gridMultiplier * defaultRange; o < gridMultiplier * 2 * defaultRange; o++) {
					if (positionA[1] + o == positionB[1]) return true
				}
			}
		}
		return false
	}
	
	function line(o) {
		o.ctx.setLineDash(o.lineDash ? o.lineDash: [])
		o.ctx.beginPath()
		o.ctx.moveTo(o.x1, o.y1)
		o.ctx.lineTo(o.x2, o.y2)
		o.ctx.lineWidth = o.lineWidth ? o.lineWidth : 1;
		o.ctx.strokeStyle = o.shape.strokeStyle(o.alpha)
		o.ctx.stroke()
		o.ctx.closePath()
	}
	
	function rect(ctx, shape, x1, y1, x2, y2, alpha = 1) {
		ctx.beginPath()
		ctx.rect(x1, y1, x2, y2)
		ctx.fillStyle = shape.fillStyle(alpha)
		ctx.fill()	
		ctx.closePath()
	}
	
	function circle(ctx, shape, x1, y1, x2, y2, percent, alpha = 1) {
		var centerX = x1 + (x2 / 2)
		var centerY = y1 + (y2 / 2)
		var radius = Math.sqrt(x2 + y2)
		var degrees = percent ? percent * 3.6 : 360
		
		ctx.beginPath()
		ctx.moveTo(centerX, centerY)
		ctx.arc(centerX, centerY, radius / 2, 0, degreesToRadians(-degrees), false)
		ctx.fillStyle = shape.fillStyle(alpha)
		ctx.fill()
		ctx.closePath()
	}
	
	function borderedCircle(ctx, shape, x1, y1, x2, y2, percent, alpha = 1) {
		var centerX = x1 + (x2 / 2)
		var centerY = y1 + (y2 / 2)
		var radius = Math.sqrt(x2 + y2)
		var degrees = percent ? percent * 3.6 : 360
	
		ctx.beginPath()
		ctx.moveTo(centerX, centerY)
		ctx.arc(centerX, centerY, radius * 1.25, 0, 2 * Math.PI, false)
		ctx.arc(centerX, centerY, radius * 1.1, 0, 2 * Math.PI, true)
		ctx.arc(centerX, centerY, radius / 1.1, 0, degreesToRadians(-degrees), true)
		ctx.fillStyle = shape.fillStyle(alpha)
		ctx.fill()
		ctx.closePath()
	}
	
	function degreesToRadians(degrees) {
	    return (degrees * Math.PI) / 180
	}
	
	function convertRange(value, r1, r2) { 
	    return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0]
	}
	
	function createCanvas (container, className, w, h, z, top) {
		var ratio = PIXEL_RATIO
		var canvas = document.createElement('canvas')
		canvas.className = className
		canvas.width = w * ratio
		canvas.height = h * ratio
		canvas.style.position = 'absolute'
		canvas.style.top = 0
		canvas.style.width = w + 'px'
		canvas.style.height = h + 'px'
		canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0)
		canvas.style.zIndex = z
		container.appendChild(canvas)
		return canvas.getContext('2d')
	}
	
	function createCookie(name, value, days) {
	    var expires = ""
	    if (days) {
	        var date = new Date();
	        date.setTime(date.getTime() + (days*24*60*60*1000))
	        expires = "; expires=" + date.toUTCString()
	    }
	    document.cookie = name + "=" + value + expires + "; path=/"
	}
	
	function readCookie(name) {
	    var nameEQ = name + "="
	    var ca = document.cookie.split(';')
	    for(var i=0;i < ca.length;i++) {
	        var c = ca[i]
	        while (c.charAt(0)==' ') c = c.substring(1,c.length)
	        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length)
	    }
	    return null;
	}
	
	function size() {
		var w = window,
		    d = document,
		    e = d.documentElement,
		    g = d.getElementsByTagName('body')[0],
		    x = w.innerWidth || e.clientWidth || g.clientWidth,
		    y = w.innerHeight|| e.clientHeight|| g.clientHeight
		return { x: x, y: y }
	}
}

function getUrlParams(parameter) {
	var url = new URL(window.location.href)
	return url.searchParams.get(parameter)	
}