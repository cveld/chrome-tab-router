//import InjectPlugin from 'webpack-inject-plugin';

const merge = require('webpack-merge');
const common = require('./webpack.common.js');

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
});