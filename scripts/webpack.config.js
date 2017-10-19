require('dotenv').config()

var path = require('path')
var webpack = require('webpack')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = function() {
	return {
	    entry: [
	        'babel-polyfill',
	        './client.js'
	    ],
	    output: {
	        path: (__dirname.split('/scripts')[0]),
	        filename: path.join('build', 'bundle.min.js')
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
	            }
	        ]
	    },
	    plugins: [
	    	new ExtractTextPlugin('build/bundle.min.css'),
	        new CopyWebpackPlugin([
	            { from: 'index.production.html', to: 'build/index.html' },
				{ from: 'public', to: 'build/public' }
	        ]),
	        new webpack.DefinePlugin({
	            "process.env": {
	                NODE_ENV: JSON.stringify('production'),
	                WS_SERVER: JSON.stringify(process.env.WS_PRODUCTION_SERVER),
	                WS_PORT: JSON.stringify(process.env.WS_PRODUCTION_PORT)
	            }
	        })
	    ]
	}
}
