require('dotenv').config()

const Koa = require('koa')
const app = new Koa()
const serve = require('koa-static')
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

io.on('restart', (context, data) => {
	require('child_process').exec('kill -HUP ' +  process.pid)
})

app.use(serve('./public'), { hidden: true })
app.listen(PORT)

global.window = null
game()

console.log('Development server is listening on', PORT)