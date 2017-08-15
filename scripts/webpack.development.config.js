var path = require('path')
var webpack = require('webpack')

module.exports = function(ip) {
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
	            }
	        ]
	    },
	    plugins: [
	        new webpack.DefinePlugin({
	            "process.env": {
	                NODE_ENV: JSON.stringify('development')
	            }
	        }),
	        new webpack.HotModuleReplacementPlugin()
	    ]
	}
}