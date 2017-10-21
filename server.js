require('dotenv').config()

var compression = require('compression')
var express = require('express')
const app = express()
app.use(compression())
app.use(express.static('build'))
app.use(express.static('public'))
var server = require('http').Server(app)

// ws
var io = require('socket.io')(server)

// database
import { Database } from './src/js/backend/database'
const db = new Database('http://localhost:5984/cluster')

// actions
import { CONNECT, RESTART, JOIN, ON_JOIN, HOST, DISCONNECT } from './src/js/shared/actions'

// match making
import { join } from './src/js/backend/join'
var rooms = {}
var players = {}
const timeout = 45 * 1000
const maxWarnings = 3
const disabledDuration = timeout * 2

// game
global.window = null

io.on('connection', socket => {
	socket.emit('message', { action: CONNECT })
	
	socket.on('message', (async(message) => {
		const epoch = (new Date).getTime()
		const action = message.action
		const data = message.data
		var roomId = message.roomId
		const user = message.user
	
		switch(action) {
			case JOIN:
				const me = data
				
				// see if the player should be temporarily removed from the pool due to inactivty
				if (!players[me]) players[me] = { seen: epoch, warnings: 0 }
				if (players[me] && 'disabled' in players[me]) {
					if (epoch < players[me].disabled) return console.log(me, 'tried to join, but has been temporarily disabled')
					else {
						// enable if disabledDuration has passed
						players[me].seen = epoch
						delete players[me].disabled
						players[me].warnings = 0
					}
				}
				
				const joined = join(rooms, me, socket)
				roomId = joined.room.id
				socket.join(roomId)
				const room = joined.room
				rooms[roomId] = room
				
				const query = joined.side == 'left'
					? { side: 'left', id: joined.room.id, me: me }
					: { side: 'right', id: joined.room.id, me: me }
				socket.emit('message', { action: ON_JOIN, data: query })
				
				
				console.log('player (' + joined.room[query.side].id + ') joined to room (' + roomId + ') ', new Date())
				break
				
			case HOST:
				roomId = data
				socket.join(roomId)
				
				console.log('host joined to room (' + roomId + ')', new Date())
				break
				
			case RESTART:
				require('child_process').exec('kill -HUP ' +  process.pid)
				break
				
			default:
				io.sockets.in(roomId).emit('message', message)
				
				if (user) { // on menu action, reset
					const playerId = user
					const side = rooms[roomId].left.id == user 
						? 'left'
						: 'right'
					players[playerId].seen = epoch
					players[playerId].warnings = 0
					rooms[roomId][side].seen = epoch
				}
		}
		
		const update = await db.update(roomId + '_' + epoch, message)
		if (update.error) console.log('could not update database')
	}))
})

if (process.env.NODE_ENV == 'PRODUCTION') {
	setInterval(() => {
		const epoch = (new Date).getTime()
		
		for (var roomId in rooms) {
			const room = rooms[roomId]
			const maxIdle = timeout
			
			//detect idle
			var leftIdle = room && room.left
				? (() => {
					if (room.left.seen > epoch - maxIdle) return 'left'
					})()
				: false
				
			var rightIdle = room && room.right
				? (() => {
					if (room.right.seen > epoch - maxIdle) return 'right'
					})()
				: false
				
			// add idle warnings based on inactivty
			if (leftIdle && room.right) { // also check for another player, the player might not have joined just yet
				players[room.left.id].warnings++
				if (players[room.left.id].warnings >= maxWarnings) players[room.left.id].disabled = epoch + disabledDuration
			}
			if (rightIdle && room.left){
				players[room.right.id].warnings++
				if (players[room.right.id].warnings >= maxWarnings) players[room.right.id].disabled = epoch + disabledDuration
			}
			
			// remove the room with idle player(s)
			if (leftIdle || rightIdle) {
				delete rooms[roomId]
				if (room.left) room.left.socket.emit('message', { action: DISCONNECT })
				if (room.right) room.right.socket.emit('message', { action: DISCONNECT })
			}
		}
	}, timeout)
}

const PORT = process.env.WS_DEVELOPMENT_PORT || 1337
server.listen(PORT)
console.log('Development server is listening on', PORT)