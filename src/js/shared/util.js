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

export function isPathOpen(o) {
	for (var i = 0; i < o.bVertical - o.gm; i++) {
		//1: moves from left to right
		//2: moves from right to left
		if (o.finder.findPath(o.x1, o.bVertical - o.gm, o.bHorizontal - o.gm - i, 0, o.grid.clone()).length) return true
	}
	
	return false
}

export function findOpenPath(o) {
	for (var i = 0; i < o.height - o.gm; i++) {
		var path = o.finder.findPath(o.start[0], o.start[1], o.end[0], i, o.grid.clone())
		if (path.length) return path
	}
	
	return []
}

export function findBuildingIndex(buildings, building) {
	for (var p = 0; p < buildings.length; p++) {
		if (
			buildings[p].start[0] == building.start[0] &&
			buildings[p].start[1] == building.start[1]
		) return p
	}
}

export function createBoundaries(o) {
	var side = o.side
	var buildings = o.buildings
	var gm = o.gm
	var width = side == 'left' ? Math.floor((o.width + gm) / 2) : o.width + gm
	var height = o.height
	var results = []
	
	for (var i = 0; i < buildings.length; i++) {
		var start = buildings[i].start
		var x1 = start[0]
		var y1 = start[1]
		
		if (
			x1 - gm > -gm &&
			!Number.isInteger(findBuildingIndex(buildings, { start: [x1 - gm, y1] })) &&
			!findBoundary(results, { x: x1 - gm, y: y1 }) &&
			(side == 'left' ? true : x1 > Math.floor(o.width / 2) + 1)
		) results.push({ x: x1 - gm, y: y1 })
		if (
			y1 - gm > -gm &&
			!Number.isInteger(findBuildingIndex(buildings, { start: [x1, y1 - gm] })) &&
			!findBoundary(results, { x: x1, y: y1 - gm })
		) results.push({ x: x1, y: y1 - gm })
		if (
			x1 + gm < width - 1 &&
			!Number.isInteger(findBuildingIndex(buildings, { start: [x1 + gm, y1] })) &&
			!findBoundary(results, { x: x1 + gm, y: y1 })
		) results.push({ x: x1 + gm, y: y1 })
		if (
			y1 + gm < height - 1 &&
			!Number.isInteger(findBuildingIndex(buildings, { start: [x1, y1 + gm] })) &&
			!findBoundary(results, { x: x1, y: y1 + gm })
		) results.push({ x: x1, y: y1 + gm })
	}
	
	return results
}

export function findBoundary(results, position) {
	var x1 = position.x
	var y1 = position.y
	
	for (var j = 0; j < results.length; j++) {
		var x2 = results[j].x
		var y2 = results[j].y

		if (x1 == x2 && y1 == y2) return true
	}
	
	return false
}

export function getSide(players, key) {
	return players && players[key]
		? players[key].side
		: null
}

export function getSideColor(defaultShapes, side) {
	var color = side == 'left' ? defaultShapes.blue : defaultShapes.red
	return color
}

export function createResource(o) {
	var width = o.width
	var height = o.height
	var resources = o.resources
	
	var x = Math.floor(Math.random() * width - 1) + 1
	var y = Math.floor(Math.random() * height - 1) + 1
	
	while (isOnResource(resources, x, y)) return createResource(o)
	
	return { x: x, y: y }
}

export function isOnResource(resources, x1, y1) {
	for (var i = 0; i < resources.length; i++) {
		var x2 = resources[i].x
		var y2 = resources[i].y
		
		if (x1 == x2 && y1 == y2) return true
	}
	
	return false
}