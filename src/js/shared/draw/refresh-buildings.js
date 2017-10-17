import { getSide, isOnResource, getSideColor } from './../util'
import { defaultShapes, defaultResourceMultiplier } from './../defaults'
import { dotGroup } from './dot-group'
import { image, line, rectangle, label } from './../draw'
import { convertRange } from './../helpers'

export function refreshBuildings(o) {
	var players = o.players
	var resources = o.resources
	var canvas = o.canvas
	var blockWidth = o.blockWidth
	var blockHeight = o.blockHeight
	var w = o.w
	var h = o.h
	var gm = o.gm
	
	canvas.buildings.clearRect(0, 0, w, h)

	displayResources({
		resources: resources.left,
		canvas: canvas,
		blockWidth: blockWidth,
		blockHeight: blockHeight
	})
	
	displayResources({
		resources: resources.right,
		canvas: canvas,
		blockWidth: blockWidth,
		blockHeight: blockHeight
	})
	
	for (var p in players) displayBuildings({
		layer: 'buildings',
		type: 'buildings', 
		key: p,
		players: players,
		blockWidth: blockWidth,
		blockHeight: blockHeight,
		w: w,
		h: h,
		gm: gm,
		canvas: canvas,
		resources: resources
	})
}

function displayResources(o) {
	var resources = o.resources
	var canvas = o.canvas
	var blockWidth = o.blockWidth
	var blockHeight = o.blockHeight

	for (var i = 0; i < resources.length; i++) {
		var x1 = resources[i].x
		var y1 = resources[i].y

		image({
			ctx: canvas.buildings,
			type: 'resource',
			file: defaultShapes.resource.file,
			x1: x1 * blockWidth,
			y1: y1 * blockHeight,
			width: blockWidth,
			height: blockHeight,
			size: 14,
			alpha: 0.4
		})
	}
}

function displayBuildings(o) {
	var layer = o.layer
	var type = o.type
	var key = o.key
	var players = o.players
	var blockWidth = o.blockWidth
	var blockHeight = o.blockHeight
	var w = o.w
	var h = o.h
	var gm = o.gm
	var canvas = o.canvas
	var resources = o.resources
	
	var objects = players[key][type] ? players[key][type] : []

	for (var p = 0; p < objects.length; p++) {
		var side = getSide(key)
		var object = objects[p]
		var pattern = object.pattern
		var size = 3.5
		var level = object.level
		var marginX = blockWidth / size
		var marginY = blockHeight / size
		var width = blockWidth / size / 3
		var height = blockHeight / size / 3
		var maxWidth = blockWidth - marginX * 2
		var maxHeight = blockHeight - marginY * 2
		var onResource = isOnResource(resources[side], object.start[0] / gm, object.start[1] / gm)
		var initialHealth = onResource ? object.initialHealth * defaultResourceMultiplier : object.initialHealth

		// show pattern
		if (pattern) {
			var count = 3

			for (var i = 0; i < pattern.length; i++) {
				var centeredVertically = (i + 2) % count

				if (centeredVertically === 0) {
					var column = pattern[i]

					var sizes = []
					if (side == 'left') {
						for (var j = 0; j < pattern.length; j++) {
							var centeredHorizontally = (j + 2) % count

							if (centeredHorizontally === 0) {
								var block = column[j] / count
								sizes.push(block - 0.5)
							}
						}
					}
					else {
						for (var j = pattern.length - 1; j > 0; j--) {
							var centeredHorizontally = (j + 2) % count

							if (centeredHorizontally === 0) {
								var block = column[j] / count
								sizes.push(block - 0.5)
							}
						}
					}

					var side = getSide(key)
					var shape = getSideColor(defaultShapes, side)

					dotGroup({
						count: count,
						ctx: canvas[layer],
						shape: shape,
						width: width,
						x1: object.start[0] * blockWidth / gm + width,
						y1: object.start[1] * blockHeight / gm + (blockHeight / 17) * i + (blockHeight / 24),
						maxWidth: maxWidth,
						maxHeight: maxHeight,
						sizes: sizes,
						alpha: 1
					})
				}
			}

			var alpha = 0.33

			// grid
			line({
				ctx: canvas[layer],
				shape: defaultShapes.light,
				x1: object.start[0] * blockWidth / gm + (width * 4.25),
				y1: object.start[1] * blockHeight / gm + (height * 2.75),
				x2: object.start[0] * blockWidth / gm + (width * 4.25),
				y2: (object.start[1] + gm) * blockHeight / gm - (height * 2.75),
				w: w,
				h: h,
				alpha: alpha
			})

			line({
				ctx: canvas[layer],
				shape: defaultShapes.light,
				x1: object.start[0] * blockWidth / gm + (width * 4.25) + (width * 2),
				y1: object.start[1] * blockHeight / gm + (height * 2.75),
				x2: object.start[0] * blockWidth / gm + (width * 4.25) + (width * 2),
				y2: (object.start[1] + gm) * blockHeight / gm - (height * 2.75),
				w: w,
				h: h,
				alpha: alpha
			})

			line({
				ctx: canvas[layer],
				shape: defaultShapes.light,
				x1: object.start[0] * blockWidth / gm + (width * 2.5),
				y1: object.start[1] * blockHeight / gm + (height * 4.25),
				x2: (object.start[0] + gm) * blockWidth / gm - (width * 2.5),
				y2: object.start[1] * blockHeight / gm + (height * 4.25),
				w: w,
				h: h,
				alpha: alpha
			})

			line({
				ctx: canvas[layer],
				shape: defaultShapes.light,
				x1: object.start[0] * blockWidth / gm + (width * 2.5),
				y1: object.start[1] * blockHeight / gm + (height * 4.25) + (height * 2),
				x2: (object.start[0] + gm) * blockWidth / gm - (width * 2.5),
				y2: object.start[1] * blockHeight / gm + (height * 4.25) + (height * 2),
				w: w,
				h: h,
				alpha: alpha
			})
		}

		else {
			image({
				ctx: canvas[layer],
				type: object.type,
				file: defaultShapes[object.type].file,
				x1: object.start[0] * blockWidth / gm,
				y1: object.start[1] * blockHeight / gm,
				width: blockWidth,
				height: blockHeight,
				size: size,
				percentage: object.charge
			})
		}

		// health label
		label({
			ctx: canvas[layer],
			string: object.health + ' / ' + (initialHealth * object.level),
			shape: defaultShapes.light,
			x1: object.start[0] * blockWidth / gm + blockWidth / 2,
			y1: (object.start[1] + gm) * blockHeight / gm - blockHeight / 7,
			height: blockHeight,
			size: 10,
			center: true
		})

		// damage label
		if (object.offensive) {
			var damage = object.damage

			label({
				ctx: canvas[layer],
				string: damage,
				shape: defaultShapes.light,
				x1: object.start[0] * blockWidth / gm + blockWidth / 2,
				y1: object.start[1] * blockHeight / gm + blockHeight / 8,
				height: blockHeight,
				size: 10,
				center: true
			})
		}

		// levels
		var marginY = blockHeight / size
		var width = blockWidth / size / 3
		var maxHeight = blockHeight - marginY * 2
		var height = convertRange(object.level, [0, 3], [0, -maxHeight])

		rectangle({
			ctx: canvas[layer],
			shape: defaultShapes.light,
			x1: object.start[0] * blockWidth / gm + width,
			y1: object.start[1] * blockHeight / gm + blockHeight - marginY,
			width: width,
			height: height,
			alpha: 0.5
		})
	}
}