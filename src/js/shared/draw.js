import { isCached } from './helpers'
import { defaultShapes } from './defaults'
import { upgradeCost, sellValue } from './dynamics'

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


export function ctx(container, className, w, h, retina) {
	var ratio = retina ? PIXEL_RATIO : 1
	var canvas = document.createElement('canvas')
	var c = canvas.getContext('2d')
	canvas.className = className
	canvas.width = w * ratio
	canvas.height = h * ratio
	canvas.style.width = w + 'px'
	canvas.style.height = h + 'px'
	c.setTransform(ratio, 0, 0, ratio, 0, 0)
	container.appendChild(canvas)
	return c
}

export function chessboard(o) {
	var canvas = o.canvas
	var shape1 = o.shape1
	var shape2 = o.shape2
	var smallHorizontal = o.smallHorizontal
	var smallVertical = o.smallVertical
	var blockWidth = o.blockWidth
	var blockHeight = o.blockHeight
	var alpha = o.alpha ? o.alpha : 1

	for (var i = 0; i < smallHorizontal + 1; i++) {
		if (i % 2) {
			for (var j = 0; j < smallVertical; j++) {
				if (j % 2) {
					rectangle({
						ctx: canvas,
						shape: shape1,
						x1: blockWidth * i,
						y1: blockHeight * j,
						width: blockWidth,
						height: blockHeight,
						alpha: alpha
					})
				}

				else {
					rectangle({
						ctx: canvas,
						shape: shape1,
						x1: blockWidth * (i - 1),
						y1: blockHeight * j,
						width: blockWidth,
						height: blockHeight,
						alpha: alpha
					})
				}
			}
		}
	}

	for (var i = 0; i < smallHorizontal + 1; i++) {
		if (i % 2 === 0) {
			for (var j = 0; j < smallVertical; j++) {
				if (j % 2 !== 0) {
					rectangle({
						ctx: canvas,
						shape: shape2,
						x1: blockWidth * i,
						y1: blockHeight * j,
						width: blockWidth,
						height: blockHeight,
						alpha: alpha
					})
				}

				else {
					rectangle({
						ctx: canvas,
						shape: shape2,
						x1: blockWidth * (i - 1),
						y1: blockHeight * j,
						width: blockWidth,
						height: blockHeight,
						alpha: alpha
					})
				}
			}
		}
	}
}

var lines = []
export function line(o) {
	var x1 = o.x1
	var y1 = o.y1
	var x2 = o.x2
	var y2 = o.y2
	var alpha = o.alpha ? o.alpha : 1
	var strokeStyle = o.shape.strokeStyle(alpha)
	var lineDash = o.lineDash && o.lineDash.length ? o.lineDash : []
	var lineWidth = o.lineWidth ? o.lineWidth : 1

	var cacheIndex = isCached(lines, { type: 'line', x1: x1, y1: y1, x2: x2, y2: y2, lineWidth: lineWidth, strokeStyle: strokeStyle, alpha: alpha })
	
	if (Number.isInteger(cacheIndex)) return o.ctx.drawImage(lines[cacheIndex].canvas, 0, 0, o.w, o.h)

	var container = document.createElement('div')
	var c = ctx(container, '', o.w, o.h, false)

	c.setLineDash(lineDash)
	c.beginPath()
	c.moveTo(o.x1, o.y1)
	c.lineTo(o.x2, o.y2)
	c.lineWidth = lineWidth
	c.strokeStyle = strokeStyle
	c.stroke()
	c.closePath()
	
	o.ctx.drawImage(c.canvas, 0, 0, o.w, o.h)
	
	lines.push({
		type: 'line',
		x1: x1,
		y1: y1,
		x2: x2,
		y2: y2,
		canvas: c.canvas,
		lineWidth: lineWidth,
		strokeStyle: strokeStyle,
		alpha: alpha,
	})
}

/*
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
*/

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
	var size = o.size / 3 / 0.66
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
	var alpha = o.alpha ? o.alpha : 1
	
	var cacheIndex = isCached(images, { type: o.type })
	if (Number.isInteger(cacheIndex)) {
	    o.ctx.save()
	    o.ctx.globalAlpha = alpha
		o.ctx.drawImage(
			images[cacheIndex].image,
			o.x1 + o.width / o.size,
			o.y1 + o.height / o.size,
			o.width - o.width / (o.size / 2),
			o.height - o.height / (o.size / 2)
		)
		o.ctx.restore()
		return o.ctx
	}

	var image = new Image()
	image.onload = function() {
	    o.ctx.save()
	    o.ctx.globalAlpha = alpha
		o.ctx.drawImage(
			image,
			o.x1 + o.width / o.size,
			o.y1 + o.height / o.size,
			o.width - o.width / (o.size / 2),
			o.height - o.height / (o.size / 2)
		)
		o.ctx.restore()

		images.push({
			type: o.type,
			image: image
		})
	}
	image.src = o.file
}

export function label(o) {
	var canvas = o.ctx
	var string = o.string
	var vertical = o.vertical | 0
	var height = o.height * vertical | 0
	var size = o.size | 16
	var x1 = o.x1
	var y1 = o.y1
	var alpha = o.alpha | 1
	var fillStyle = o.shape.fillStyle(alpha)
	var fontSize = getFontSize({ canvas: canvas.canvas, size: size, base: height })
	var font = o.size + 'px sans-serif'
	var center = o.center | false
	var extra = 0

	canvas.fillStyle = fillStyle
	canvas.strokeStyle = fillStyle
	canvas.font = font

	var stringWidth = canvas.measureText(string).width
	var stringHeight = canvas.measureText('M').width
	var blockWidth = height / vertical | 0
	var extra = center ? (blockWidth - stringWidth) / 2 : 0

	canvas.fillText(string, x1 + extra, y1 + stringHeight / 2)
}

function getFontSize(o) {
    var ratio = o.size / o.base
    var size = o.canvas.width / ratio
    return size
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
