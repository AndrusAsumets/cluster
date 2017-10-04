export function upgrade(o) {
	var player = o.player
	var buildingIndex = o.buildingIndex
	var buildings = player.buildings
	var building = buildings[buildingIndex]
	var energy = player.energy
	var level = building.level + 1
	var cost = building.cost
	var total = level * cost
	
	if (level > 3) return player
	if (energy - total < 0) return player
	
	player.energy = energy - total
	if (player.buildings[buildingIndex]) player.buildings[buildingIndex].level = level
	return player
}

export function sell(o) {
	var player = o.player
	var buildingIndex = o.buildingIndex
	var buildings = player.buildings
	var building = buildings[buildingIndex]
	if (!building) return player
	var level = building.level
	var cost = building.cost
	
	var total = 0
	var index = level
	while(index > 0) {
		total += index * cost
		index--
	}
	
	var sellBackValue = total / 2
	player.energy += sellBackValue
	player.buildings.splice(buildingIndex, 1)
	return player
}