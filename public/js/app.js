var socket = io.connect()

document.getElementsByClassName('game')[0].addEventListener('touchstart', function(event) { createElement(event) })
document.getElementsByClassName('game')[0].addEventListener('mousedown', function(event) { createElement(event) })

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

var types = ['earth', 'water', 'fire', 'wind']
var matrix = []
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
		fillStyle: 'green',
		strokeStyle: 'rgba(0, 0, 0, 0)'
	},
	water: {
		fillStyle: 'blue',
		strokeStyle: 'rgba(0, 0, 0, 0)'
	},
	fire: {
		fillStyle: 'red',
		strokeStyle: 'rgba(0, 0, 0, 0)'
	},
	wind: {
		fillStyle: 'white',
		strokeStyle: 'rgba(0, 0, 0, 0)'
	}
}

var xCount = 20
var yCount = 8
var step = 1000	
var walk = true
var time = (new Date).getTime()
var recharge = 1 * 1000

// create the matrix
for (var i = 0; i < yCount; i++) {
	matrix.push([])
	
	for (var j = 0; j < xCount ; j++) {
		matrix[i].push(0)
	}
}

// make a grid from the matrix
var grid = new PF.Grid(matrix)

var finder = new PF.AStarFinder({
    allowDiagonal: true,
	dontCrossCorners: true
})

var horizontal = matrix[0].length - 1
var vertical = matrix.length + 1
var iw = window.innerWidth
var ih = window.innerHeight
var w = iw > ih ? iw : ih
var h = ih < iw ? ih : iw
var blockWidth = w / horizontal
var blockHeight = h / vertical
h = h - blockHeight * 1

var canvas = {
	background: createCanvas(w, h, 1, blockHeight),
	movement: createCanvas(w, h, 3, blockHeight),
	menu: createCanvas(w, h, 4, blockHeight)
}

// create a visual UI grid
for (var i = -2; i < horizontal + 4; i++) { 
	line(canvas.background, shapes.border, blockWidth * i, 0, blockWidth * i, h)
}

for (var i = 0; i < vertical + 1; i++) {
	line(canvas.background, shapes.border, 0, blockHeight * i, w, blockHeight * i)
}

// separate left from right
line(canvas.background, shapes.border, blockWidth * (horizontal + 1) / 2, 0, blockWidth * (horizontal + 1) / 2, h)
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
	var xBlock = Math.floor(x / blockWidth)
	var yBlock = Math.floor(y / blockHeight) - 1
	
	if (xBlock < horizontal / 2) {
		if (!creatingElement) {
			creatingElement = [xBlock, yBlock]
			
			for (var i = 0; i < types.length; i++) {
				rect(canvas.menu, shapes.active, (xBlock + i) * blockWidth, yBlock * blockHeight, blockWidth, blockHeight)
				
				borderedCircle(canvas.menu, shapes[types[i]], (xBlock + i) * blockWidth, yBlock * blockHeight, blockWidth, blockHeight)
			}
		}
		else if (
			(creatingElement[0] - 0 == xBlock && creatingElement[1] == yBlock) ||
			(creatingElement[0] + 1 == xBlock && creatingElement[1] == yBlock) ||
			(creatingElement[0] + 2 == xBlock && creatingElement[1] == yBlock) ||
			(creatingElement[0] + 3 == xBlock && creatingElement[1] == yBlock)
			
		) {
			var type = xBlock - creatingElement[0]
			var id = elements.length
			var start = [creatingElement[0], creatingElement[1]]
			var end = [horizontal, start[1]]
			
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
			creatingElement = [xBlock, yBlock]
			
			for (var i = 0; i < types.length; i++) {
				rect(canvas.menu, shapes.active, (xBlock + i - types.length + 1) * blockWidth, yBlock * blockHeight, blockWidth, blockHeight)
				
				borderedCircle(canvas.menu, shapes[types[i]], (xBlock + i - types.length + 1) * blockWidth, yBlock * blockHeight, blockWidth, blockHeight)
			}
		}
		else if (
			(creatingElement[0] - 3 == xBlock && creatingElement[1] == yBlock) ||
			(creatingElement[0] - 2 == xBlock && creatingElement[1] == yBlock) ||
			(creatingElement[0] - 1 == xBlock && creatingElement[1] == yBlock) ||
			(creatingElement[0] == xBlock && creatingElement[1] == yBlock)
		) {	
			var type = xBlock - creatingElement[0] + types.length - 1
			var id = elements.length
			var start = [creatingElement[0], creatingElement[1]]
			var end = [0, start[1]]
			
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
			grid.setWalkableAt(data.start[0], data.start[1], false)
			buildings.push(data)
			break
	}
})

setInterval(function() {
	walk = true
	time = (new Date).getTime()
}, step)

function animate() {
	requestAnimationFrame(animate)
	
	canvas.movement.clearRect(0, 0, w, h)
	
	if (walk) {
		walk = false
		reset()
		health()
		projectiles = []
		path()
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

function hit() {
	for (var r = 0; r < elements.length; r++) {
		var element = elements[r]
		
		if (
			!element.path ||
			!element.path[1] ||
			!element.path[1].length
		) continue	
			
		var x2 = element.path[1][0]
		var y2 = element.path[1][1]
		
		for (var p = 0; p < projectiles.length; p++) {
			var x1 = projectiles[p].path[1][0]
			var y1 = projectiles[p].path[1][1]
			if (x1 == x2 && y1 == y2) {
				elements[r].dynamics.health = elements[r].dynamics.health - 1
				break
			}
		}
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
						health: 3,
						splash: false
					}
				}
				
				elements.push(element)
			}
		}
		
		borderedCircle(canvas[layer], shapes[object.type], (object.start[0]) * blockWidth, object.start[1] * blockHeight, blockWidth, blockHeight, object.charge)
	}
}

function path() {
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

// move the elements according to their positions in space and time
function move(objects, layer) {
	for (var p = 0; p < objects.length; p++) {
		var object = objects[p]
		
		if (
			!object.path[1] ||
			!object.path[1].length
		) continue

		var x1 = object.path[0][0] * blockWidth
		var y1 = object.path[0][1] * blockHeight
		var x2 = object.path[1][0] * blockWidth
		var y2 = object.path[1][1] * blockHeight
		var dt = (new Date).getTime() - time
		var dx = x1 - (x1 - x2) * dt / step
		var dy = y1 - (y1 - y2) * dt / step

		circle(canvas[layer], object.shape, dx, dy, blockWidth, blockHeight)	
	}
}

function attack() {
	for (var p = 0; p < buildings.length; p++) {
		if (buildings[p].position != 'right') continue
		
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

function isNear(positionA, positionB) {
	for (var q = 0; q < 3; q++) {
		if (positionA[0] + q - 1 == positionB[0]) {
			for (var o = 0; o < 3; o++) {
				if (positionA[1] + o - 1 == positionB[1]) return true
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