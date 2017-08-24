export function isNear(gm, positionA, positionB) {
	for (var q = -gm; q < gm * 2; q++) {
		if (positionA[0] + q == positionB[0]) {
			for (var o = -gm; o < gm * 2; o++) {
				if (positionA[1] + o == positionB[1]) return true
			}
		}
	}
	return false
}

export function setWalkableAt(players, player, gm, x, y, walkable) {
	var grid = players[player.id].grid
	for (var p = -1; p < gm - 1; p++) {
		for (var r = -1; r < gm -1; r++) {
			var left = x + p
			var top = y + r
			
			left = left < 0 ? 0 : left
			top = top < 0 ? 0 : top
			grid.setWalkableAt(left, top, walkable)
		}
	}
	players[player.id].grid = grid
	return players
}