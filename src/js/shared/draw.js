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

export function canvas(container, className, w, h, z, top) {
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
	o.ctx.rect(o.x1, o.y1, o.x2, o.y2)
	o.ctx.fillStyle = o.shape.fillStyle(alpha)
	o.ctx.fill()	
	o.ctx.closePath()
}

export function circle(o) {
	var centerX = o.x1 + (o.x2 / 2)
	var centerY = o.y1 + (o.y2 / 2)
	var radius = Math.sqrt(o.x2 + o.y2)
	var degrees = o.percentage ? o.percentage * 3.6 : 360
	var alpha = o.alpha ? o.alpha : 1
	
	o.ctx.beginPath()
	o.ctx.moveTo(centerX, centerY)
	o.ctx.arc(centerX, centerY, radius / 2, 0, degreesToRadians(-degrees), false)
	o.ctx.fillStyle = o.shape.fillStyle(alpha)
	o.ctx.fill()
	o.ctx.closePath()
}

export function donut(o) {
	var centerX = o.x1 + (o.x2 / 2)
	var centerY = o.y1 + (o.y2 / 2)
	var radius = Math.sqrt(o.x2 + o.y2)
	var degrees = o.percentage ? o.percentage * 3.6 : 360
	var alpha = o.alpha ? o.alpha : 1

	o.ctx.beginPath()
	o.ctx.moveTo(centerX, centerY)
	o.ctx.arc(centerX, centerY, radius * 1.25, 0, 2 * Math.PI, false)
	o.ctx.arc(centerX, centerY, radius * 1.1, 0, 2 * Math.PI, true)
	o.ctx.arc(centerX, centerY, radius / 1.1, 0, degreesToRadians(-degrees), true)
	o.ctx.fillStyle = o.shape.fillStyle(alpha)
	o.ctx.fill()
	o.ctx.closePath()
}

export function image(o) {
	var img = new Image()
	img.onload = function() {
		o.ctx.drawImage(img, o.x1, o.y1, o.width, o.height)
	}
	img.src = 'public/images/' + o.file
}

function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180
}