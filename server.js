const Koa = require('koa')
let app = new Koa()
const serve = require('koa-static')
let router = require('koa-router')()
var bodyParser = require('koa-bodyparser')
var cors = require('kcors')
var PF = require('pathfinding')
const IO = require('koa-socket')
const io = new IO()
const client = require('socket.io-client')
const PORT = process.env.PORT || 1337
import { game } from './src/js/shared/game'

app.use(bodyParser())
app.use(cors())
app.use(router.routes())
app.use(serve('./public'), { hidden: true })

io.attach(app)

io.on('connection', context => {
	console.log('new connection')
	context.socket.emit('message',  { action: 'connect' })
})

io.on('message', (context, data) => {
	console.log(data)
	io.broadcast('message', data)
})

app.listen(PORT)

console.log('Server is listening on', PORT + '.')

global.window = null
game(client, PF, '/')