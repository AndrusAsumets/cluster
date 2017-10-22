import { line, donut, dot } from './../draw'
import { convertRange } from './../helpers'

// doing the minimal change right now to make it a bit better to read for myself
// maybe we can change the whole path object later, bends my mind to use 2dimensional arrays
function pathElement(pathElem) {
	return {
		x: pathElem[0],
		y: pathElem[1],
		size: pathElem[2]
	}
}

export function move(o) {
	var layer = o.layer
	var type = o.type
	var key = o.key
	var players = o.players
	var gm = o.gm
	var blockWidth = o.blockWidth
	var blockHeight = o.blockHeight
	var w = o.w
	var h = o.h
	var time = o.time
	var tick = o.tick
	var canvas = o.canvas
	
	var objects = players[key] && players[key][type] ? players[key][type] : []
	var width = blockWidth / gm
	var height = blockHeight / gm
	var newTime = (new Date).getTime()

	for (var p = 0; p < objects.length; p++) {
		var object = objects[p]
		var path = object.path

		if (
			!path ||
			!path[1] ||
			!path[1].length // when does this happen?
		) continue

		var startPos = pathElement(path[0])
		var endPos = pathElement(path[1])
		var sizeFactor = object.level / 9

		// calculate speeds for both axis
		var startX = startPos.x * width
		var startY = startPos.y * height
		var startS = startPos.size * sizeFactor
		var speedX = (endPos.x - startPos.x) * width / tick
		var speedY = (endPos.y - startPos.y) * height / tick
		var speedS = (endPos.size - startPos.size) / tick // we don't want object level right now for trails

		console.log('ss', startPos.s, startPos.x)
		
		// calculate position based on speed and time
		var dt = newTime - time
		var dx = startX + speedX * dt
		var dy = startY + speedY * dt 
		var ds = startS + speedS * dt

		var health = object.dynamics.health >= 0 ? object.dynamics.health : 0
		var percentage = convertRange(health, [0, object.dynamics.totalHealth], [0, 100])
		//var size = endPos.weight | 0

		donut({
			ctx: canvas[layer],
			shape: object.shape,
			percentage: percentage,
			x1: dx,
			y1: dy,
			width: blockWidth,
			height: blockHeight,
			alpha: 1,
			size: ds * sizeFactor 
		})
		
		// trail
		var weight = endPos.size
		if (true) {
			dot({
				ctx: canvas.trail,
				shape: object.shape,
				percentage: percentage,
				x1: dx,
				y1: dy,
				width: blockWidth,
				height: blockHeight,
				alpha: 0.1,
				size: ds * ds * ds / 9
			})
		}
	}
}