import { SET_UPGRADE, SET_SELL } from './actions'

export const defaultEnergy = 1000
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
	turbine: {
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		file: '/public/images/turbine.svg'
	},
	factory: {
		//fillStyle: function (alpha) { return 'rgba(255, 74, 61,' + alpha + ')' }, // punane
		//strokeStyle: function (alpha) { return 'rgba(255, 74, 61,' + alpha + ')' }, // punane
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		file: '/public/images/factory.svg'
	},
	shield: {
		//fillStyle: function (alpha) { return 'rgba(0, 190, 229,' + alpha + ')' }, // sinine]
		//strokeStyle: function (alpha) { return 'rgba(0, 190, 229,' + alpha + ')' }, // sinine
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		file: '/public/images/shield.svg'
	},
	upgrade: {
		file: '/public/images/upgrade.svg'
	},
	sell: {
		file: '/public/images/sell.svg'
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
	turbine: {
		cost: 25,
		level: 1,
		linkable: true,
		producer: true,
		income: 0.5
	},
	factory: {
		cost: 50,
		level: 1,
		offensive: true
	},
	shield: {
		cost: 50,
		level: 1,
		defensive: true
	}
}

export const defaultOptions = {
	upgrade: {
		action: SET_UPGRADE
	},
	sell: {
		action: SET_SELL
	}
}
