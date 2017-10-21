import { defaultDamage, defaultDamageMultiplier } from './defaults'

export function upgrade(o) {
	var player = o.player
	var buildingIndex = o.buildingIndex
	var buildings = player.buildings
	var building = buildings[buildingIndex]
	if (!building) return player
	var damage = building.damage
	var energy = player.energy
	var level = building.level + 1
	var cost = upgradeCost(Object.assign({}, o, { building: building }))

	if (!cost) return player
	if (energy - cost < 0) return player

	player.energy = energy - cost
	if (building && building.level) {
		player.buildings[buildingIndex].level = level
		player.buildings[buildingIndex].health = building.health + building.initialHealth * building.resource
		player.buildings[buildingIndex].damage = (damage * defaultDamageMultiplier) * building.resource
	}
	return player
}

export function upgradeCost(o) {
	var building = o.building
	if (!building && !building.level) return 0
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

	while(index) {
		total += index * cost
		index--
	}
	
	return total / 2 * (building.health / building.initialHealth / level)
}

export function calculateDamage(level) {
	return defaultDamage * level
}

export function repair(o) {
	var player = o.player
	var energy = player.energy
	var buildingIndex = o.buildingIndex
	var buildings = player.buildings
	var building = buildings[buildingIndex]
	if (!building) return player

	var maxHealth = building.initialHealth * building.level
	var cost = maxHealth - building.health

	if (!cost) return player
	if (energy - cost < 0) return player

	player.energy = energy - cost
	player.buildings[buildingIndex].health = maxHealth

	return player
}

export function calculateRepairCost(building) {
	return building.initialHealth * building.level - building.health
}
