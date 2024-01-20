const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const parentDir = path.resolve(__dirname, '..');

module.exports = {
    entry: {
        main: [
            './main.ts', 
            './style.css', 
            ...fs.readdirSync('./img').map(file => `./img/${file}`),
            ...fs.readdirSync('./shaders').map(file => `./shaders/${file}`)
        ],
    },
    output: {
        filename: 'main.js',
        path: path.resolve(parentDir, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: [
                    {loader: 'ts-loader'},
                    {loader: 'ifdef-loader', options: {
                        DEBUG: true,
                        'ifdef-verbose': true,
                    }},
                ],
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|gif|webp|frag|vert)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]',
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html',
            minify: {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
            },
        }),
        new MiniCssExtractPlugin({
            filename: 'style.css', // Specify the name for the generated CSS file
        }),
    ],
    optimization: {
        minimizer: [
            new TerserPlugin(),
            new CssMinimizerPlugin(),
        ],
    },
};
