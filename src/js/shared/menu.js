import { SET_BUILDING } from './actions'
import { defaultShapes, defaultBuildings, defaultOptions } from './defaults'
import { line, rectangle, circle, dot, donut, image } from './draw'

export function buildGenericPopup(o) {
	if (o.position == 'left') {
		var i = 0

		for (var building in defaultBuildings) {
			rectangle({
				ctx: o.canvas.menu,
				shape: defaultShapes.light,
				x1: (o.xBlock + i) * o.blockWidth,
				y1: o.yBlock * o.blockHeight,
				width: o.blockWidth,
				height: o.blockHeight,
				alpha: 0.1
			})

			image({
				ctx: o.canvas.menu,
				type: building,
				file: defaultShapes[building].file,
				x1: (o.xBlock + i) * o.blockWidth,
				y1: o.yBlock * o.blockHeight,
				width: o.blockWidth,
				height: o.blockHeight,
				size: 3.5
			})

			i++
		}
	}
	else {
		var reversedDefaultBuildings = JSON.parse(JSON.stringify(Object.keys(defaultBuildings))).reverse()
		var i = 0
		for (var building in defaultBuildings) {
			rectangle({
				ctx: o.canvas.menu,
				shape: defaultShapes.light,
				x1: (o.xBlock + i - reversedDefaultBuildings.length + 1) * o.blockWidth,
				y1: o.yBlock * o.blockHeight,
				width: o.blockWidth,
				height: o.blockHeight,
				alpha: 0.1
			})

			image({
				ctx: o.canvas.menu,
				type: building,
				file: defaultShapes[building].file,
				x1: (o.xBlock + i - reversedDefaultBuildings.length + 1) * o.blockWidth,
				y1: o.yBlock * o.blockHeight,
				width: o.blockWidth,
				height: o.blockHeight,
				size: 3.5
			})

			i++
		}
	}
}

export function selectFromGenericPopup(o) {
	var index, type, id, level, start, end
	if (o.gameMenu.direction == 'toRight') {
		index = o.xBlock - o.gameMenu.x
		type = Object.keys(defaultBuildings)[index]
		id = o.player.elements.length
		level = defaultBuildings[type].level
		start = [o.gameMenu.x * o.gm, o.gameMenu.y * o.gm]
		end = [o.horizontal, o.gameMenu.y * o.gm]
	}
	else {
		index = o.xBlock - o.gameMenu.x + Object.keys(defaultBuildings).length - 1
		type = Object.keys(defaultBuildings)[index]
		id = o.player.elements.length
		level = defaultBuildings[type].level
		start = [o.gameMenu.x * o.gm, o.gameMenu.y * o.gm]
		end = [0, o.gameMenu.y * o.gm]
	}
	
	console.log(level)

	var building = {
		playerId: o.player.id,
		id: id,
		level: level,
		type: type,
		start: start,
		end: end,
		charge: 0,
		dynamics: {}
	}

	var message = {
		action: SET_BUILDING,
		data: Object.assign({}, defaultBuildings[type], building),
		playerId: o.me
	}
	
	//if (defaultBuildings[type].offensive) showPatterns({ socket: socket, message: message, building: building })
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
		var index = o.xBlock - o.gameMenu.x
		var key = Object.keys(defaultOptions)[index]
		if (!key) return
		action = defaultOptions[key].action
	}
	else {
		var reversedOptions = JSON.parse(JSON.stringify(Object.keys(defaultOptions))).reverse()
		var index = o.xBlock - o.gameMenu.x + Object.keys(defaultOptions).length - 1
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