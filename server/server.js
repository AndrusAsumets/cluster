const Koa = require('koa')
let app = new Koa()
const serve = require('koa-static')
let router = require('koa-router')()
var bodyParser = require('koa-bodyparser')
var cors = require('kcors')
const IO = require('koa-socket')
const io = new IO()
const PORT = process.env.PORT || 1337

app.use(bodyParser())
app.use(cors())
app.use(router.routes())
app.use(serve('./public'), { hidden: true })

io.attach(app)

io.on('connection', context => {
	console.log('new connection')
	
	context.socket.emit('message',  { action: 'connected' })
})

io.on('message', (context, data) => {
	io.broadcast('message', data)
	//context.socket.emit('message',  data)
})

app.listen(PORT)

console.log('Server is listening on', PORT + '.')