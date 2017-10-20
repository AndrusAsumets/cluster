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

export const defaultTick = 675 // how often should the events happen
export const defaultEnergy = 500
export const defaultHealth = 50
export const defaultDamage = 10
export const defaultDamageMultiplier = 3
export const defaultEnergyMultiplier = 25
export const defaultResourceCount = 2
export const defaultResourceMultiplier = 5

export const defaultPatterns = {
	patternA: {
		pattern: [
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[3,3,3,3,9,3,3,9,3],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0]
		],
		submenu: {
			patternA: {
				pattern: [
					[0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0],
					[3,3,3,3,3,3,3,9,3],
					[0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0]
				]
			}			
		},
	},
	/*
	patternB: {
		pattern: [
			[0,0,0,0,0,0,0,0,0],
			[3,3,0,0,0,0,0,0,0],
			[0,0,3,0,0,0,0,0,0],
			[0,0,0,3,0,0,0,0,0],
			[0,0,0,0,9,0,0,0,0],
			[0,0,0,0,0,3,0,0,0],
			[0,0,0,0,0,0,3,0,0],
			[0,0,0,0,0,0,0,9,3],
			[0,0,0,0,0,0,0,0,0]
		],
		submenu: {
			pattern: {
				pattern: [
					[0,0,0,0,0,0,0,0,0],
					[3,3,0,0,0,0,0,0,0],
					[0,0,3,0,0,0,0,0,0],
					[0,0,0,3,0,0,0,0,0],
					[0,0,0,0,3,0,0,0,0],
					[0,0,0,0,0,3,0,0,0],
					[0,0,0,0,0,0,3,0,0],
					[0,0,0,0,0,0,0,9,3],
					[0,0,0,0,0,0,0,0,0]
				]
			}
		}
	},
	patternC: {
		pattern: [
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,9,3],
			[0,0,0,0,0,0,3,0,0],
			[0,0,0,0,0,3,0,0,0],
			[0,0,0,0,9,0,0,0,0],
			[0,0,0,3,0,0,0,0,0],
			[0,0,3,0,0,0,0,0,0],
			[3,3,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0]
		],
		submenu: {
			pattern: {
				pattern: [
					[0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,9,3],
					[0,0,0,0,0,0,3,0,0],
					[0,0,0,0,0,3,0,0,0],
					[0,0,0,0,3,0,0,0,0],
					[0,0,0,3,0,0,0,0,0],
					[0,0,3,0,0,0,0,0,0],
					[3,3,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0]
				]
			}
		}
	},
	*/
	patternD: {
		pattern: [
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[3,3,0,0,0,0,0,9,3],
			[0,0,3,0,0,0,3,0,0],
			[0,0,0,3,0,3,0,0,0],
			[0,0,0,0,9,0,0,0,0],
			[0,0,0,0,0,0,0,0,0]
		],
		submenu: {
			pattern: {
				pattern: [
					[0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0],
					[3,3,0,0,0,0,0,3,3],
					[0,0,3,0,0,0,3,0,0],
					[0,0,0,3,0,3,0,0,0],
					[0,0,0,0,9,0,0,0,0],
					[0,0,0,0,0,0,0,0,0]
				]
			}
		}
	},
	patternE: {
		pattern: [
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,9,0,0,0,0],
			[0,0,0,3,0,3,0,0,0],
			[0,0,3,0,0,0,3,0,0],
			[3,3,0,0,0,0,0,9,3],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0]
		],
		submenu: {
			pattern: {
				pattern: [
					[0,0,0,0,0,0,0,0,0],
					[0,0,0,0,9,0,0,0,0],
					[0,0,0,3,0,3,0,0,0],
					[0,0,3,0,0,0,3,0,0],
					[3,3,0,0,0,0,0,3,3],
					[0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0],
					[0,0,0,0,0,0,0,0,0]
				]
			}
		}
	}
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

export const defaultBuildings = {
	attack: {
		cost: 50,
		level: 1,
		initialHealth: 10,
		offensive: true,
		pattern: [
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[3,9,3,3,9,3,3,9,3],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0],
			[0,0,0,0,0,0,0,0,0]
		],
		submenu: defaultOptions
	},
	defend: {
		cost: 50,
		level: 1,
		initialHealth: 30,
		defensive: true,
		submenu: defaultOptions
	},
	invest: {
		cost: 25,
		level: 1,
		initialHealth: 10,
		linkable: true,
		producer: true,
		income: 0.5,
		submenu: defaultOptions
	},
	/*
	boost: {
		submenu: defaultBoosters
	}
	*/
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

/*
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
*/
