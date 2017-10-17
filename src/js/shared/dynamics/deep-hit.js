export function deepHit(players, player) {
	for (var r = 0; r < player.elements.length; r++) {
		var element = player.elements[r]

		if (
			!element.path ||
			!element.path[1] ||
			!element.path[1].length
		) continue

		var x2 = element.path[1][0]
		var y2 = element.path[1][1]

		var projectiles = player.deepProjectiles
		for (var p = 0; p < projectiles.length; p++) {
			var x1 = projectiles[p].path[1][0]
			var y1 = projectiles[p].path[1][1]
			var d1 = projectiles[p].path[1][2]

			if (
				x1 == x2 &&
				y1 == y2 &&
				x1 % 3 === 0 &&
				y1 % 3 === 0 &&
				d1 == 9
			) {
				var health = players[player.id].elements[r].dynamics.health
				var damage = projectiles[p].dynamics.damage
				players[player.id].elements[r].dynamics.health = health - damage
				if (players[player.id].elements[r].dynamics.health < 1) players[player.id].elements[r].path = []
				break
			}
		}
	}
	
	return players
}