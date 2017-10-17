import { line, donut } from './../draw'
import { convertRange } from './../helpers'

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
			!path[1].length
		) continue

		var x1 = path[0][0] * width
		var y1 = path[0][1] * height
		var x2 = path[1][0] * width
		var y2 = path[1][1] * height
		var dt = newTime - time
		var dx = x1 - (x1 - x2) * dt / tick
		var dy = y1 - (y1 - y2) * dt / tick

		var health = object.dynamics.health >= 0 ? object.dynamics.health : 0
		var percentage = convertRange(health, [0, object.dynamics.totalHealth], [0, 100])
		var size = path[1][2] | 0

		donut({
			ctx: canvas[layer],
			shape: object.shape,
			percentage: percentage,
			x1: dx,
			y1: dy,
			width: blockWidth,
			height: blockHeight,
			alpha: 1,
			size: object.level * size / 9
		})
		
		// trail
		if (dt % 8 === 0) {
			var lineWidth = (object.path[1][2] / 9) * (object.level * 9)
			
			line({
				ctx: canvas.trail,
				shape: object.shape,
				x1: x1 + (blockWidth / 2),
				y1: y1 + (blockHeight / 2),
				x2: x2 + (blockWidth / 2),
				y2: y2 + (blockHeight / 2),
				w: w,
				h: h,
				lineWidth: lineWidth,
				lineDash: [6, 4],
				alpha: 0.4
			})				
		}
	}
}