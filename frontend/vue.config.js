const { defineConfig } = require("@vue/cli-service");

const webpack = require('webpack');

module.exports = defineConfig({
    // transpileDependencies: [
    //     '@ethersphere/bee-js',
    // ]
    transpileDependencies: true,
    configureWebpack: {
        plugins: [
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
                process: "process/browser",
            }),
            // new webpack.DefinePlugin({
            //   'process': {env: JSON.stringify(env.NODE_ENV)},
            // }),
        ],
        resolve: {
            fallback: {
                // util: require.resolve("util"),
                stream: require.resolve("stream-browserify"),
                crypto: require.resolve("crypto-browserify"),
                https: require.resolve("https-browserify"),
                http: require.resolve("stream-http"),
                os: require.resolve("os-browserify/browser"),
                path: require.resolve("path-browserify")
                // buffer: require.resolve("buffer")
            }
        },
    }
})