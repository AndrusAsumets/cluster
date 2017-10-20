require('dotenv').config()

const app = require('express')()
var server = require('http').Server(app)

// ws
var io = require('socket.io')(server)

// database
import { Database } from './src/js/backend/database'
const db = new Database('http://localhost:5984/cluster')

// actions
import { CONNECT, JOIN, ON_JOIN, HOST, DISCONNECT } from './src/js/shared/actions'

// match making
import { join } from './src/js/backend/join'
var timeout = 60 * 1000
var rooms = {}

io.on('connection', socket => {
	socket.emit('message', { action: CONNECT })
	
	socket.on('message', (async(message) => {
		const epoch = (new Date).getTime()
		const action = message.action
		const data = message.data
		var roomId = message.roomId
		const side = message.side
	
		switch(action) {
			case JOIN:
				const joined = join(rooms, data, socket)
				roomId = joined.room.id
				socket.join(roomId)
				const room = joined.room
				rooms[roomId] = room
				
				const query = joined.side == 'left'
					? { side: 'left', id: joined.room.id }
					: { side: 'right', id: joined.room.id }
				socket.emit('message', { action: ON_JOIN, data: query })
				
				console.log('player joined to room', roomId, new Date())
				break
				
			case HOST:
				roomId = data
				socket.join(roomId)
				
				console.log('host joined to room', roomId, new Date())
				break
				
			default:
				io.sockets.in(roomId).emit('message', message)
				if (side) rooms[roomId][side].seen = epoch
		}
		
		const update = await db.update(roomId + '_' + epoch, message)
		if (update.error) console.log('could not update database')
	}))
	
	socket.on('restart', data => {
		require('child_process').exec('kill -HUP ' +  process.pid)
	})
})

setInterval(function () {
	const epoch = (new Date).getTime()
	
	for (var roomId in rooms) {
		const room = rooms[roomId]
		const maxInactivity = timeout
		
		var leftActive = room && room.left
			? !(room.left.seen < epoch - maxInactivity)
			: false
			
		var rightActive = room && room.right
			? !(room.right.seen < epoch - maxInactivity)
			: false
			
		if (!leftActive || !rightActive) {
			delete rooms[roomId]
			if (room.left) room.left.socket.emit('message', { action: DISCONNECT })
			if (room.right) room.right.socket.emit('message', { action: DISCONNECT })
		}
	}	

}, timeout)

global.window = null

const PORT = process.env.WS_DEVELOPMENT_PORT || 1337
server.listen(PORT)
console.log('Development server is listening on', PORT)