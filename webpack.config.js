const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV === 'production';


const stylesHandler = MiniCssExtractPlugin.loader;

const config = {
  entry: "./src/index.js",
  resolve: {
    extensions: [".js", ".jsx", ".json"],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    open: true,
    host: "localhost",
    static: {
      directory: path.join(__dirname, "public"), // Serve files from the 'public' directory
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "index.html",
    }),

    new MiniCssExtractPlugin(),

    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/i,
        loader: "babel-loader",
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, "css-loader"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },

      {
        test: /\.html$/i,
        use: ["html-loader"],
      },
      {
        test: /\.(wav|mp3|ogg)$/i,
        type: 'asset/resource', 
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
};

module.exports = () => {
    if (isProduction) {
        config.mode = 'production';
        
        
    } else {
        config.mode = 'development';
    }
    return config;
};
