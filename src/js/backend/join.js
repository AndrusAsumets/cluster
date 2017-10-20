// game
import { game } from './../shared/game'

export function join(rooms, me, socket) {
	const epoch = (new Date).getTime()
	var room = {}
	
	var joined = alreadyJoined(rooms, me, socket)
	if (!joined) {
		
		var halfFull = findHalfFull(rooms, me)
		if (halfFull) {
			halfFull.right = {}
			halfFull.right.id = me
			halfFull.right.socket = socket
			halfFull.right.seen = epoch
			return { room: halfFull, side: 'right' }
		}
	}
	else {
		return { room: joined.room, side: joined.side }
	}
	
	return { room: create(me, socket), side: 'left' }
}

function alreadyJoined(rooms, me, socket) {
	for (var roomId in rooms) {
		var room = rooms[roomId]
		
		if (room.left && room.left.id == me) {
			room.left.socket = socket
			return { room: room, side: 'left' }
		}
		
		else if (room.right && room.right.id == me) {
			room.right.socket = socket
			return { room: room, side: 'right' }
		}
	}
}

function findHalfFull(rooms, me) {
	for (var roomId in rooms) {
		var room = rooms[roomId]
		
		if ('left' in room && !('right' in room)) return room
	}
}

function create(me, socket) {
	var id = String(Math.random()).split('.')[1]
	const epoch = (new Date).getTime()
	
	return {
		id: id,
		time: (new Date).getTime(),
		left: { id: me, socket: socket, seen: epoch },
		game: game(id)
	}
}