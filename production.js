require('dotenv').config()

const Koa = require('koa')
const app = new Koa()
const serve = require('koa-static')
const router = require('koa-router')()
const IO = require('koa-socket')
const io = new IO()
const fs = require('fs')
import { game } from './src/js/shared/game'

const PORT = process.env.WS_PRODUCTION_PORT || 1337

app.use(router.routes())
app.use(serve('./build'), { hidden: true })
io.attach(app)

router.get('/',
    async function(context) {
        console.log('./build/index.html')
        context.body = fs.readFileSync('./build/index.html', 'utf8')
    }
)

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

console.log('Production server is listening on', PORT)