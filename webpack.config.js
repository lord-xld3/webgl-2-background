const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
    entry: {
        main: [
            './src/main.js', 
            './src/style.css', 
            './src/img/myself.jpg',
            './src/img/spinny_cow.webp',
            './src/img/mandelbrot.webp',
            './src/img/boundary_tracing.webp',
            './src/img/maf_cal.webp',
            './src/img/portfolio_icon.webp',
        ],
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|gif|webp)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: 'img/[name].[ext]', // Output path for images
                    },
                },
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
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