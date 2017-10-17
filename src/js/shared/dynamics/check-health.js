export function checkHealth(players, player) {
	var elements = player.elements ? player.elements : []
	for (var r = 0; r < elements.length; r++) {
		if (elements[r].dynamics.health <= 0) players[player.id].elements.splice(r, 1)
	}
	
	return players
}