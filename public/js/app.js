var WebSocketServer = {
	isConnected: false,
	socket: null,
	interval: null,
	connect() {
		if (this.socket) {
			this.socket.destroy()
			delete this.socket
			this.socket = null
		}
		
		this.socket = io.connect('/', {
			reconnection: false
		})
		
		this.socket.on('message', (message) => {
			var action = message.action
			var data = message.data
			
			switch(action) {
				case 'connect':
					console.log('connected to ws')
					this.isConnected = true
					var room = window.location.hash ? '/' + window.location.hash : '/'
					this.socket.emit('join', { room: room })
					break
					
				case 'building':
					if (!score()) return
					
					// check if exists on that location already
					if (exists(data)) return
					
					// check for open paths
					setWalkableAt(data.position, data.start[0], data.start[1], false)
					if (!finder.findPath(0, 0, gameXNum - 1, 0, grid.clone()).length) return setWalkableAt(data.position, data.start[0], data.start[1], true)
					
					document.getElementsByClassName('player-' + data.position)[0].innerHTML = players[data.position].score - 1
					players[data.position].score = players[data.position].score - 1
					buildings.push(data)
					if (data.position == 'right') createPaths()
			}
		})

		this.socket.on('disconnect', () => {
			this.isConnected = false;
			this.interval = window.setInterval(() => {
				if (this.isConnected) {
					clearInterval(this.interval)
					this.interval = null
					return
				}
				WebSocketServer.connect()
			}, 5000)
		})

		return this.socket
	}
}

var socket = WebSocketServer.connect()

var defaultScore = 100
var defaultHealth = 25
var players = {
	left: {
		score: defaultScore
	},
	right: {
		score: defaultScore
	}
}
var gameLength = 5 * 60 * 1000
var types = ['earth', 'water', 'fire', 'wind']
var buildings = []
var elements = []
var projectiles = []
var shapes = {
	background: {
		fillStyle: '#191D31'
	},
	border: {
		strokeStyle: 'rgba(255, 255, 255, 0.4)'
	},
	active: {
		fillStyle: '#191D31'
	},
	earth: {
		fillStyle: '#3aff50',
		strokeStyle: 'rgba(0, 0, 0, 0)'
	},
	water: {
		fillStyle: '#00BEE5',
		strokeStyle: 'rgba(0, 0, 0, 0)'
	},
	fire: {
		fillStyle: '#FF4A3D',
		strokeStyle: 'rgba(0, 0, 0, 0)'
	},
	wind: {
		fillStyle: 'white',
		strokeStyle: 'rgba(0, 0, 0, 0)'
	}
}

var uiXNum = 18
var uiYNum = 9
var gridMultiplier = 4
var gameXNum = (uiXNum + 1) * gridMultiplier
var gameYNum = uiYNum * gridMultiplier
var step = 500
var walkable = true
var attackable = true
var time = (new Date).getTime()
var recharge = 10 * 1000

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

var horizontal = uiXNum
var vertical = uiYNum + 1
var iw = window.innerWidth
var ih = window.innerHeight
var w = iw > ih ? iw : ih
var h = ih < iw ? ih : iw
var blockWidth = w / horizontal
var blockHeight = h / vertical
h = h - blockHeight * 1

//menu
document.getElementsByClassName('menu')[0].style.height = blockHeight + 'px'

// canvas
var PIXEL_RATIO = (function () {
    var ctx = document.createElement('canvas').getContext('2d'),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1

    return dpr / bsr
})()
var canvas = {
	background: createCanvas(w, h, 1, blockHeight),
	movement: createCanvas(w, h, 2, blockHeight),
	menu: createCanvas(w, h, 3, blockHeight)
}

// create a visual UI grid
for (var i = 1; i < horizontal; i++) { 
	line(canvas.background, shapes.border, blockWidth * i, 0, blockWidth * i, h)
}

for (var i = 1; i < vertical - 1; i++) {
	line(canvas.background, shapes.border, 0, blockHeight * i, w, blockHeight * i)
}

// separate left from right
line(canvas.background, shapes.border, blockWidth * horizontal / 2, 0, blockWidth * horizontal / 2, h)

//diagonals
for (var i = 0; i < horizontal; i++) {
	for (var j = 0; j < vertical; j++) {
		var x1 = blockWidth * i
		var y1 = blockHeight * j
		
		line(canvas.background, { strokeStyle: 'rgba(255, 255, 255, 0.05)' }, x1, y1, x1 + blockWidth, y1 + blockHeight)
		line(canvas.background, { strokeStyle: 'rgba(255, 255, 255, 0.05)' }, x1 + blockWidth, y1, x1, y1 + blockHeight)
	}
}

function score() {
	document.getElementsByClassName('player-left')[0].innerHTML = players.left.score > 0 ? players.left.score : 0
	document.getElementsByClassName('player-right')[0].innerHTML = players.right.score > 0 ? players.right.score : 0
	
	if (gameLength < 0) {
		document.getElementsByClassName('score')[0].innerHTML = 'PlayerB won!'
		return false
	}
	else if (players.left.score < 0) {
		document.getElementsByClassName('score')[0].innerHTML = 'PlayerB won!'
		return false
	}
	else if (players.right.score < 0) {
		document.getElementsByClassName('score')[0].innerHTML = 'PlayerA won!'
		return false
	}
	return true
}

