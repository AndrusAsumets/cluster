var socket = io.connect()

document.addEventListener('touchstart', function(event) { createElement(event.touches[0]) })

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
var shapes = {
	background: {
		fillStyle: 'rgba(0, 0, 0, 1)'
	},
	border: {
		strokeStyle: 'rgba(255, 255, 255, 0.2)'
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

var gridMultiplier = 2 // make the grid n times larger, so we could get spheres that pass from the corners
var xCount = 20
var yCount = 9
var step = 1000
var walk = true
var time = (new Date).getTime()
var added = false
var recharge = 30000

setInterval(function() {
	walk = true
	time = (new Date).getTime()
	added = false
}, step)

// create the matrix
for (var i = 0; i < yCount * gridMultiplier; i++) {
	matrix.push([])
	
	for (var j = 0; j < xCount * gridMultiplier ; j++) {
		matrix[i].push(0)
	}
}

// make a grid from the matrix
var grid = new PF.Grid(matrix)

// make unseeable grid unwalkable
for (var i = 0; i < matrix[0].length; i++) {
	var horizontallyWalkable = matrix[0].length / gridMultiplier + 1
	var verticallyWalkable = matrix.length / gridMultiplier
	
	for (var j = 0; j < matrix.length; j++) {
		if (
			i >= horizontallyWalkable ||
			j >= verticallyWalkable
		) {
			grid.setWalkableAt(i, j, false)
		}
	}
}

var finder = new PF.AStarFinder({
    allowDiagonal: true,
	dontCrossCorners: true
})

var horizontal = matrix[0].length / gridMultiplier - 1
var vertical = matrix.length / gridMultiplier + 1
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
		diagonal(canvas.background, { strokeStyle: 'rgba(255, 255, 255, 0.15)' }, x1, y1, x1 + blockWidth, y1 + blockHeight)
		diagonal(canvas.background, { strokeStyle: 'rgba(255, 255, 255, 0.15)' }, x1 + blockWidth, y1, x1, y1 + blockHeight)
	}
}

function diagonal(ctx, shape, x1, y1, x2, y2) {
	ctx.beginPath()
	ctx.moveTo(x1, y1)
	ctx.lineTo(x2, y2)
	ctx.lineWidth = 1;
	ctx.strokeStyle = shape.strokeStyle
	ctx.stroke()
}

/*
//build unwalkable blocks if needed
for (var i = 0; i < horizontal; i++) {
	for (var j = 0; j < vertical; j++) {
		if (matrix[j][i] == 1) rect(canvas.background, shapes.border, w / horizontal * i, h / vertical * j, w / horizontal, h / vertical)
		else if (matrix[j][i] > 1) {
			rect(canvas.background, shapes.element, w / horizontal * i, h / vertical * j, w / horizontal, h / vertical)
		}
	}
}
*/

var creatingElement = false
function createElement(event) {
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
			(creatingElement[0] == xBlock && creatingElement[1] == yBlock) ||
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
			
			/*
			grid.setWalkableAt(start[0], start[1], false)
			circle(canvas.buildings, shapes[types[type]], (start[0]) * blockWidth, start[1] * blockHeight, blockWidth, blockHeight)

			var element = {
				id: id,
				type: types[type],
				start: start,
				end: end,
				shapes: shapes[types[type]],
				path: finder.findPath(start[0], start[1], end[0], end[1], grid.clone()),
				recharge: (function () {
					setInterval(function() {
						var p = getElementIndex(id)
						elements[p].path = finder.findPath(start[0], start[1], end[0], end[1], grid.clone())
					}, recharge)
				})()
			}
			
			elements.push(element)
			*/
			
			creatingElement = false
			
			socket.emit('message', { action: 'building', data: building })
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
			
			/*
			grid.setWalkableAt(start[0], start[1], false)
			circle(canvas.buildings, shapes[types[type]], (building[0]) *  blockWidth, building[1] * blockHeight, blockWidth, blockHeight)
				
			var element = {
				id: id,
				type: types[type],
				start: start,
				end: end,
				shapes: shapes[types[type]],
				path: finder.findPath(start[0], start[1], end[0], end[1], grid.clone()),
				recharge: (function () {
					setInterval(function() {
						var p = getElementIndex(id)
						elements[p].path = finder.findPath(start[0], start[1], end[0], end[1], grid.clone())
					}, recharge)
				})()
			}
			
			elements.push(element)
			*/

			creatingElement = false
			
			socket.emit('message', { action: 'building', data: building })
		}
		else {
			creatingElement = false
		}
	}
}

