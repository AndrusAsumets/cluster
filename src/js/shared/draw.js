import { isCached } from './helpers'
import { defaultShapes } from './defaults'

var PIXEL_RATIO = (function () {
	try {
	    var ctx = document.createElement('canvas').getContext('2d'),
	        dpr = window.devicePixelRatio || 1,
	        bsr = ctx.webkitBackingStorePixelRatio ||
				ctx.mozBackingStorePixelRatio ||
				ctx.msBackingStorePixelRatio ||
				ctx.oBackingStorePixelRatio ||
				ctx.backingStorePixelRatio || 1

	    return dpr / bsr
	} catch(err) {}
})()

export function createMatrix(vertical, horizontal) {
	var matrix = []
	for (var i = 0; i < vertical - 1; i++) {
		matrix.push([])

		for (var j = 0; j < horizontal - 1; j++) {
			matrix[i].push(0)
		}
	}
	return matrix
}

export function ctx(container, className, w, h, z) {
	var ratio = PIXEL_RATIO
	var canvas = document.createElement('canvas')
	canvas.className = className
	canvas.width = w * ratio
	canvas.height = h * ratio
	canvas.style.width = w + 'px'
	canvas.style.height = h + 'px'
	canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0)
	canvas.style.zIndex = z
	container.appendChild(canvas)
	return canvas.getContext('2d')
}

export function line(o) {
	var alpha = o.alpha ? o.alpha : 1

	o.ctx.setLineDash(o.lineDash ? o.lineDash: [])
	o.ctx.beginPath()
	o.ctx.moveTo(o.x1, o.y1)
	o.ctx.lineTo(o.x2, o.y2)
	o.ctx.lineWidth = o.lineWidth ? o.lineWidth : 1;
	o.ctx.strokeStyle = o.shape.strokeStyle(alpha)
	o.ctx.stroke()
	o.ctx.closePath()
}

export function rectangle(o) {
	var alpha = o.alpha ? o.alpha : 1

	o.ctx.beginPath()
	o.ctx.rect(o.x1, o.y1, o.width, o.height)
	o.ctx.fillStyle = o.shape.fillStyle(alpha)
	o.ctx.fill()
	o.ctx.closePath()
}

var dots = []
export function dot(o) {
	var x = o.width / 2
	var y = o.height / 2
	var degrees = o.percentage ? o.percentage * 3.6 : 360
	var radians = degreesToRadians(-degrees)
	var alpha = o.alpha ? o.alpha : 1
	var fillStyle = o.shape.fillStyle(alpha)
	var size = o.size ? o.size / 3 / 0.66 : 1 / 0.66
	var radius = Math.sqrt((o.width + o.height) * size)

	var cacheIndex = isCached(dots, { type: 'dot', radians: radians, radius: radius, alpha: alpha, fillStyle: fillStyle })
	if (Number.isInteger(cacheIndex)) return o.ctx.drawImage(dots[cacheIndex].canvas, o.x1, o.y1, dots[cacheIndex].width, dots[cacheIndex].height)

	var container = document.createElement('div')
	var c = ctx(container, '', o.width, o.height)

	c.beginPath()
	c.moveTo(x, y)
	c.arc(x, y, radius / 2, 0, radians, false)
	c.fillStyle = fillStyle
	c.fill()
	c.closePath()

	dots.push({
		type: 'dot',
		canvas: c.canvas,
		width: o.width,
		height: o.height,
		radians: radians,
		radius: radius,
		alpha: alpha,
		fillStyle: fillStyle
	})

	o.ctx.drawImage(c.canvas, o.x1, o.y1, o.width, o.height)
}

