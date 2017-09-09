export function defaultShapes() {
	return {
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
		water: {
			fillStyle: function (alpha) { return 'rgba(0, 190, 229,' + alpha + ')' },
			strokeStyle: function (alpha) { return 'rgba(0, 190, 229,' + alpha + ')' }
		},
		fire: {
			fillStyle: function (alpha) { return 'rgba(255, 74, 61,' + alpha + ')' },
			strokeStyle: function (alpha) { return 'rgba(255, 74, 61,' + alpha + ')' }
		},
		well: {
			fillStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' },
			strokeStyle: function (alpha) { return 'rgba(255, 255, 255,' + alpha + ')' }
		}
	}
}

export function defaultBuildings() {
	return {
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
		fire: {
			cost: 250,
			linkable: false,
			offensive: false
		},
		*/
		well: {
			cost: 25,
			linkable: true,
			offensive: false,
			producer: true
		}	
	}
}