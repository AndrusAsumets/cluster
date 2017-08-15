var webpack = require('webpack')
var webpackDev = require('webpack-dev-server')

const PORT = 3000
const HOST = '0.0.0.0'
const config = require('./webpack.development.config.js')(HOST)

new webpackDev(webpack(config), {
    publicPath: config.output.publicPath,
    contentBase: './',
    hot: true,
    historyApiFallback: true,
    watchOptions: {
        aggregateTimeout: 300,
        poll: 1000
    },
    public: HOST + ':' + PORT
}).listen(PORT, HOST, function(err) {
    if (err) return console.log(err)

    console.log('Started application at: ' + HOST + ':' + PORT)
})