var donuts = []
export function donut(o) {
	var x = o.width / 2
	var y = o.height / 2
	var degrees = o.percentage ? o.percentage * 3.6 : 360
	var radians = degreesToRadians(-degrees)
	var alpha = o.alpha ? o.alpha : 1
	var fillStyle = o.shape.fillStyle(alpha)
	var size = o.size ? o.size / 3 / 0.66 : 1 / 0.66
	var radius = Math.sqrt((o.width + o.height) * size)

	var cacheIndex = isCached(donuts, { type: 'donut', radians: radians, radius: radius, alpha: alpha, fillStyle: fillStyle })
	if (Number.isInteger(cacheIndex)) return o.ctx.drawImage(donuts[cacheIndex].canvas, o.x1, o.y1, donuts[cacheIndex].width, donuts[cacheIndex].height)

	var container = document.createElement('div')
	var c = ctx(container, '', o.width, o.height)

	c.beginPath()
	c.moveTo(x, y)
	c.arc(x, y, radius * 1.25, 0, 2 * Math.PI, false)
	c.arc(x, y, radius * 1.1, 0, 2 * Math.PI, true)
	c.arc(x, y, radius / 1.1, 0, radians, true)
	c.fillStyle = fillStyle
	c.fill()
	c.closePath()

	donuts.push({
		type: 'donut',
		canvas: c.canvas,
		width: o.width,
		height: o.height,
		radians: radians,
		radius: radius,
		alpha: alpha,
		fillStyle: fillStyle
	})

	o.ctx.drawImage(c.canvas, o.x1, o.y1, o.width, o.height)
}

export function circle(o) {
	var centerX = o.x1 + (o.x2 / 2)
	var centerY = o.y1 + (o.y2 / 2)
	var radius = Math.sqrt(o.x2 + o.y2)
	var degrees = o.percentage ? o.percentage * 3.6 : 360
	var alpha = o.alpha ? o.alpha : 1

	o.ctx.beginPath()
	o.ctx.moveTo(centerX, centerY)
	o.ctx.arc(centerX, centerY, radius * 1.25, 0, degreesToRadians(-degrees), true)
	o.ctx.fillStyle = o.shape.fillStyle(alpha)
	o.ctx.fill()
	o.ctx.closePath()

	o.ctx.save()
	o.ctx.globalCompositeOperation = 'destination-out'
	o.ctx.beginPath()
	o.ctx.moveTo(centerX, centerY)
	o.ctx.arc(centerX, centerY, radius * 1.1, 0, 2 * Math.PI, false)
	o.ctx.clip()
	o.ctx.fill()
	o.ctx.closePath()
	o.ctx.restore()

	o.ctx.beginPath()
	o.ctx.moveTo(centerX, centerY)
	o.ctx.arc(centerX, centerY, radius * 0.9, 0, 2 * Math.PI, true)
	o.ctx.fillStyle = o.shape.fillStyle(alpha)
	o.ctx.fill()
	o.ctx.closePath()
}

var images = []
export function image(o) {
	var cacheIndex = isCached(images, { type: o.type })
	if (Number.isInteger(cacheIndex)) return o.ctx.drawImage(
		images[cacheIndex].image,
		o.x1 + o.width / o.size,
		o.y1 + o.height / o.size,
		o.width - o.width / (o.size / 2),
		o.height - o.height / (o.size / 2)
	)

	var image = new Image()
	image.onload = function() {
		o.ctx.drawImage(
			image,
			o.x1 + o.width / o.size,
			o.y1 + o.height / o.size,
			o.width - o.width / (o.size / 2),
			o.height - o.height / (o.size / 2)
		)

		images.push({
			type: o.type,
			image: image
		})
	}
	image.src = o.file
}

function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180
}

export function drawBoundaries(o) {
	var canvas = o.canvas
	var boundaries = o.boundaries
	var width = o.width
	var height = o.height
	var blockWidth = o.blockWidth
	var blockHeight = o.blockHeight
	var gm = o.gm
	var extra = o.side == 'left' ? 0 : width / 2
	
	canvas.clearRect(extra, 0, width / 2, height)
	
	for (var i = 0; i < boundaries.length; i++) {
		var x = boundaries[i].x / gm
		var y = boundaries[i].y / gm
		
		rectangle({
			ctx: canvas,
			shape: defaultShapes.light,
			x1: x * blockWidth,
			y1: y * blockHeight,
			width: blockWidth,
			height: blockHeight,
			alpha: 0.05
		})
	}
}
