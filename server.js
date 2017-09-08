const Koa = require('koa')
const app = new Koa()
const serve = require('koa-static')
const router = require('koa-router')()
const IO = require('koa-socket')
const io = new IO()
import { game } from './src/js/shared/game'

const PORT = 1337

app.use(router.routes())
app.use(serve('./public'), { hidden: true })
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