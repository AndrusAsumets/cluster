import { rectangle } from './../draw'
import { defaultShapes } from './../defaults'

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