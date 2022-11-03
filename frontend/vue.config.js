const { defineConfig } = require("@vue/cli-service");

const webpack = require('webpack');

module.exports = defineConfig({
    transpileDependencies: true,
    configureWebpack: {
        plugins: [
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
                process: "process/browser",
            }),
        ],
        resolve: {
            fallback: {
                stream: require.resolve("stream-browserify"),
                crypto: require.resolve("crypto-browserify"),
                https: require.resolve("https-browserify"),
                http: require.resolve("stream-http"),
                os: require.resolve("os-browserify/browser"),
                path: require.resolve("path-browserify")
            }
        },
    }
})