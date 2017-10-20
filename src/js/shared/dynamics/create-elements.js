import { patternizePath } from './patternize-path'
import { SET_ELEMENT } from './../actions'

export function createElements(o) {
	var players = o.players
	var p = o.p
	var finder = o.finder
	var grid = o.grid
	var gm = o.gm
	var socket = o.socket
	var roomId = o.roomId
	
	var objects = players[p].buildings

	for (var i = 0; i < objects.length; i++) {
		var object = objects[i]

		if (!object.offensive) continue

		for (var r in players) {
			if (p != r) {
				var start = object.start
				var end = object.end

				// see if a path was found using default positions
				var path = finder.findPath(start[0], start[1], end[0], end[1], grid.clone())

				var pattern = object.pattern
				var patternizedPath = patternizePath(path, pattern, gm)

				var element = {
					id: players[r].elements.length,
					playerId: p,
					active: true,
					type: object.type,
					start: patternizedPath[0],
					path: patternizedPath,
					level: object.level,
					dynamics: {
						totalHealth: object.damage,
						health: object.damage,
						damage: object.damage
					}
				}

				socket.emit('message', { action: SET_ELEMENT, data: { element: element, buildingIndex: i }, roomId: roomId })
			}
		}
	}
}