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

export function setWalkableAt(grid, gm, x, y, walkable) {
	var m = Math.abs(gm / 3)
	x = x <= m ? m : x
	y = y <= m ? m : y
	
	for (var p = -m; p < gm - m; p++) {
		for (var r = -m; r < gm - m; r++) {
			var left = x + p
			var top = y + r

			grid.setWalkableAt(left, top, walkable)
		}
	}
	return grid
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
	for (var i = 0; i < o.bVertical - o.gm; i++) {
		//1: moves from left to right
		//2: moves from right to left
		if (o.finder.findPath(o.x1, o.bVertical - o.gm, o.bHorizontal - o.gm - i, 0, o.grid.clone()).length) return true
	}
	
	return false
}

export function findOpenPath(o) {
	for (var i = 0; i < o.size - o.gm; i++) {
		if (o.finder.findPath(o.x1, i, o.x2, i, o.grid.clone()).length) return i
	}
}