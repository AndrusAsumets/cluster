export function game() {	
	const CREATE_PLAYER = 'CREATE_PLAYER'
	const STATE = 'STATE'
	
	var client = window ? true : false
	var host = !window ? true : false
	var io = require('socket.io-client')
	var PF = require('pathfinding')
	var pingpong = null
	var speedMultiplier = 1 / 1.5
	var uiXNum = 20
	var uiYNum = 10
	var gridMultiplier = 2
	var gameXNum = uiXNum * gridMultiplier
	var gameYNum = uiYNum * gridMultiplier
	var step = 1000 / speedMultiplier
	var attackable = true
	var time = (new Date).getTime()
	var recharge = 30 * 1000
	var players = {}
	
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
	var blockWidth = w / horizontal
	var blockHeight = h / vertical
	w = w
	h = h / splitScreen
	
	function Player (options) {
		this.id = options.id
		this.buildings = []
		this.elements = []
		this.projectiles = []
		
		var self = this
		
		if (client) {
			this.container = document.createElement('div')
			this.container.className = 'player player_' + this.id
			document.getElementsByClassName('game')[0].appendChild(this.container)
			this.canvas = client ? {
				background: createCanvas(this.container, 'background_' + this.id, w, h, 1, blockHeight),
				movement: createCanvas(this.container, 'movement_' + this.id, w, h, 2, blockHeight),
				menu: createCanvas(this.container, 'menu_' + this.id, w, h, 3, blockHeight)
			} : null
			
			// create a visual UI grid
			for (var i = 0; i < horizontal; i++) { 
				line(this.canvas.background, { strokeStyle: 'rgba(0, 0, 0, 0.5)' }, blockWidth * i, 0, blockWidth * i, h)
			}
			
			for (var i = 0; i < vertical; i++) {
				line(this.canvas.background, { strokeStyle: 'rgba(0, 0, 0, 0.5)' }, 0, blockHeight * i, w, blockHeight * i)
			}
			
			// separate sides
			//line(this.canvas.background, { strokeStyle: 'rgba(0, 0, 0, 0.5)' }, blockWidth * horizontal / 2, 0, blockWidth * horizontal / 2, h)
			
			//diagonals
			for (var i = 0; i < horizontal; i++) {
				for (var j = 0; j < vertical; j++) {
					var x1 = blockWidth * i
					var y1 = blockHeight * j
					
					line(this.canvas.background, { strokeStyle: 'rgba(0, 0, 0, 0.25)' }, x1, y1, x1 + blockWidth, y1 + blockHeight)
					line(this.canvas.background, { strokeStyle: 'rgba(0, 0, 0, 0.25)' }, x1 + blockWidth, y1, x1, y1 + blockHeight)
				}
			}
			
			document.getElementsByClassName(this.container.className)[0].addEventListener('touchstart', function(event) { createElement(event) })
			document.getElementsByClassName(this.container.className)[0].addEventListener('mousedown', function(event) { createElement(event) })
		}
	}
	
	var defaultScore = 10000
	var defaultHealth = 50
	var defaultDamage = 5
	var gameLength = 10 * 60 * 1000
	var types = ['earth', 'water', 'fire', 'wind']
	var shapes = {
		background: {
			fillStyle: '#191D31'
		},
		border: {
			strokeStyle: 'rgba(255, 255, 255, 0.4)'
		},
		active: {		
			fillStyle: 'rgba(14, 10, 46, 0.75)'
		},
		earth: {
			fillStyle: '#9e57a5'
		},
		water: {
			fillStyle: '#00BEE5'
		},
		fire: {
			fillStyle: '#FF4A3D'
		},
		wind: {
			fillStyle: 'white'
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
	
	// make grids from the matrices
	var grid = new PF.Grid(matrix)
	
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
					
					socket.emit('message', { action: CREATE_PLAYER, data: me})
					
					for (var p = 0; p < players.length; p++) {
						//playerId = players[p]
						//socket.emit('message', { action: 'create_player', data: playerId })
					}

					function ping() {
						//socket.emit('message', { action: 'pingpong', data: (new Date).getTime() })
					}
					setInterval(function() {
						ping()
					}, 10000)
					ping()
				}
				break
				
			case CREATE_PLAYER:
				if (host) {
					if (!players[data]) players[data] = new Player({ id: data })
					socket.emit('message', { to: data, action: STATE, data: players })
				}
				break
				
			case STATE:
				if (client && to == me) {
					for (var key in data) {
						if (!players[key]) players[key] = new Player({ id: key })

						players[key].buildings = data[key].buildings
						players[key].elements = data[key].elements
					}
				}
				break
				
			case 'pingpong':
				if (client) pingpong = ((new Date).getTime() - data) / 2 / speedMultiplier
				break
				
			case 'building':
				if (!score()) return
				
				var player = players[data.playerId]
				
				// check if exists on that location already
				if (exists(player.buildings, data)) return
				
				// check for open paths
				setWalkableAt(data.start[0], data.start[1], false)
				if (!finder.findPath(0, 0, gameXNum - 1, 0, grid.clone()).length) return setWalkableAt(data.start[0], data.start[1], true)
				
				//if (client) document.getElementsByClassName('player-' + data.position)[0].innerHTML = players[data.position].score - 1
				
				//players[data.position].score = players[data.position].score - 1
				player.buildings.push(data)
				if (host) createPaths(player) // host
				break
				
			case 'elements':
				//if (client) for (var p = 0; p < data.length; p++) players[data[p][0]] = data[p][1]
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
	
	var creatingElement = false
	function createElement(event) {
		if (!score()) return
		
		var player = players[me]
		
		event.preventDefault()
		if ('touches' in event) event = event.touches[0]
		
		// disallow building outside of stage
		var x = event.clientX
		var y = event.clientY
		var uiXBlock = Math.floor(x / blockWidth)
		var uiYBlock = Math.floor(y / blockHeight)
		var left = uiXBlock < horizontal / splitScreen
		
		player.canvas.menu.clearRect(0, 0, w, h)
		
		if (
			uiXBlock < 0 ||
			uiYBlock < 0 ||
			uiXBlock > uiXNum - 1 ||
			uiYBlock > uiYNum - 1
		) return
		
		if (!creatingElement) {
			creatingElement = [uiXBlock, uiYBlock, left]
			
			if (left) {
				for (var i = 0; i < types.length; i++) {
					rect(player.canvas.menu, shapes.active, (uiXBlock + i) * blockWidth, uiYBlock * blockHeight, blockWidth, blockHeight)
					
					borderedCircle(player.canvas.menu, shapes[types[i]], (uiXBlock + i) * blockWidth, uiYBlock * blockHeight, blockWidth, blockHeight)
				}
			}
			else {
				var reversedTypes = JSON.parse(JSON.stringify(types)).reverse()
				for (var i = 0; i < types.length; i++) {
					rect(player.canvas.menu, shapes.active, (uiXBlock + i - types.length + 1) * blockWidth, uiYBlock * blockHeight, blockWidth, blockHeight)
					
					borderedCircle(player.canvas.menu, shapes[reversedTypes[i]], (uiXBlock + i - types.length + 1) * blockWidth, uiYBlock * blockHeight, blockWidth, blockHeight)
				}
			}
		}
		else if (
			(creatingElement[2] && creatingElement[0] == uiXBlock && creatingElement[1] == uiYBlock) ||
			(creatingElement[2] && creatingElement[0] + 1 == uiXBlock && creatingElement[1] == uiYBlock) ||
			(creatingElement[2] && creatingElement[0] + 2 == uiXBlock && creatingElement[1] == uiYBlock) ||
			(creatingElement[2] && creatingElement[0] + 3 == uiXBlock && creatingElement[1] == uiYBlock)
		) {
			var type = uiXBlock - creatingElement[0]
			var id = player.elements.length
			var start = [creatingElement[0] * gridMultiplier, (creatingElement[1]) * gridMultiplier]
			var end = [horizontal * gridMultiplier, creatingElement[1] * gridMultiplier]
			
			// create a building
			var building = {
				playerId: player.id,
				id: id,
				type: types[type],
				start: start,
				end: end,
				shape: shapes[types[type]],
				charge: 0,
				dynamics: {}
			}
			
			socket.emit('message', { action: 'building', data: building, playerId: me })
			creatingElement = false
		}
		else if (
			(!creatingElement[2] && creatingElement[0] - 3 == uiXBlock && creatingElement[1] == uiYBlock) ||
			(!creatingElement[2] && creatingElement[0] - 2 == uiXBlock && creatingElement[1] == uiYBlock) ||
			(!creatingElement[2] && creatingElement[0] - 1 == uiXBlock && creatingElement[1] == uiYBlock) ||
			(!creatingElement[2] && creatingElement[0] == uiXBlock && creatingElement[1] == uiYBlock)
		) {	
			var type = uiXBlock - creatingElement[0] + types.length - 1
			var id = player.elements.length
			var start = [creatingElement[0] * gridMultiplier, creatingElement[1] * gridMultiplier]
			var end = [0, creatingElement[1] * gridMultiplier]
			var reversedTypes = JSON.parse(JSON.stringify(types)).reverse()
			
			// create a building
			var building = {
				playerId: player.id,
				id: id,
				type: reversedTypes[type],
				start: start,
				end: end,
				shape: shapes[reversedTypes[type]],
				charge: 0,
				dynamics: {
					fired: 0
				}
			}
			
			socket.emit('message', { action: 'building', data: building, playerId: me })
			creatingElement = false
		}
	
		else {
			creatingElement = false
		}
	}
	
	function exists(buildings, building) {
		for (var p = 0; p < buildings.length; p++) {
			if (
				buildings[p].start[0] == building.start[0] &&
				buildings[p].start[1] == building.start[1]
			) return true
		}
		
		return false
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
		}, step)
	
	setInterval(function() {
		for (var key in players) {
			if (key != 'undefined') animate(key)
		}
	}, 1000 / 60)
	
	function animate(key) {
		if (client) players[key].canvas.movement.clearRect(0, 0, w, h)
		
		charge('movement', 'buildings', key, 0)
		move('movement', 'elements', key, 0)
		move('movement', 'projectiles', key, pingpong)	
		
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
			
			var path = finder.findPath(player.elements[p].start[0], player.elements[p].start[1], player.elements[p].end[0], player.elements[p].end[1], grid.clone())
			
			players[player.id].elements[p].path = path
		}
	}
	
	function getDirection(index) {
		index = parseInt(index) - 1
		index = 4
		
		return [
			[[gameXNum / splitScreen, gameYNum / splitScreen], [0, 0]], // for the top left player
			[[0, gameYNum / splitScreen], [gameXNum / splitScreen, 0]], // top right
			[[gameXNum / splitScreen, 0], [0, gameYNum / splitScreen]], // bottom left
			[[0, 0 ], [gameXNum / splitScreen, gameYNum / splitScreen]], // bottom right
			[[0, gameYNum / 2 / splitScreen], [gameXNum / splitScreen, gameYNum / 2 / splitScreen]]
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
				
				var direction = getDirection(key)
				var start = direction[0]
				var end = direction[1]
				var element = {
					id: players[key].elements.length,
					type: object.type,
					start: start,
					end: end,
					shape: object.shape,
					path: finder.findPath(start[0], start[1], end[0], end[1], grid.clone()),
					dynamics: {
						totalHealth: defaultHealth,
						health: defaultHealth
					}
				}
				
				for (var p in players) if (p != key) players[p].elements.push(element)
			}
			
			if (client) borderedCircle(players[key].canvas[layer], shapes[object.type], (object.start[0]) * (blockWidth / gridMultiplier), object.start[1] * (blockHeight / gridMultiplier), blockWidth, blockHeight, object.charge)
		}
	}
	
	function attack(player) {
		var buildings = player.buildings ? player.buildings : []
		var x = 0
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
	function move(layer, type, key, delay) {
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
			var dt = (new Date).getTime() - time + delay
			var dx = x1 - (x1 - x2) * dt / step
			var dy = y1 - (y1 - y2) * dt / step	
			
			if (client) {
				if (object.type) {
					var health = object.dynamics.health >= 0 ? object.dynamics.health : 0
					var percentage = convertRange(health, [0, object.dynamics.totalHealth], [1, 100])
					borderedCircle(players[key].canvas[layer], object.shape, dx, dy, blockWidth, blockHeight, percentage)
				}
				else {
					circle(players[key].canvas[layer], object.shape, dx, dy, blockWidth, blockHeight)
				}
			}
		}
	}
	
	function setWalkableAt(x, y, walkable) {
		for (var p = 1; p < gridMultiplier + 1; p++) {
			for (var r = 1; r < gridMultiplier + 1; r++) {
				var left = x + p
				var top = y + r
				grid.setWalkableAt(left, top, walkable)
			}
		}
	}
	
	function isNear(positionA, positionB) {
		for (var q = 0; q < gridMultiplier; q++) {
			if ((positionA[0] + q) * gridMultiplier == positionB[0]) {
				for (var o = 0; o < 3 * gridMultiplier; o++) {
					if ((positionA[1] + o) * gridMultiplier == positionB[1]) return true
				}
			}
		}
		return false
	}
	
	function line(ctx, shape, x1, y1, x2, y2) {
		ctx.beginPath()
		ctx.moveTo(x1, y1)
		ctx.lineTo(x2, y2)
		ctx.lineWidth = 1;
		ctx.strokeStyle = shape.strokeStyle
		ctx.stroke()
		ctx.closePath()
	}
	
	function rect(ctx, shape, x1, y1, x2, y2) {
		ctx.beginPath()
		ctx.rect(x1, y1, x2, y2)
		ctx.fillStyle = shape.fillStyle
		ctx.fill()	
		ctx.closePath()
	}
	
	function circle(ctx, shape, x1, y1, x2, y2, percent) {
		var centerX = x1 + (x2 / 2)
		var centerY = y1 + (y2 / 2)
		var radius = Math.sqrt(x2 + y2)
		var degrees = percent ? percent * 3.6 : 360
		
		ctx.beginPath()
		ctx.moveTo(centerX, centerY)
		ctx.arc(centerX, centerY, radius / 2, 0, degreesToRadians(-degrees), false)
		ctx.fillStyle = shape.fillStyle
		ctx.fill()
		ctx.closePath()
	}
	
	function borderedCircle(ctx, shape, x1, y1, x2, y2, percent) {
		var centerX = x1 + (x2 / 2)
		var centerY = y1 + (y2 / 2)
		var radius = Math.sqrt(x2 + y2)
		var degrees = percent ? percent * 3.6 : 360
	
		ctx.beginPath()
		ctx.moveTo(centerX, centerY)
		ctx.arc(centerX, centerY, radius * 1.25, 0, 2 * Math.PI, false)
		ctx.arc(centerX, centerY, radius * 1.1, 0, 2 * Math.PI, true)
		ctx.arc(centerX, centerY, radius / 1.1, 0, degreesToRadians(-degrees), true)
		ctx.fillStyle = shape.fillStyle
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