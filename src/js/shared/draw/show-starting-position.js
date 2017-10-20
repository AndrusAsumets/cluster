import { defaultShapes } from './../defaults'
import { rectangle } from './../draw'

export function showStartingPosition(o) {
	var canvas = o.canvas
	var w = o.w
	var h = o.h
	var players = o.players
	var me = o.me
	var smallHorizontal = o.smallHorizontal
	var smallVertical = o.smallVertical
	var blockWidth = o.blockWidth
	var blockHeight = o.blockHeight
	
	canvas.start.clearRect(0, 0, w, h)

	if (players[me] && !players[me].buildings.length) {
		var position = me == 'player1'
			? [Math.floor(smallHorizontal / 4), Math.floor(smallVertical / 2)]
			: [Math.floor(smallHorizontal * 3 / 4), Math.floor(smallVertical / 2)]

		rectangle({
			ctx: canvas.start,
			shape: defaultShapes.light,
			x1: position[0] * blockWidth,
			y1: position[1] * blockHeight,
			width: blockWidth,
			height: blockHeight,
			alpha: 0.15
		})
	}
}