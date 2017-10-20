// game
import { game } from './../shared/game'

export function join(rooms, me) {
	var room = null
	
	var joined = alreadyJoined(rooms, me)
	if (!joined) {
		
		var halfFull = findHalfFull(rooms, me)
		if (halfFull) {
			halfFull.right = me
			return { room: halfFull, side: 'right' }
		}
	}
	else {
		return { room: joined.room, side: joined.side }
	}
	
	return { room: create(me), side: 'left' }
}

function alreadyJoined(rooms, me) {
	for (var i = 0; i < Object.keys(rooms).length; i++) {
		var key = Object.keys(rooms)[i]
		var room = rooms[key]
		
		if (room.left == me) return { room: room, side: 'left' }
		else if (room.right == me) return { room: room, side: 'right'}
	}
}

function findHalfFull(rooms, me) {
	for (var i = 0; i < Object.keys(rooms).length; i++) {
		var key = Object.keys(rooms)[i]
		var room = rooms[key]
		
		if ('left' in room && !('right' in room)) return room
	}
}

function create(me) {
	var id = String(Math.random()).split('.')[1]
	return {
		id: id,
		epoch: (new Date).getTime(),
		left: me,
		game: game(id)
	}
}