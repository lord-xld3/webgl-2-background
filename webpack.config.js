const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

// Crawls for files one level deep (due to output reasons)
function dirCrawler(dir) {
    return fs.readdirSync(dir).map((file) => {
        return `${dir}/${file}`
    });
}

module.exports = {
    entry: {
        main: [
            './src/main.js', 
            './src/style.css', 
            ...dirCrawler('./src/img'),
            ...dirCrawler('./src/shaders'),
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
            {
                test: /\.(glsl|vs|fs|vert|frag)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: 'shaders/[name].[ext]', // Output path for shaders
                    },
                },
            }
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
        minimize: true,
        minimizer: [
            new TerserPlugin(),
            new CssMinimizerPlugin(),
        ],
    },
};
