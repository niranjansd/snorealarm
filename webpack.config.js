const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
require('dotenv').config();

const appDirectory = path.resolve(__dirname);

// This is needed for webpack to compile JavaScript.
// Many OSS React Native packages are not compiled to ES5 before being published.
const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx)$/,
  include: [
    path.resolve(appDirectory, 'index.web.js'),
    path.resolve(appDirectory, 'App.tsx'),
    path.resolve(appDirectory, 'src'),
    // Include react-native-* packages that need transpiling
    path.resolve(appDirectory, 'node_modules/react-native-vector-icons'),
    path.resolve(appDirectory, 'node_modules/react-native-chart-kit'),
    path.resolve(appDirectory, 'node_modules/react-native-svg'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: ['module:@react-native/babel-preset'],
      plugins: ['react-native-web'],
    },
  },
};

// This is needed for webpack to import static images in JavaScript files.
const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  use: {
    loader: 'url-loader',
    options: {
      name: '[name].[ext]',
      esModule: false,
    },
  },
};

// Font loader for vector icons
const fontLoaderConfiguration = {
  test: /\.ttf$/,
  loader: 'url-loader',
  include: path.resolve(appDirectory, 'node_modules/react-native-vector-icons'),
};

module.exports = {
  entry: path.resolve(appDirectory, 'index.web.js'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(appDirectory, 'dist'),
    publicPath: '/',
  },
  module: {
    rules: [
      babelLoaderConfiguration,
      imageLoaderConfiguration,
      fontLoaderConfiguration,
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(appDirectory, 'web/index.html'),
    }),
    new webpack.DefinePlugin({
      'process.env.REACT_APP_S3_REGION': JSON.stringify(process.env.REACT_APP_S3_REGION || 'us-east-1'),
      'process.env.REACT_APP_S3_BUCKET': JSON.stringify(process.env.REACT_APP_S3_BUCKET || 'eight-ml-scratch'),
      'process.env.REACT_APP_S3_FOLDER': JSON.stringify(process.env.REACT_APP_S3_FOLDER || 'nirsd/snore/audio/snorealarm'),
      'process.env.REACT_APP_S3_ACCESS_KEY': JSON.stringify(process.env.REACT_APP_S3_ACCESS_KEY || ''),
      'process.env.REACT_APP_S3_SECRET_KEY': JSON.stringify(process.env.REACT_APP_S3_SECRET_KEY || ''),
    }),
  ],
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      '@': path.resolve(appDirectory, 'src'),
      // Exclude native-only modules for web
      'react-native-fs': false,
    },
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.js',
      '.tsx',
      '.ts',
      '.js',
    ],
  },
  devServer: {
    static: {
      directory: path.join(appDirectory, 'dist'),
    },
    compress: true,
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
    devMiddleware: {
      publicPath: '/',
    },
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
};
