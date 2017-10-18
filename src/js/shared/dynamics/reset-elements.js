export function resetElements(players, player) {
	var elements = player.elements
	
	for (var i = 0; i < elements.length; i++) {
		if (elements[i].inactive) players[player.id].elements.splice(i, 1)
	}
	
	return players
}