const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "src");

module.exports = {
    entry: {
      //popup: path.join(srcDir, 'Popup/popup.tsx'),
      options: path.join(srcDir, 'options.tsx'),
      background: path.join(srcDir, 'Background/background.ts'),
      content_script: path.join(srcDir, 'Content/content_script.tsx'),
    },
    optimization: {
        splitChunks: {
            name: "vendor",
            chunks: "initial",
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: [/node_modules/, /popup/],
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"]        
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: ".", to: "../", context: "public" }],
            options: {},
        }),
    ],
};
