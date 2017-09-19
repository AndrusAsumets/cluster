export function sell(o) {
	var player = o.player
	var buildingIndex = o.buildingIndex
	var buildings = player.buildings
	var building = buildings[buildingIndex]
	var cost = building.cost
	var sellBackValue = cost / 2
	player.energy = player.energy + sellBackValue
	player.buildings.splice(buildingIndex, 1)
	return player
}