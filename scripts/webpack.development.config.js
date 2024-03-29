var path = require('path')
var webpack = require('webpack')

module.exports = function() {
	return {
	    entry: [
	        'babel-polyfill',
	        './client.js'
	    ],
	    output: {
	        path: path.join(__dirname, 'development'),
	        publicPath: '/dev',
	        filename: 'bundle.js'
	    },
	    resolve: {
	        extensions: ['*', '.js']
	    },
	    module: {
	        loaders: [
	            {
	                test: /\.js?$/,
	                loaders: ['babel-loader'],
	                exclude: /node_modules/
	            },
	            {
	                test: /\.css$/,
	                use: ['style-loader', 'css-loader'],
	                exclude: /node_modules/
	            },
	            {
	                test: /\.(png|jpg|jpeg|gif|svg)$/,
	                loader: 'url-loader?limit=10000'
	            },
	            {
	                test: /\.(jpe?g|png|ico|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
	                loader: 'url-loader?limit=10000',
	                query: {
	                    name: '/build/static/media/[name].[ext]'
	                }
	            }
	        ]
	    },
	    plugins: [
	        new webpack.HotModuleReplacementPlugin(),
	        new webpack.DefinePlugin({
	            "process.env": {
	                NODE_ENV: JSON.stringify('development'),
	                WS_SERVER: JSON.stringify(process.env.WS_DEVELOPMENT_SERVER),
	                WS_PORT: JSON.stringify(process.env.WS_DEVELOPMENT_PORT)
	            }
	        })
	    ]
	}
}