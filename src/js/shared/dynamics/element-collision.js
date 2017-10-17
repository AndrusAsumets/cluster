import { isNear } from './../util'
import { defaultShapes } from './../defaults'

export function elementCollision(players, p) {
	var player = players[p]
	var a = 1
	var b = 1

	for (var r = 0; r < player.elements.length; r++) {
		if (
			!player.elements &&
			!player.elements.length &&
			!player.elements[r] &&
			!player.elements[r].length &&
			!player.elements[r].path &&
			!player.elements[r].path[a] &&
			!player.elements[r].path[a].length
		) continue

		var positionA = player.elements[r].path[a]
		if (!positionA) continue
		if (!positionA.length) continue

		for (var p2 in players) {
			if (p == p2) continue
			var anotherPlayer = players[p2]

			for (var r2 = 0; r2 < anotherPlayer.elements.length; r2++) {
				if (
					!anotherPlayer.elements &&
					!anotherPlayer.elements.length &&
					!anotherPlayer.elements[r2] &&
					!anotherPlayer.elements[r2].length &&
					!anotherPlayer.elements[r2].path &&
					!anotherPlayer.elements[r2].path[b] &&
					!anotherPlayer.elements[r2].path[b].length
				) continue

				var positionB = anotherPlayer.elements[r2].path[b]
				if (!positionB) continue
				if (!positionB.length) continue

				if (isNear(1, positionA, positionB)) {
					if (positionB[2] == 9) {
						var projectile = {
							path: [
								player.elements[r].path[a - 1],
								anotherPlayer.elements[r2].path[b]
							],
							shape: defaultShapes[player.elements[r].type],
							level: player.elements[r].level,
							dynamics: {
								damage: anotherPlayer.elements[r2].dynamics.damage
							}
						}

						players[player.id].deepProjectiles.push(projectile)
					}

					if (positionA[2] == 9) {
						var projectile = {
							path: [
								anotherPlayer.elements[r2].path[a - 1],
								player.elements[r].path[b]
							],
							shape: defaultShapes[anotherPlayer.elements[r2].type],
							level: anotherPlayer.elements[r2].level,
							dynamics: {
								damage: player.elements[r].dynamics.damage
							}
						}

						players[anotherPlayer.id].deepProjectiles.push(projectile)
					}

					break
				}
			}
		}
	}

	return players
}