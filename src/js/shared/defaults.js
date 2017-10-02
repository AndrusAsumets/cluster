import { SET_UPGRADE, SET_SELL } from './actions'

export const defaultEnergy = 10000
export const defaultHealth = 30
export const defaultDamage = 10
export const defaultAbsorb = 10

export const defaultShapes = {
	background: {
		fillStyle: function (alpha) { return 'rgba(14, 10, 46,' + alpha + ')' }
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
	mine: {
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		file: '/public/images/turbine.svg'
	},
	pattern: {
		//fillStyle: function (alpha) { return 'rgba(255, 74, 61,' + alpha + ')' }, // punane
		//strokeStyle: function (alpha) { return 'rgba(255, 74, 61,' + alpha + ')' }, // punane
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		file: '/public/images/pattern.svg'
	},
	shield: {
		//fillStyle: function (alpha) { return 'rgba(0, 190, 229,' + alpha + ')' }, // sinine]
		//strokeStyle: function (alpha) { return 'rgba(0, 190, 229,' + alpha + ')' }, // sinine
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		file: '/public/images/shield.svg'
	},
	booster: {
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		file: '/public/images/booster.svg'
	},
	upgrade: {
		file: '/public/images/upgrade.svg'
	},
	sell: {
		file: '/public/images/sell.svg'
	}
}

export const defaultBuildings = {
	pattern: {
		cost: 50,
		level: 1,
		offensive: true
	},
	shield: {
		cost: 50,
		level: 1,
		defensive: true
	},
	mine: {
		cost: 25,
		level: 1,
		linkable: true,
		producer: true,
		income: 0.5
	},
	mine: {
		cost: 25,
		level: 1,
		linkable: true,
		producer: true,
		income: 0.5
	},
	booster: {
		cost: 25,
		level: 1
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
