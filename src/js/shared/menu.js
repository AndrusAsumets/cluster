import { SET_BUILDING } from './actions'
import { defaultShapes, defaultBuildings, defaultOptions } from './defaults'
import { line, rectangle, circle, dot, donut, image, label } from './draw'

export function buildPopup(o) {
	var extra = o.side == 'left' ? 0 : o.width / 2
	var reverseExtra = o.side == 'right' ? 0 : o.width / 2
	
	//highlight the selected building block
	rectangle({
		ctx: o.canvas.selection,
		shape: defaultShapes.light,
		x1: o.xBlock * o.blockWidth,
		y1: o.yBlock * o.blockHeight,
		width: o.blockWidth,
		height: o.blockHeight,
		alpha: 0.1
	})

	// background bar that takes the half of the width
	rectangle({
		ctx: o.canvas.menu,
		shape: defaultShapes.background,
		x1: reverseExtra,
		y1: 0,
		width: o.width / 2,
		height: o.height
	})

	rectangle({
		ctx: o.canvas.menu,
		shape: defaultShapes.dark,
		x1: extra,
		y1: 0,
		width: o.width / 2,
		height: o.height
	})

	// a small horizontal separator for the top
	rectangle({
		ctx: o.canvas.menu,
		shape: defaultShapes.light,
		x1: 0,
		y1: 0,
		width: o.width,
		height: 4,
		alpha: 0.5
	})
	
	// a tiny separator for the beginning
	line({
		ctx: o.canvas.menu,
		shape: defaultShapes.light,
		x1: extra,
		y1: 4,
		x2: extra,
		y2: o.height,
		alpha: 0.075
	})
	
	// a tiny separator for the end
	line({
		ctx: o.canvas.menu,
		shape: defaultShapes.light,
		x1: o.width / 2 + extra,
		y1: 4,
		x2: o.width / 2 + extra,
		y2: o.height,
		alpha: 0.075
	})

	var i = 0
	for (var key in o.buildings) {
		var building = o.buildings[key]
		var level = building.level
		var cost = building.cost
		
		// don't show buildings that have reached the maximum level
		if (key == 'upgrade' && level > 2) return
		
		// generic icon
		image({
			ctx: o.canvas.menu,
			type: key,
			file: defaultShapes[key].file,
			x1: extra + i * o.height,
			y1: 0,
			width: o.height,
			height: o.height,
			size: 3.5
		})
		
		// cost label
		if (cost) {
			label({
				ctx: o.canvas.menu,
				string: Math.floor(cost),
				shape: defaultShapes.light,
				x1: extra + i * o.height,
				baseHeight: o.height,
				vertical: o.vertical,
				height: o.height / 6.25,
				size: 10,
				center: true
			})		
		}
		
		/*
		if (upgrade) {
			label({
				ctx: o.canvas.menu,
				string: upgrade,
				shape: defaultShapes.light,
				x1: extra + i * o.height,
				baseHeight: o.height,
				vertical: o.vertical,
				height: o.height / 6.5,
				size: 10,
				center: true
			})

			var level = object.level
			var marginX = blockWidth / size
			var marginY = blockHeight / size
			var width = blockWidth / size / 3
			var maxWidth = blockWidth - marginX * 2
			var maxHeight = blockHeight - marginY * 2
				
			dotGroup({
				count: object.level,
				ctx: canvas[layer],
				shape: defaultShapes.light,
				width: width,
				x1: object.start[0] * blockWidth / gm + width,
				y1: (object.start[1] + 2) * blockHeight / gm - (blockHeight / 24),
				maxWidth: maxWidth,
				maxHeight: maxHeight,
				size: 1,
				alpha: 0.75
			})
		}
		*/
		
		// name label
		label({
			ctx: o.canvas.menu,
			string: key.toUpperCase(),
			shape: defaultShapes.light,
			x1: extra + i * o.height,
			baseHeight: o.height,
			vertical: o.vertical,
			height: o.blockHeight,
			size: 10,
			center: true
		})

		// a tiny vertical separator
		line({
			ctx: o.canvas.menu,
			shape: defaultShapes.light,
			x1: extra + o.height + o.height * i,
			y1: 4,
			x2: extra + o.height + o.height * i,
			y2: o.height,
			alpha: 0.075
		})

		i++
	}
}

export function selectFromPopup(o) {
	var level = o.buildings[o.type].level
	var start = [o.gameMenu.xBlock * o.gm, o.gameMenu.yBlock * o.gm]
	var end = o.side == 'left' ? [o.horizontal, o.gameMenu.yBlock * o.gm] : [0, o.gameMenu.yBlock * o.gm]

	var building = {
		playerId: o.player.id,
		level: level,
		type: o.type,
		start: start,
		end: end,
		charge: 0,
		dynamics: {}
	}
	
	var data = Object.assign({}, o.buildings[o.type], building)
	data.buildings = o.buildings

	var message = {
		action: SET_BUILDING,
		data: data,
		playerId: o.me
	}

	o.socket.emit('message', message)
}

function showPatterns(o) {

}
