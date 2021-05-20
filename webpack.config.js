const webpack = require('webpack');
const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HTMLWebpackPlugin = require('html-webpack-plugin');
const CordovaPlugin = require('webpack-cordova-plugin');

const devMode = process.env.NODE_ENV !== 'production';
const appMode = process.env.TARGET === 'app';

const babelLoader = {
  loader: 'babel-loader',
  options: {
    presets: [
      require('babel-preset-env'),
      require('babel-preset-react')
    ],
    plugins: [
      require('babel-plugin-transform-object-rest-spread'),
      require('babel-plugin-transform-class-properties'),
      require('babel-plugin-transform-runtime')
    ],
    babelrc: false
  }
};

module.exports = {
  entry: './index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules:  [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: babelLoader
      }, { // make THREE global available to three.js examples
        test: /three\/examples\/.+\.js/,
        use: 'imports-loader?THREE=three'
      }, {
        test: /\.yml$/,
        use: 'yml-loader'
      }, {
        test: /\.worker.js$/,
        use: ['worker-loader', babelLoader]
      }, {
        test: /\.(png|jpg|gif)$/,
        use: {
          loader: 'url-loader?name=images/[name].[ext]'
        }
      }, {
        test: /\.(svg|glsl|d3sketch|doodle3d)$/,
        use: {
          loader: 'raw-loader'
        }
      }, {
        test: /\.(woff)$/,
        use: {
          loader: 'file-loader'
        }
      }, {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.TARGET': JSON.stringify(process.env.TARGET)
    }),
    new HTMLWebpackPlugin({
      title: 'Doodle3D Core - Simple example',
      favicon: './favicon.ico',
      template: require('html-webpack-template'),
      inject: false,
      mobile: false,
      scripts: appMode ? ['cordova.js'] : null,
      appMountId: 'app',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, minimal-ui, user-scalable=no' }
      ]
    }),
    ...(appMode ? [
      new CordovaPlugin({
        config: 'config.xml',
        src: 'index.html',
        platform: 'ios',
        version: true
      })
    ] : [])
  ],
  devtool: 'source-map',
  devServer: {
    contentBase: 'dist'
  }
};
