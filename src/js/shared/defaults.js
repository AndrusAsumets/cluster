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

import { SET_UPGRADE, SET_SELL, SET_REPAIR } from './actions'

export const defaultEnergy = 500
export const defaultHealth = 30
export const defaultDamage = 20
export const defaultResourceCount = 2
export const defaultResourceMultiplier = 5

const defaultPatterns = {
	patternA: {
		cost: 50,
		level: 1,
		initialHealth: 10,
		offensive: true,
		pattern: [
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[3,3,3,3,3,3,6,9,6],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0]
		]
	},
	patternB: {
		cost: 50,
		level: 1,
		initialHealth: 10,
		offensive: true,
		pattern: [
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[3,3,0,0,0,0,0,0,0],
			[0,0,3,0,0,0,0,0,0],
			[0,0,0,3,0,0,0,0,6],
			[0,0,0,0,3,3,6,9,0],
			[0,0,0,0,0,0,0,0,0]
		]
	},
	patternC: {
		cost: 50,
		level: 1,
		initialHealth: 10,
		offensive: true,
		pattern: [
			[0,0,0,0,0,0,0,0,6],
			[0,0,0,0,0,0,0,9,0],
			[0,0,0,0,0,0,6,0,0],
			[0,0,0,0,0,3,0,0,0],
			[0,0,0,0,3,0,0,0,0],
			[0,0,0,3,0,0,0,0,0],
			[0,0,3,0,0,0,0,0,0],
			[0,3,0,0,0,0,0,0,0],
			[3,0,0,0,0,0,0,0,0]
		]
	},
	patternD: {
		cost: 50,
		level: 1,
		initialHealth: 10,
		offensive: true,
		pattern: [
			[0,0,0,0,0,0,0,0,3],
			[0,0,0,0,0,0,0,3,0],
			[0,0,0,0,0,0,3,0,0],
			[0,0,0,0,0,3,0,0,0],
			[0,0,0,0,3,0,0,0,0],
			[0,0,0,3,0,0,0,0,0],
			[0,0,6,0,0,0,0,0,0],
			[0,9,0,0,0,0,0,0,0],
			[6,0,0,0,0,0,0,0,0]
		]
	}
}

const defaultBoosters = {
	boosterA: {
		cost: 50,
		level: 1,
		initialHealth: 10
	},
	boosterB: {
		cost: 50,
		level: 1,
		initialHealth: 10
	}
}

export const defaultBuildings = {
	attack: {
		submenu: defaultPatterns
	},
	defend: {
		cost: 50,
		level: 1,
		initialHealth: 30,
		defensive: true
	},
	invest: {
		cost: 25,
		level: 1,
		initialHealth: 10,
		linkable: true,
		producer: true,
		income: 0.5
	},
	/*
	boost: {
		submenu: defaultBoosters
	}
	*/
}

export const defaultOptions = {
	sell: {
		action: SET_SELL
	},
	upgrade: {
		action: SET_UPGRADE
	},
	repair: {
		action: SET_REPAIR
	}
}

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
	blue: {
		fillStyle: function (alpha) { return 'rgba(0, 190, 229,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(0, 190, 229,' + alpha + ')' }
	},
	red: {
		fillStyle: function (alpha) { return 'rgba(255, 74, 61,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(255, 74, 61,' + alpha + ')' }
	},
	yellow: {
		fillStyle: function (alpha) { return 'rgba(244, 209, 66,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(244, 209, 66,' + alpha + ')' }
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
	patternD: {
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
	},
	repair: {
		file: '/public/images/repair.svg'
	},
	resource: {
		file: '/public/images/resource.svg',
		fillStyle: function (alpha) { return 'rgba(0, 255, 199,' + alpha + ')' },
		strokeStyle: function (alpha) { return 'rgba(0, 255, 199,' + alpha + ')' }
	}
}
