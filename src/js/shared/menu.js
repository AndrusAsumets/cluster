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
	for (var building in o.buildings) {
		image({
			ctx: o.canvas.menu,
			type: building,
			file: defaultShapes[building].file,
			x1: extra + i * o.height,
			y1: 0,
			width: o.height,
			height: o.height,
			size: 3.5
		})
		
		//label
		label({
			ctx: o.canvas.menu,
			string: building.toUpperCase(),
			shape: defaultShapes.light,
			x1: extra + i * o.height,
			baseHeight: o.height,
			vertical: o.vertical,
			height: o.blockHeight,
			size: 9,
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
