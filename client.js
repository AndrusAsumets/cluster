var io = require('socket.io-client')
var PF = require('pathfinding')
require('./src/css/app.css')

import { game } from './src/js/shared/game'

game(io)