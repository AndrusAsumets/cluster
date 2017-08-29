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

export function setWalkableAt(player, gm, x, y, walkable) {
	var grid = player.grid
	for (var p = -1; p < gm - 1; p++) {
		for (var r = -1; r < gm - 1; r++) {
			var left = x + p
			var top = y + r
			
			left = left < 0 ? 0 : left
			top = top < 0 ? 0 : top

			grid.setWalkableAt(left, top, walkable)
		}
	}
	player.grid = grid
	return player
}

export function alreadyLinked(player, from, to) {
	var links = player.links
	
	for (var i = 0; i < links.length; i++) {
		if (
			links[i].from[0] == from[0] &&
			links[i].from[1] == from[1] &&
			links[i].to[0] == to[0] &&
			links[i].to[1] == to[1]
		) return true
	}
	
	return false
}

export function isPathOpen(o) {
	for (var i = 0; i < o.bHorizontal - o.gm; i++) {
		//1: moves from left to right
		//2: moves from right to left
		if (o.finder.findPath(i, 0, o.bHorizontal - o.gm - i, o.bVertical - o.gm, o.grid.clone()).length) return true
	}
	
	return false
}

export function findOpenPath(o) {
	for (var i = 0; i < o.bHorizontal - o.gm; i++) {
		if (o.finder.findPath(i, o.y1, i, o.y2, o.grid.clone()).length) return i
	}
}