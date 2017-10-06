/*
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0]
*/

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
	black: {
		fillStyle: function (alpha) { return 'rgba(0, 0, 0,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(0, 0, 0,' + alpha + ')' }
	},
	red: {
		fillStyle: function (alpha) { return 'rgba(255, 74, 61,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 74, 61,' + alpha + ')' }
	},
	blue: {
		fillStyle: function (alpha) { return 'rgba(0, 190, 229,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(0, 190, 229,' + alpha + ')' }
	},
	earth: {
		fillStyle: function (alpha) { return 'rgba(194, 97, 204,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(194, 97, 204,' + alpha + ')' }
	},
	invest: {
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		file: '/public/images/turbine.svg'
	},
	attack: {
		file: '/public/images/pattern.svg'
	},
	patternA: {
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		file: '/public/images/patternA.svg'
	},
	patternB: {
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		file: '/public/images/patternB.svg'
	},
	patternC: {
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		file: '/public/images/patternB.svg'
	},
	defend: {
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		file: '/public/images/shield.svg'
	},
	boost: {
		file: '/public/images/booster.svg'
	},
	boosterA: {
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		file: '/public/images/speed.svg'
	},
	boosterB: {
		fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
		file: '/public/images/fire.svg'
	},
	upgrade: {
		file: '/public/images/upgrade.svg'
	},
	sell: {
		file: '/public/images/sell.svg'
	}
}

const defaultPatterns = {
	patternA: {
		cost: 50,
		level: 1,
		offensive: true,
		pattern: [
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[2,2,2,2,2,2,6,9,6],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0]
		]
	},
	patternB: {
		cost: 50,
		level: 1,
		offensive: true,
		pattern: [
			[2,0,0,0,0,0,0,0,0],
			[0,2,0,0,0,0,0,0,0],
			[0,0,2,0,0,0,0,0,0],
			[0,0,0,2,0,0,0,0,0],
			[0,0,0,0,2,0,0,0,0],
			[0,0,0,0,0,2,0,0,0],
			[0,0,0,0,0,0,6,0,0],
			[0,0,0,0,0,0,0,9,0],
			[0,0,0,0,0,0,0,0,6]
		]
	},
	patternC: {
		cost: 50,
		level: 1,
		offensive: true,
		pattern: [
			[0,0,0,0,0,0,0,0,2],
			[0,0,0,0,0,0,0,2,0],
			[0,0,0,0,0,0,2,0,0],
			[0,0,0,0,0,2,0,0,0],
			[0,0,0,0,2,0,0,0,0],
			[0,0,0,2,0,0,0,0,0],
			[0,0,6,0,0,0,0,0,0],
			[0,9,0,0,0,0,0,0,0],
			[6,0,0,0,0,0,0,0,0]
		]
	}
}

const defaultBoosters = {
	boosterA: {
		cost: 50,
		level: 1
	},
	boosterB: {
		cost: 50,
		level: 1		
	}
}

export const defaultBuildings = {
	attack: {
		submenu: defaultPatterns
	},
	defend: {
		cost: 50,
		level: 1,
		defensive: true
	},
	invest: {
		cost: 25,
		level: 1,
		linkable: true,
		producer: true,
		income: 0.5
	},
	boost: {
		submenu: defaultBoosters
	}
}

export const defaultOptions = {
	sell: {
		action: SET_SELL
	},
	upgrade: {
		action: SET_UPGRADE
	}
}
