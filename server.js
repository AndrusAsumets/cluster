const Koa = require('koa')
let app = new Koa()
const serve = require('koa-static')
let router = require('koa-router')()
var bodyParser = require('koa-bodyparser')
var cors = require('kcors')
var timesyncServer = require('timesync/server')
const IO = require('koa-socket')
const io = new IO()
const PORT = 1337
import { game } from './src/js/shared/game'


app.use(bodyParser())
app.use(cors())
app.use(router.routes())
app.use(serve('./public'), { hidden: true })

io.attach(app)

io.on('connection', context => {
	console.log('new connection')
	context.socket.emit('message', { action: 'CONNECT' })
})

io.on('message', (context, data) => {
	console.log(data)
	io.broadcast('message', data)	
})

app.listen(PORT)

/*
var express = require('express')
var server = express()

server.use(express.static('public'))
server.use('/timesync', timesyncServer.requestHandler)
server.listen(8081)
*/

global.window = null
game()