//import InjectPlugin from 'webpack-inject-plugin';

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = merge(common, {
    devtool: 'inline-source-map',
    mode: 'development',
    // plugins: [
    //     new InjectPlugin(() => {
    //         return "const apiBase = 'http://localhost:4200'";
    //     }, {
    //         entryName: 'background'
    //     })
    // ]
    plugins: [
        // apply this plugin only to .ts files - the rest is taken care of
        new webpack.SourceMapDevToolPlugin({
          filename: null,
          exclude: [/node_modules/],
          test: /\.ts($|\?)/i
        })
    ]
});