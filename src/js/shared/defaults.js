export const defaultEnergy = 100
export const defaultHealth = 100
export const defaultDamage = 20
export const defaultAbsorb = 20

export const defaultShapes = {
	background: {
		fillStyle: function (alpha) { return 'rgba(25, 29, 49,' + alpha + ')' }
	},
	dark: {
		fillStyle: function (alpha) { return 'rgba(11, 7, 35,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(0, 0, 0,' + alpha + ')' }
	},
	light: {
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' }
	},
	earth: {
		fillStyle: function (alpha) { return 'rgba(194, 97, 204,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(194, 97, 204,' + alpha + ')' }
	},
	well: {
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' }
	},
	factory: {
		fillStyle: function (alpha) { return 'rgba(255, 74, 61,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 74, 61,' + alpha + ')' }
	},
	laser: {
		fillStyle: function (alpha) { return 'rgba(0, 190, 229,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(0, 190, 229,' + alpha + ')' }
	}
}

export const defaultBuildings = {
	/*
	earth: {
		cost: 250,
		linkable: false,
		offensive: false
	},
	water: {
		cost: 25,
		linkable: true,
		offensive: false
	},
	*/
	well: {
		cost: 25,
		linkable: true,
		producer: true
	},
	factory: {
		cost: 50,
		offensive: true
	},
	laser: {
		cost: 50,
		defensive: true
	}
}