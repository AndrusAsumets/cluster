import { SET_BUILDING } from './actions'
import { defaultShapes, defaultBuildings, defaultOptions } from './defaults'
import { line, rectangle, circle, dot, donut, image } from './draw'

export function buildGenericPopup(o) {
	var extra = o.position == 'left' ? 0 : o.width / 2
	var reverseExtra = o.position == 'right' ? 0 : o.width / 2

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

export function selectFromGenericPopup(o) {
	var level = defaultBuildings[o.type].level
	var start = [o.gameMenu.xBlock * o.gm, o.gameMenu.yBlock * o.gm]
	var end = o.position == 'left' ? [o.horizontal, o.gameMenu.yBlock * o.gm] : [0, o.gameMenu.yBlock * o.gm]

	var building = {
		playerId: o.player.id,
		level: level,
		type: o.type,
		start: start,
		end: end,
		charge: 0,
		dynamics: {}
	}

	var message = {
		action: SET_BUILDING,
		data: Object.assign({}, defaultBuildings[o.type], building),
		playerId: o.me
	}

	o.socket.emit('message', message)
}

export function buildOptionsPopup(o) {
	var options = Object.keys(defaultOptions)

	// make the building visually active
	rectangle({
		ctx: o.canvas.menu,
		shape: defaultShapes.light,
		x1: o.xBlock * o.blockWidth,
		y1: o.yBlock * o.blockHeight,
		width: o.blockWidth,
		height: o.blockHeight,
		alpha: 0.1
	})

	image({
		ctx: o.canvas.menu,
		type: o.building.type,
		file: defaultShapes[o.gameMenu.fromBuilding.type].file,
		x1: o.xBlock * o.blockWidth,
		y1: o.yBlock * o.blockHeight,
		width: o.blockWidth,
		height: o.blockHeight,
		size: 3.5
	})

	if (o.position == 'left') {
		var i = 0

		options.map(function(option) {
			rectangle({
				ctx: o.canvas.menu,
				shape: defaultShapes.background,
				x1: (o.xBlock + i) * o.blockWidth,
				y1: o.yBlock * o.blockHeight - o.blockHeight,
				width: o.blockWidth,
				height: o.blockHeight,
				alpha: 1
			})

			rectangle({
				ctx: o.canvas.menu,
				shape: defaultShapes.light,
				x1: (o.xBlock + i) * o.blockWidth,
				y1: o.yBlock * o.blockHeight - o.blockHeight,
				width: o.blockWidth,
				height: o.blockHeight,
				alpha: 0.25
			})

			image({
				ctx: o.canvas.menu,
				type: option,
				file: defaultShapes[option].file,
				x1: (o.xBlock + i) * o.blockWidth,
				y1: o.yBlock * o.blockHeight - o.blockHeight,
				width: o.blockWidth,
				height: o.blockHeight,
				size: 4
			})

			i++
		})
	}

	else if (o.position == 'right') {
		var i = 0

		var reversedOptions = JSON.parse(JSON.stringify(Object.keys(defaultOptions))).reverse()

		reversedOptions.map(function(option) {
			rectangle({
				ctx: o.canvas.menu,
				shape: defaultShapes.background,
				x1: (o.xBlock + i - reversedOptions.length + 1) * o.blockWidth,
				y1: o.yBlock * o.blockHeight - o.blockHeight,
				width: o.blockWidth,
				height: o.blockHeight,
				alpha: 1
			})

			rectangle({
				ctx: o.canvas.menu,
				shape: defaultShapes.light,
				x1: (o.xBlock + i - reversedOptions.length + 1) * o.blockWidth,
				y1: o.yBlock * o.blockHeight - o.blockHeight,
				width: o.blockWidth,
				height: o.blockHeight,
				alpha: 0.25
			})

			image({
				ctx: o.canvas.menu,
				type: option,
				file: defaultShapes[option].file,
				x1: (o.xBlock + i - reversedOptions.length + 1) * o.blockWidth,
				y1: o.yBlock * o.blockHeight - o.blockHeight,
				width: o.blockWidth,
				height: o.blockHeight,
				size: 4
			})

			i++
		})
	}
}

export function selectFromOptionsPopup(o) {
	var action
	if (o.gameMenu.direction == 'toRight') {
		var index = o.xBlock - o.gameMenu.xBlock
		var key = Object.keys(defaultOptions)[index]
		if (!key) return
		action = defaultOptions[key].action
	}
	else {
		var reversedOptions = JSON.parse(JSON.stringify(Object.keys(defaultOptions))).reverse()
		var index = o.xBlock - o.gameMenu.xBlock + Object.keys(defaultOptions).length - 1
		var key = reversedOptions[index]
		if (!key) return
		action = defaultOptions[key].action
	}

	var message = {
		action: action,
		data: { playerId: o.me, buildingIndex: o.buildingIndex }
	}

	o.socket.emit('message', message)
}

function showPatterns(o) {

}