/*
// create static paths for the elements before starting
for (var p = 0; p < elements.length; p++) {
	var element = elements[p]
	var path = finder.findPath(element.start[0], element.start[1], element.end[0], element.end[1], grid.clone())
	elements[p].path = path
}
*/

function animate() {
	requestAnimationFrame(animate)
	
	canvas.elements.clearRect(0, 0, w, h)
	
	if (walk) {
		walk = false
		
		/*
		
		for (var p = 0; p < elements.length; p++) {
			if (elements[p].path.length) {
				
				for (var r = 0; r < elements.length; r++) {
					if (r == p) continue //don't update the same object
					
					//console.log(elements[p].path[1][0], elements[r].path[1][0])

					if (
						elements[p].path &&
						elements[p].path[1] &&
						elements[p].path[1].length &&
						elements[p].path[1][0] &&
						elements[p].path[1][1] &&
						elements[r].path &&
						elements[r].path[1] &&
						elements[r].path[1].length &&
						elements[r].path[1][0] &&
						elements[r].path[1][1] &&
							(
								elements[p].path[0][0] == elements[r].path[0][0] ||
								elements[p].path[0][0] == elements[r].path[1][0] ||
								elements[p].path[1][0] == elements[r].path[0][0] ||
								elements[p].path[1][0] == elements[r].path[1][0]
							) 
						&&
							(
								elements[p].path[0][1] == elements[r].path[0][1] ||
								elements[p].path[0][1] == elements[r].path[1][1] ||
								elements[p].path[1][1] == elements[r].path[0][1] ||
								elements[p].path[1][1] == elements[r].path[1][1]
							)									
					) {
						if (!fight(elements[p].type, elements[r].type)) {
							elements[p].path = []
							continue
						}
						if (!fight(elements[r].type, elements[p].type)) {
							elements[r].path = []
							continue
						}
					}
				}
			}
		}					
		*/
		
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
	for (var p = 0; p < elements.length; p++) {
		var element = elements[p]
		
		if (
			element.path[1] &&
			element.path[1].length
		) {
			var x1 = element.path[0][0] * blockWidth
			var y1 = element.path[0][1] * blockHeight
			var x2 = element.path[1][0] * blockWidth
			var y2 = element.path[1][1] * blockHeight
			
			var dt = ((new Date).getTime() - time)
			var dx = x1 - (x1 - x2) * dt / step
			var dy = y1 - (y1 - y2) * dt / step
			
			circle(canvas.elements, element.shapes, dx, dy, blockWidth, blockHeight)	
		}
			
	}
}
requestAnimationFrame(animate)

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
				var element = {
					id: data.id,
					type: types[data.type],
					start: data.start,
					end: data.end,
					shapes: shapes[types[data.type]],
					path: finder.findPath(data.start[0], data.start[1], data.end[0], data.end[1], grid.clone()),
					recharge: (function () {
						setInterval(function() {
							var p = getElementIndex(data.id)
							elements[p].path = finder.findPath(data.start[0], data.start[1], data.end[0], data.end[1], grid.clone())
						}, recharge)
					})()
				}
				
				elements.push(element)
			}
			
			break
	}
})

function fight(a, b) {
	switch(a) {
	    case 'rock':
			if (b == 'paper') return false
	        break
	    case 'paper':
			if (b == 'scissors') return false
			break
	    case 'scissors':
			if (b == 'rock') return false

	}
	return true
}

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