export function resetProjectiles(players, player) {
	players[player.id].projectiles = []
	players[player.id].deepProjectiles = []

	var buildings = player.buildings ? player.buildings : []
	for (var r = 0; r < buildings.length; r++) {
		if (!'fired' in buildings[r].dynamics) continue
		players[player.id].buildings[r].dynamics.fired = 0
	}
	
	return players
}