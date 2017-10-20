require('dotenv').config()

const app = require('express')()
var server = require('http').Server(app)

// ws
var io = require('socket.io')(server)

// database
import { Database } from './src/js/backend/database'
const db = new Database('http://localhost:5984/cluster')

// actions
import { CONNECT, JOIN, ON_JOIN, HOST } from './src/js/shared/actions'

// match making
import { join } from './src/js/backend/join'

var rooms = {}

io.on('connection', socket => {
	socket.emit('message', { action: CONNECT })
	
	socket.on('message', (async(message) => {
		var action = message.action
		var data = message.data
		var roomId = message.roomId
	
		switch(action) {
			case JOIN:
				var joined = join(rooms, data)
				roomId = joined.room.id
				rooms[roomId] = joined.room
				socket.join(roomId)
				socket.emit('message', { action: ON_JOIN, data: joined })
				console.log('player joined to room', roomId)
				break
				
			case HOST:
				roomId = data
				socket.join(roomId)
				console.log('host joined to room', roomId)
				break
				
			default:
				if (roomId) io.sockets.in(roomId).emit('message', message)
		}
		
		const epoch = (new Date).getTime()
		await db.update(roomId + '_' + epoch, message)
	}))
	
	socket.on('restart', data => {
		require('child_process').exec('kill -HUP ' +  process.pid)
	})
})

const PORT = process.env.WS_DEVELOPMENT_PORT || 1337
server.listen(PORT)

global.window = null

console.log('Development server is listening on', PORT)