const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
	mode: 'development',
	entry: './src/index.ts',
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/
			},
			{
				test: /\.csv$/,
				use: 'asset/resource'
			}
		]
	},
	devServer: {
		static: './dist'
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js']
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './src/index.html'
		}),
		new CopyPlugin({
			patterns: [{ from: 'data', to: 'data' }]
		}),
		new webpack.SourceMapDevToolPlugin({
			filename: '[file].map',
			fallbackModuleFilenameTemplate: '[absolute-resource-path]',
			moduleFilenameTemplate: '[absolute-resource-path]'
		})
	],
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
		clean: true
	}
};
