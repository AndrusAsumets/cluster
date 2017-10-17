import { line } from './../draw'
import { defaultShapes } from './../defaults'

export function createBoard(o) {
	var canvas = o.canvas
	var w = o.w
	var h = o.h
	var smallHorizontal = o.smallHorizontal
	var smallVertical = o.smallVertical
	var blockWidth = o.blockWidth
	var blockHeight = o.blockHeight

	for (var i = 0; i < smallHorizontal + 2; i++) {
		line({
			ctx: canvas.background,
			shape: defaultShapes.light,
			x1: blockWidth * i,
			y1: 0,
			x2: blockWidth * i,
			y2: h,
			w: w,
			h: h,
			alpha: 0.075
		})
	}

	for (var i = 0; i < smallVertical + 2; i++) {
		line({
			ctx: canvas.background,
			shape: defaultShapes.light,
			x1: 0,
			y1: blockHeight * i,
			x2: w,
			y2: blockHeight * i,
			w: w,
			h: h,
			alpha: 0.075
		})
	}

	line({
		ctx: canvas.background,
		shape: defaultShapes.dark,
		x1: w / 2,
		y1: 0,
		x2: w / 2,
		y2: h,
		w: w,
		h: h,
		alpha: 0.75
	})
}