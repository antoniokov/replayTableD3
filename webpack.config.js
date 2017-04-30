const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const config = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: 'replay-table.min.js'
  },
  module: {
    rules: [
      {test: /\.(js|jsx)$/, exclude: /node_modules/, use: 'babel-loader'},
      {test: /\.css$/, use: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })}
    ]
  },
  externals: {
    d3: 'd3'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin(),
    new HtmlWebpackPlugin({template: './index.html'}),
    new ExtractTextPlugin("replay-table.css"),
    new webpack.DefinePlugin({'process.env': {NODE_ENV: JSON.stringify('production')}})
  ]
};

module.exports = config;
