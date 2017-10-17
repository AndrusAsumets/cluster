export function patternizePath(path, pattern, gm) {
	var patternizedPath = [path[0], path[1]] // add something to the beginning of the path
	var lastRow = 0

	for (var i = 2; i < path.length; i++) {
		if (lastRow > pattern.length - 1) lastRow = 0

		var step = alterStep(path[i], pattern, lastRow, gm)

		patternizedPath.push(step)
		lastRow++
	}

	return patternizedPath
}

function alterStep(step, pattern, lastRow, gm) {
	var extra = -gm - 1

	for (var column = 0; column < pattern.length; column++) {
		var block = pattern[column][lastRow]

		if (block > 0) return [step[0], step[1] + column + extra, block]
	}

	return step
}