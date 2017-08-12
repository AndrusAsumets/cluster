var socket = io.connect()

document.addEventListener('touchstart', function(event) { createElement(event.touches[0]) })
document.addEventListener('mousedown', function(event) { createElement(event) })

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

var types = ['earth', 'water', 'fire', 'air']
var matrix = []
var buildings = []
var elements = []
var projectiles = []
var shapes = {
	background: {
		fillStyle: 'rgba(0, 0, 0, 1)'
	},
	border: {
		strokeStyle: 'rgba(255, 255, 255, 0.25)'
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
	air: {
		fillStyle: 'white',
		strokeStyle: 'rgba(0, 0, 0, 0)'
	}
}

var overflow = 2
var xCount = 20
var yCount = 9
var step = 1000
var walk = true
var time = (new Date).getTime()
var added = false
var recharge = 60000

setInterval(function() {
	walk = true
	time = (new Date).getTime()
	added = false
}, step)

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
h = h - blockHeight

var canvas = {
	background: createHiDPICanvas(w, h, 1),
	buildings: createHiDPICanvas(w, h, 2),
	elements: createHiDPICanvas(w, h, 3),
	menu: createHiDPICanvas(w, h, 4)
}
	
// create a visual UI grid
for (var i = 0; i < horizontal; i++) { 
	line(canvas.background, shapes.border, blockWidth * i, 0, blockWidth * i, h)
}

for (var i = 1; i < vertical; i++) {
	line(canvas.background, shapes.border, 0, blockHeight * i, w, blockHeight * i)
}

line(canvas.background, shapes.border, blockWidth * (horizontal + 1) / 2, 0, blockWidth * (horizontal + 1) / 2, h)
line(canvas.background, shapes.border, blockWidth * (horizontal + 1) / 2, 0, blockWidth * (horizontal + 1) / 2, h)

// separate left from right
for (var i = 0; i < horizontal; i++) {
	for (var j = 0; j < vertical; j++) {
		var x1 = blockWidth * i
		var y1 = blockHeight * j
		line(canvas.background, { strokeStyle: 'rgba(255, 255, 255, 0.15)' }, x1, y1, x1 + blockWidth, y1 + blockHeight)
		line(canvas.background, { strokeStyle: 'rgba(255, 255, 255, 0.15)' }, x1 + blockWidth, y1, x1, y1 + blockHeight)
	}
}

var creatingElement = false
function createElement(event) {
	event.preventDefault() 
	
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
				
				circle(canvas.menu, shapes[types[i]], (xBlock + i) * blockWidth, yBlock * blockHeight, blockWidth, blockHeight)
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
				type: type,
				start: start,
				end: end
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
				
				circle(canvas.menu, shapes[types[i]], (xBlock + i - types.length + 1) * blockWidth, yBlock * blockHeight, blockWidth, blockHeight)
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
				type: type,
				start: start,
				end: end
			}
			
			socket.emit('message', { action: 'building', data: building })
			
			creatingElement = false
		}
		else {
			creatingElement = false
		}
	}
}

function animate() {
	requestAnimationFrame(animate)
	
	canvas.elements.clearRect(0, 0, w, h)
	
	if (walk) {
		walk = false
		projectiles = []
		path()
		attack()
	}
	
	move(elements, 'elements')
	move(projectiles, 'elements')
}
requestAnimationFrame(animate)

function path() {
	for (var p = 0; p < elements.length; p++) {
		var element = elements[p]
		
		if (
			element.path &&
			element.path[1] &&
			element.path[1].length
		) {
			elements[p].path = finder.findPath(elements[p].path[1][0], elements[p].path[1][1], elements[p].end[0], elements[p].end[1], grid.clone())
		}
	}
}

// move the elements according to their positions in space and time
function move(objects, layer) {
	for (var p = 0; p < objects.length; p++) {
		var object = objects[p]
		
		if (
			object.path[1] &&
			object.path[1].length
		) {
			var x1 = object.path[0][0] * blockWidth
			var y1 = object.path[0][1] * blockHeight
			var x2 = object.path[1][0] * blockWidth
			var y2 = object.path[1][1] * blockHeight
			var dt = ((new Date).getTime() - time)
			var dx = x1 - (x1 - x2) * dt / step
			var dy = y1 - (y1 - y2) * dt / step
			
			circle(canvas[layer], object.shape, dx, dy, blockWidth, blockHeight)
		}	
	}
}

function attack() {
	for (var p = 0; p < buildings.length; p++) {
		if (buildings[p].position != 'right') continue
		
		if (
			!buildings[p].start ||
			!buildings[p].start.length
		) continue
		
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

socket.on('message', function(message) {
	var action = message.action
	var data = message.data
	
	switch(action) {
		case 'connected':
			console.log('connected to ws')
			break
			
		case 'building':
			grid.setWalkableAt(data.start[0], data.start[1], false)
			circle(canvas.buildings, shapes[types[data.type]], (data.start[0]) * blockWidth, data.start[1] * blockHeight, blockWidth, blockHeight)
			
			if (data.position == 'left') {
				var path = finder.findPath(data.start[0], data.start[1], data.end[0], data.end[1], grid.clone())
				path = PF.Util.smoothenPath(grid, path)
				path = PF.Util.expandPath(path)
			
				var element = {
					id: data.id,
					type: types[data.type],
					start: data.start,
					end: data.end,
					shape: shapes[types[data.type]],
					path: path,
					recharge: (function () {
						setInterval(function() {
							var path = finder.findPath(data.start[0], data.start[1], data.end[0], data.end[1], grid.clone())
							path = PF.Util.smoothenPath(grid, path)
							path = PF.Util.expandPath(path)
							var p = getElementIndex(data.id)
							elements[p].path = path
						}, recharge)
					})()
				}
				
				elements.push(element)
			}
			else {
				var building = {
					id: data.id,
					type: types[data.type],
					start: data.start,
					path: path,
					shape: shapes[types[data.type]],
					position: data.position
				}
				
				buildings.push(building)
			}
			
			break
	}
})

function line(ctx, shape, x1, y1, x2, y2) {
	ctx.beginPath()
	ctx.moveTo(x1, y1)
	ctx.lineTo(x2, y2)
	ctx.lineWidth = 1;
	ctx.strokeStyle = shape.strokeStyle
	ctx.stroke()
}

function rect(ctx, shape, x1, y1, x2, y2) {
	ctx.beginPath()
	ctx.rect(x1, y1, x2, y2)
	ctx.fillStyle = shape.fillStyle
	ctx.fill()	
}

function circle(ctx, shape, x1, y1, x2, y2) {
	ctx.beginPath()
	ctx.arc(x1 + (x2 / 2), y1 + (y2 / 2), Math.sqrt(x2 / 4 + y2 / 4), 0, 2 * Math.PI, false)
	ctx.arc(x1 + (x2 / 2), y1 + (y2 / 2), Math.sqrt(x2 / 4 + y2 / 8), 0, 2 * Math.PI, true)
	ctx.fillStyle = shape.fillStyle
	ctx.fill()	
}

function createHiDPICanvas (w, h, z) {
    ratio = PIXEL_RATIO
    var can = document.createElement('canvas')
    can.width = w * ratio
    can.height = h * ratio
    can.style.width = w + 'px'
    can.style.height = h + 'px'
    can.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0)
	can.style.position = 'absolute'
	can.style.zIndex = z
	document.getElementsByClassName('game')[0].appendChild(can)
	return can.getContext('2d')
}

function getElementIndex(id) {
	for (var p = 0; p < elements.length; p++) {
		if (elements[p].id == id) return p
	}
}