import { isNear } from './../util'
import { SET_BUILDING_DAMAGE } from './../actions'

export function buildingCollision(o) {
	var players = o.players
	var p = o.p
	var host = o.host
	var socket = o.socket
	
	var player = players[p]
	var a = 0
	var b = 0

	for (var r = 0; r < player.elements.length; r++) {
		if (
			!player.elements[r].path ||
			!player.elements[r].path.length ||
			!player.elements[r].path[a] ||
			!player.elements[r].path[a][2]
		) continue

		var positionA = player.elements[r].path[a]
		if (!positionA) continue
		if (!positionA.length) continue

		var damage = player.elements[r].dynamics.damage

		for (var p2 in players) {
			if (p == p2) continue

			var anotherPlayer = players[p]

			for (var r2 = 0; r2 < anotherPlayer.buildings.length; r2++) {
				var positionB = anotherPlayer.buildings[r2].start

				if (
					player.elements[r].path[a][2] == 9 ||
					anotherPlayer.buildings[r2].defensive
				) {}
				else continue

				if (!positionB) continue
				if (!positionB.length) continue

				if (isNear(1, positionA, positionB)) {
					if (host) socket.emit('message', { action: SET_BUILDING_DAMAGE, data: { playerId: p, buildingId: anotherPlayer.buildings[r2].id, damage: damage, elementIndex: r } })

					break
				}
			}
		}
	}
}