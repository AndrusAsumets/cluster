var socket = io.connect()

document.getElementsByClassName('game')[0].addEventListener('touchstart', function(event) { createElement(event) })
document.getElementsByClassName('game')[0].addEventListener('mousedown', function(event) { createElement(event) })

var types = ['earth', 'water', 'fire', 'wind']
var buildings = []
var elements = []
var projectiles = []
var shapes = {
	background: {
		fillStyle: 'rgba(0, 0, 0, 1)'
	},
	border: {
		strokeStyle: 'rgba(255, 255, 255, 0.30)'
	},
	active: {
		fillStyle: 'rgba(0, 0, 0, 1)'
	},
	earth: {
		fillStyle: '#00ff65',
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

var gridMultiplier = 4
var uiXNum = 20
var uiYNum = 9
var gameXNum = uiXNum * gridMultiplier
var gameYNum = uiYNum * gridMultiplier
var step = 1500 / gridMultiplier
var walkable = true
var attackable = true
var time = (new Date).getTime()
var recharge = 1 * 1000

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

var horizontal = uiXNum - 1
var vertical = uiYNum + 1
var iw = window.innerWidth
var ih = window.innerHeight
var w = iw > ih ? iw : ih
var h = ih < iw ? ih : iw
var blockWidth = w / horizontal
var blockHeight = h / vertical
h = h - blockHeight * 1

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
	movement: createCanvas(w, h, 3, blockHeight),
	menu: createCanvas(w, h, 4, blockHeight)
}

// create a visual UI grid
for (var i = -2; i < horizontal + 4; i++) { 
	line(canvas.background, shapes.border, blockWidth * i, 0, blockWidth * i, h)
}

for (var i = -1; i < vertical + 2; i++) {
	line(canvas.background, shapes.border, 0, blockHeight * i, w, blockHeight * i)
}

// separate left from right
line(canvas.background, shapes.border, blockWidth * (horizontal + 1) / 2, 0, blockWidth * (horizontal + 1) / 2, h)

//diagonals
for (var i = 0; i < horizontal; i++) {
	for (var j = 0; j < vertical; j++) {
		var x1 = blockWidth * i
		var y1 = blockHeight * j
		
		line(canvas.background, { strokeStyle: 'rgba(255, 255, 255, 0.1)' }, x1, y1, x1 + blockWidth, y1 + blockHeight)
		line(canvas.background, { strokeStyle: 'rgba(255, 255, 255, 0.1)' }, x1 + blockWidth, y1, x1, y1 + blockHeight)
	}
}

var creatingElement = false
function createElement(event) {
	event.preventDefault()
	if ('touches' in event) event = event.touches[0]
	
	canvas.menu.clearRect(0, 0, w, h)
	
	var x = event.clientX
	var y = event.clientY
	var uiXBlock = Math.floor(x / blockWidth)
	var uiYBlock = Math.floor(y / blockHeight) - 1
	var left = uiXBlock < horizontal / 2
	
	if (left) {
		if (!creatingElement) {
			creatingElement = [uiXBlock, uiYBlock]
			
			for (var i = 0; i < types.length; i++) {
				rect(canvas.menu, shapes.active, (uiXBlock + i) * blockWidth, uiYBlock * blockHeight, blockWidth, blockHeight)
				
				borderedCircle(canvas.menu, shapes[types[i]], (uiXBlock + i) * blockWidth, uiYBlock * blockHeight, blockWidth, blockHeight)
			}
		}
		else if (
			(creatingElement[0] == uiXBlock && creatingElement[1] == uiYBlock) ||
			(creatingElement[0] + 1 == uiXBlock && creatingElement[1] == uiYBlock) ||
			(creatingElement[0] + 2 == uiXBlock && creatingElement[1] == uiYBlock) ||
			(creatingElement[0] + 3 == uiXBlock && creatingElement[1] == uiYBlock)
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
		else {
			creatingElement = false
		}
	}
	
	else {
		if (!creatingElement) {
			creatingElement = [uiXBlock, uiYBlock]
			
			for (var i = 0; i < types.length; i++) {
				rect(canvas.menu, shapes.active, (uiXBlock + i - types.length + 1) * blockWidth, uiYBlock * blockHeight, blockWidth, blockHeight)
				
				borderedCircle(canvas.menu, shapes[types[i]], (uiXBlock + i - types.length + 1) * blockWidth, uiYBlock * blockHeight, blockWidth, blockHeight)
			}
		}
		else if (
			(creatingElement[0] - 3 == uiXBlock && creatingElement[1] == uiYBlock) ||
			(creatingElement[0] - 2 == uiXBlock && creatingElement[1] == uiYBlock) ||
			(creatingElement[0] - 1 == uiXBlock && creatingElement[1] == uiYBlock) ||
			(creatingElement[0] == uiXBlock && creatingElement[1] == uiYBlock)
		) {	
			var type = uiXBlock - creatingElement[0] + types.length - 1
			var id = elements.length
			var start = [creatingElement[0] * gridMultiplier, creatingElement[1] * gridMultiplier]
			var end = [0, creatingElement[1] * gridMultiplier]
			
			// create a building
			var building = {
				id: id,
				position: 'right',
				type: types[type],
				start: start,
				end: end,
				shape: shapes[types[type]],
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
}

socket.on('message', function(message) {
	var action = message.action
	var data = message.data
	
	switch(action) {
		case 'connected':
			console.log('connected to ws')
			break
			
		case 'building':
			setWalkableAt(data.position, data.start[0], data.start[1])
			buildings.push(data)
			createPaths()
			break
	}
})

function setWalkableAt(position, x, y) {
	if (position == 'right') {
		for (var p = -gridMultiplier / 2 - 1; p < gridMultiplier; p++) {
			for (var r = -gridMultiplier / 2 - 1; r < gridMultiplier; r++) {
				var left = x + p
				var top = y + r
				if (top < 0) top = 0
				if (top > uiYNum * gridMultiplier - 1) top = uiYNum * gridMultiplier - 1
				grid.setWalkableAt(left, top, false)
			}
		}
	}
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
	move(elements, 'movement', step, 1)
	move(projectiles, 'movement', step, gridMultiplier)
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
	}
}

function createPaths() {
	for (var p = 0; p < elements.length; p++) {
		var element = elements[p]
		
		if (
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
						totalHealth: 20,
						health: 20,
						splash: false
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
function move(objects, layer, step, multiplier) {
	for (var p = 0; p < objects.length; p++) {
		var object = objects[p]
		
		if (
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