const webpack = require("webpack");
const path = require("path");
//const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "");

module.exports = {
    target: 'node',
    entry: {
      groupcode: path.join(srcDir, 'groupcode/index.ts'),
      messages: path.join(srcDir, 'messages/index.ts'),
      negotiate: path.join(srcDir, 'negotiate/index.ts')    
    },
    output: {
        libraryTarget: 'commonjs',
        path: path.join(__dirname, "../dist/js"),
        filename: "[name].js",
        // webpack's default (md4) is unavailable on Node 17+. Use a digest
        // that ships with Node's crypto so no legacy OpenSSL flag is needed.
        hashFunction: "sha256",
    },
    optimization: {
        // splitChunks: {
        //     name: "vendor",
        //     chunks: "initial",
        // },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    plugins: [
        // new CopyPlugin({
        //     patterns: [{ from: ".", to: "../", context: "public" }],
        //     options: {},
        // }),
    ],
};
