export function shiftPaths(players, player) {
	var elements = player.elements ? player.elements : []
	for (var p = 0; p < elements.length; p++) {
		var element = player.elements[p]

		if (element.inactive) {
			continue
		}
		else if (
			!element.path ||
			!element.path[1] ||
			!element.path[1].length
		) {
			players[player.id].elements[p].inactive = true	
		}
		
		else {
			players[player.id].elements[p].path.shift()
		}
	}
	
	return players
}