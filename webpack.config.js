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
  resolve: {
    alias: {
      'doodle3d-core': path.resolve(__dirname, devMode ? 'module' : 'lib'),
      'clipper-lib': '@doodle3d/clipper-lib',
      'clipper-js': '@doodle3d/clipper-js',
      'cal': '@doodle3d/cal',
      'touch-events': '@doodle3d/touch-events',
      'potrace-js': '@doodle3d/potrace-js',
      'fill-path': '@doodle3d/fill-path',
      'threejs-export-stl': '@doodle3d/threejs-export-stl',
      'threejs-export-obj': '@doodle3d/threejs-export-obj'
    }
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
        test: /\.(svg|glsl|d3sketch)$/,
        use: {
          loader: 'raw-loader'
        }
      }, {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'TARGET': JSON.stringify(process.env.TARGET)
      }
    }),
    new HTMLWebpackPlugin({
      title: 'Doodle3D Core - Simple example',
      template: require('html-webpack-template'),
      inject: false,
      scripts: appMode ? ['cordova.js'] : null,
      appMountId: 'app'
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
  devtool: "source-map",
  devServer: {
    contentBase: 'dist'
  }
};
