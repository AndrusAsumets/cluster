import { dot } from './../draw'

export function dotGroup(o) {
	var count = o.count
	var ctx = o.ctx
	var shape = o.shape
	var width = o.width
	var maxWidth = o.maxWidth
	var maxHeight = o.maxHeight
	var x1 = o.x1
	var y1 = o.y1
	var sizes = o.sizes
	var alpha = o.alpha
	
	for (var i = 0; i < count; i++) {
		var spacing = i * (width * 2)
		
		dot({
			ctx: ctx,
			shape: shape,
			x1: x1 + spacing,
			y1: y1,
			width: maxWidth,
			height: maxHeight,
			size: sizes[i],
			alpha: alpha
		})
	}
}