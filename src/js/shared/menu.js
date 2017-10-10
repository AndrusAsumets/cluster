import { SET_BUILDING } from './actions'
import { defaultShapes, defaultBuildings, defaultOptions } from './defaults'
import { line, rectangle, circle, dot, donut, image, label } from './draw'
import { dotGroup } from './draw/dot-group'

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

	var index = 0
	for (var key in o.buildings) {
		var building = o.buildings[key]
		var level = building.level
		var cost = building.cost
		var pattern = building.pattern
		
		// don't show buildings that have reached the maximum level
		if (key == 'upgrade' && level > 2) continue
		
		if (pattern) {
			var size = 3.5				
			var marginX = o.height / size
			var marginY = o.height / size
			var width = o.height / size / 3
			var height = o.width / size / 3
			var maxWidth = o.height - marginX * 2
			var maxHeight = o.height - marginY * 2
			var blockWidth = o.blockWidth
			var blockHeight = o.blockHeight
			var gm = o.gm
				
			var count = 3
			for (var i = 0; i < pattern.length; i++) {
				var centeredVertically = (i + 2) % count
				
				if (centeredVertically === 0) {
					var column = pattern[i]
					var sizes = []
					
					if (extra == 0) {
						for (var j = 0; j < pattern.length; j++) {
							var centeredHorizontally = (j + 2) % count
							
							if (centeredHorizontally === 0) {
								var block = column[j] / count
								sizes.push(block)
							}
						}
					}
					else {
						for (var j = pattern.length - 1; j > 0; j--) {
							var centeredHorizontally = (j + 2) % count
							
							if (centeredHorizontally === 0) {
								var block = column[j] / count
								sizes.push(block)
							}
						}					
					}
					
					dotGroup({
						count: count,
						ctx: o.canvas.menu,
						shape: defaultShapes.light,
						width: width,
						x1: extra + width + o.height * index,
						y1: (o.blockHeight / 17) * i + (o.blockHeight / 24),
						maxWidth: maxWidth,
						maxHeight: maxHeight,
						sizes: sizes,
						alpha: 0.75
					})
				}
			}
		}
		
		else {
			// generic icon
			image({
				ctx: o.canvas.menu,
				type: key,
				file: defaultShapes[key].file,
				x1: extra + index * o.height,
				y1: 0,
				width: o.height,
				height: o.height,
				size: 3.5
			})
		}
		
		// cost label
		if (
			(cost && level < 3)
			||
			key == 'sell'
		) {
			label({
				ctx: o.canvas.menu,
				string: Math.floor(cost),
				shape: defaultShapes.light,
				x1: extra + index * o.height,
				y1: o.height / 6.2,
				height: o.height,
				vertical: o.vertical,
				size: 10,
				center: true
			})
		}
		
		// name label
		label({
			ctx: o.canvas.menu,
			string: key.toUpperCase(),
			shape: defaultShapes.light,
			x1: extra + index * o.height,
			y1: o.blockHeight,
			height: o.height,
			vertical: o.vertical,
			size: 10,
			center: true
		})

		// a tiny vertical separator
		line({
			ctx: o.canvas.menu,
			shape: defaultShapes.light,
			x1: extra + o.height + o.height * index,
			y1: 4,
			x2: extra + o.height + o.height * index,
			y2: o.height,
			alpha: 0.075
		})

		index++
	}
}

export function selectFromPopup(o) {
	var level = o.buildings[o.type].level
	var health = o.buildings[o.type].initialHealth
	var start = [o.gameMenu.xBlock * o.gm, o.gameMenu.yBlock * o.gm]
	var end = o.side == 'left' ? [o.horizontal, o.gameMenu.yBlock * o.gm] : [0, o.gameMenu.yBlock * o.gm]

	var building = {
		playerId: o.player.id,
		level: level,
		health: health,
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
