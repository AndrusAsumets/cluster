require('dotenv').config()

const Koa = require('koa')
const app = new Koa()
const IO = require('koa-socket')
const io = new IO()
import { game } from './src/js/shared/game'

const PORT = process.env.WS_DEVELOPMENT_PORT || 1337

io.attach(app)

io.on('connection', context => {
	console.log('new ws client')
	context.socket.emit('message', { action: 'CONNECT' })
})

io.on('message', (context, data) => {
	console.log(data)
	io.broadcast('message', data)	
})

app.listen(PORT)

global.window = null
game()

console.log('Development server is listening on', PORT)