var gameInterval = setInterval(function() {
	gameLength = gameLength - 1000
	var ms = gameLength
	ms = 1000 * Math.round(ms / 1000)
	var d = new Date(ms)
	document.getElementsByClassName('score')[0].innerHTML = d.getUTCMinutes() + ':' + d.getUTCSeconds()
	
	if (!score()) clearInterval(gameInterval)
}, 1000)

document.getElementsByClassName('game')[0].addEventListener('touchstart', function(event) { createElement(event) })
document.getElementsByClassName('game')[0].addEventListener('mousedown', function(event) { createElement(event) })

var creatingElement = false
function createElement(event) {
	if (!score()) return
	
	event.preventDefault()
	if ('touches' in event) event = event.touches[0]
	
	// disallow building outside of stage
	var x = event.clientX
	var y = event.clientY
	var uiXBlock = Math.floor(x / blockWidth)
	var uiYBlock = Math.floor(y / blockHeight) - 1
	var left = uiXBlock < horizontal / 2
	
	canvas.menu.clearRect(0, 0, w, h)
	
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
				rect(canvas.menu, shapes.active, (uiXBlock + i) * blockWidth, uiYBlock * blockHeight, blockWidth, blockHeight)
				
				borderedCircle(canvas.menu, shapes[types[i]], (uiXBlock + i) * blockWidth, uiYBlock * blockHeight, blockWidth, blockHeight)
			}
		}
		else {
			var reversedTypes = JSON.parse(JSON.stringify(types)).reverse()
			for (var i = 0; i < types.length; i++) {
				rect(canvas.menu, shapes.active, (uiXBlock + i - types.length + 1) * blockWidth, uiYBlock * blockHeight, blockWidth, blockHeight)
				
				borderedCircle(canvas.menu, shapes[reversedTypes[i]], (uiXBlock + i - types.length + 1) * blockWidth, uiYBlock * blockHeight, blockWidth, blockHeight)
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
		var id = elements.length
		var start = [creatingElement[0] * gridMultiplier, (creatingElement[1]) * gridMultiplier]
		var end = [horizontal * gridMultiplier, creatingElement[1] * gridMultiplier]
		
		// create a building
		var building = {
			id: id,
			position: 'left',
			type: types[type],
			start: start,
			end: end,
			shape: shapes[types[type]],
			charge: 0,
			dynamics: {}
		}
		
		socket.emit('message', { action: 'building', data: building })
		creatingElement = false
	}
	else if (
		(!creatingElement[2] && creatingElement[0] - 3 == uiXBlock && creatingElement[1] == uiYBlock) ||
		(!creatingElement[2] && creatingElement[0] - 2 == uiXBlock && creatingElement[1] == uiYBlock) ||
		(!creatingElement[2] && creatingElement[0] - 1 == uiXBlock && creatingElement[1] == uiYBlock) ||
		(!creatingElement[2] && creatingElement[0] == uiXBlock && creatingElement[1] == uiYBlock)
	) {	
		var type = uiXBlock - creatingElement[0] + types.length - 1
		var id = elements.length
		var start = [creatingElement[0] * gridMultiplier, creatingElement[1] * gridMultiplier]
		var end = [0, creatingElement[1] * gridMultiplier]
		var reversedTypes = JSON.parse(JSON.stringify(types)).reverse()
		
		// create a building
		var building = {
			id: id,
			position: 'right',
			type: reversedTypes[type],
			start: start,
			end: end,
			shape: shapes[reversedTypes[type]],
			charge: 0,
			dynamics: {
				fired: 0
			}
		}
		
		socket.emit('message', { action: 'building', data: building })
		creatingElement = false
	}

	else {
		creatingElement = false
	}
}

function exists(building) {
	for (var p = 0; p < buildings.length; p++) {
		if (
			buildings[p].start[0] == building.start[0] &&
			buildings[p].start[1] == building.start[1]
		) return true
	}
	
	return false
}

setInterval(function() {
	walkable = true
	time = (new Date).getTime()
}, step)

function animate() {
	requestAnimationFrame(animate)
	
	canvas.movement.clearRect(0, 0, w, h)
	
	if (walkable) {
		walkable = false
		projectiles = []
		reset()
		updatePaths()
		health()
		attack()
		hit()
	}
	
	charge(buildings, 'movement')
	move(elements, 'movement')
	move(projectiles, 'movement')
}
requestAnimationFrame(animate)

function reset() {
	for (var r = 0; r < buildings.length; r++) {
		if (!'fired' in buildings[r].dynamics) continue
		buildings[r].dynamics.fired = 0
	}
}

function health() {
	for (var r = 0; r < elements.length; r++) {
		if (elements[r].dynamics.health <= 0) elements.splice(r, 1)
	}
}

