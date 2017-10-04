export function upgrade(o) {
	var player = o.player
	var buildingIndex = o.buildingIndex
	var buildings = player.buildings
	var building = buildings[buildingIndex]
	var energy = player.energy
	var level = building.level + 1
	var cost = upgradeCost(Object.assign({}, o, { building: building }))
	
	if (!cost) return player
	if (energy - cost < 0) return player
	
	player.energy = energy - cost
	if (player.buildings[buildingIndex]) player.buildings[buildingIndex].level = level
	return player
}

export function upgradeCost(o) {
	var building = o.building
	var level = building.level + 1
	if (level > 3) return false
	var cost = building.cost
	var total = level * cost
	return total
}

export function sell(o) {
	var player = o.player
	var buildingIndex = o.buildingIndex
	var buildings = player.buildings
	var building = buildings[buildingIndex]
	if (!building) return player
	
	var total = sellBackValue({ building: building })
	player.energy += total
	player.buildings.splice(buildingIndex, 1)
	return player
}

export function sellBackValue(o) {
	var building = o.building
	var level = building.level
	var cost = building.cost
	var total = 0
	var index = level
	
	while(index > 0) {
		total += index * cost
		index--
	}
	return total / 2
}