function updatePaths() {
	for (var p = 0; p < elements.length; p++) {
		var element = elements[p]
		
		if (
			!element.path ||
			!element.path[1] ||
			!element.path[1].length
		) continue
		
		elements[p].path.splice(0, 1)
		
		if (element.path[0][0] >= horizontal * gridMultiplier - 2) {
			element.path = null
			players.right.score = players.right.score - 1
		}
	}
}

function createPaths() {
	for (var p = 0; p < elements.length; p++) {
		var element = elements[p]
		
		if (
			!element.path == 'left' ||
			!element.path ||
			!element.path[1] ||
			!element.path[1].length
		) continue
		
		elements[p].path = finder.findPath(elements[p].path[1][0], elements[p].path[1][1], elements[p].end[0], elements[p].end[1], grid.clone())
	}
}

function charge(objects, layer) {
	for (var p = 0; p < objects.length; p++) {
		var object = objects[p]
		
		if (object.charge < 100) {
			object.charge = object.charge + convertRange(1 / 60, [0, recharge / 1000], [0, 100])
			objects[p].charge = object.charge
		}
		else if (object.charge >= 100) {
			if (object.position == 'left') {
				objects[p].charge = 0
				
				var element = {
					id: elements.length,
					type: object.type,
					start: object.start,
					end: object.end,
					shape: object.shape,
					path: finder.findPath(object.start[0], object.start[1], object.end[0], object.end[1], grid.clone()),
					dynamics: {
						totalHealth: defaultHealth,
						health: defaultHealth
					}
				}
				
				elements.push(element)
			}
			else {
				objects[p].built = true	
			}
		}
		
		borderedCircle(canvas[layer], shapes[object.type], (object.start[0]) * (blockWidth / gridMultiplier), object.start[1] * (blockHeight / gridMultiplier), blockWidth, blockHeight, object.charge)
	}
}

function attack() {
	for (var p = 0; p < buildings.length; p++) {
		if (buildings[p].position != 'right') continue
		if (!buildings[p].built) continue
		
		var positionA = buildings[p].start
		for (var r = 0; r < elements.length; r++) {
			if (
				!elements[r].path ||
				!elements[r].path[1] ||
				!elements[r].path[1].length
			) continue

			var positionB = elements[r].path[1]
			if (!isNear(positionA, positionB)) continue
			
			var projectile = {
				path: [
					buildings[p].start,
					elements[r].path[1]
				],
				shape: buildings[p].shape
			}
			
			projectiles.push(projectile)
			buildings[p].dynamics.fired++
			break
		}
	}
}

function hit() {
	for (var p = 0; p < projectiles.length; p++) {
		var x1 = projectiles[p].path[1][0]
		var y1 = projectiles[p].path[1][1]
			
		for (var r = 0; r < elements.length; r++) {
			var element = elements[r]
			
			if (
				!element.path ||
				!element.path[1] ||
				!element.path[1].length
			) continue
				
			var x2 = element.path[1][0]
			var y2 = element.path[1][1]
			if (x1 == x2 && y1 == y2) {
				elements[r].dynamics.health = elements[r].dynamics.health - 1
				break
			}
		}
	}
}

// move the elements according to their positions in space and time
function move(objects, layer) {
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
		var dx = x1 - (x1 - x2) * dt / step
		var dy = y1 - (y1 - y2) * dt / step	
		
		if (object.type) {
			var health = object.dynamics.health >= 0 ? object.dynamics.health : 0
			var percentage = convertRange(health, [0, object.dynamics.totalHealth], [1, 100])
			borderedCircle(canvas[layer], object.shape, dx, dy, blockWidth, blockHeight, percentage)
		}
		else {
			circle(canvas[layer], object.shape, dx, dy, blockWidth, blockHeight)
		}
	}
}

function isNear(positionA, positionB) {
	for (var q = 0; q < 3 * gridMultiplier; q++) {
		if (positionA[0] + q - gridMultiplier == positionB[0]) {
			for (var o = 0; o < 3 * gridMultiplier; o++) {
				if (positionA[1] + o - gridMultiplier == positionB[1]) return true
			}
		}
	}
	return false
}

function setWalkableAt(position, x, y, walkable) {
	if (position == 'right') {
		for (var p = -gridMultiplier / 2 - 1; p < gridMultiplier; p++) {
			for (var r = -gridMultiplier / 2 - 1; r < gridMultiplier; r++) {
				var left = x + p
				var top = y + r
				if (top < 0) top = 0
				if (top > uiYNum * gridMultiplier - 1) top = uiYNum * gridMultiplier - 1
				grid.setWalkableAt(left, top, walkable)
			}
		}
	}
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
	ctx.arc(centerX, centerY, radius * 1.1, 0, 2 * Math.PI, false)
	ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, true)
	ctx.arc(centerX, centerY, radius / 2, 0, degreesToRadians(-degrees), true)
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

function createCanvas (w, h, z, top) {
    ratio = PIXEL_RATIO
    var can = document.createElement('canvas')
    can.width = w * ratio
    can.height = h * ratio
    can.style.width = w + 'px'
    can.style.height = h + 'px'
    can.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0)
	can.style.position = 'absolute'
	can.style.top = top + 'px'
	can.style.zIndex = z
	document.getElementsByClassName('game')[0].appendChild(can)
	return can.getContext('2d')
}