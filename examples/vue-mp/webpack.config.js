const path = require( 'path' )
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const createMegaloTarget = require( '@megalo/target' )
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' )
const compiler = require( '@megalo/template-compiler' )

const octoparseSrc = path.resolve( path.dirname( require.resolve( `octoparse` ) ), 'lib/platform/wechat' )

module.exports = {
  mode: 'development',

  target: createMegaloTarget( {
    compiler: compiler,
    platform: 'wechat',
    htmlParse: {
      templateName: 'octoParse',
      src: octoparseSrc
    }
  } ),

  entry: {
    'app': path.resolve( __dirname, 'src/index.js' ),
    'package/pages/demo/index': path.resolve( __dirname, 'src/package/pages/demo/index.vue' ),
    'pages/counter/index': path.resolve( __dirname, 'src/pages/counter/index.vue' ),
    // 'pages/todomvc/index': path.resolve( __dirname, 'src/pages/todomvc/index.js' ),
  },

  output: {
    path: path.resolve( __dirname, 'dist/' ),
    filename: 'static/js/[name].js',
    chunkFilename: 'static/js/[id].js',
  },

  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all'
        }
      }
    }
  },

  devServer: {
    // hot: true,
  },

  devtool: 'cheap-source-map',

  resolve: {
    extensions: ['.vue', '.js', '.json'],
    alias: {
      'vue': 'megalo',
    },
  },

  module: {
    rules: [
      // ... other rules
      {
        test: /\.vue$/,
        use: [
          {
            loader: 'vue-loader',
            options: {}
          }
        ]
      },

      {
        test: /\.pug$/,
        oneOf: [  // this applies to `<template lang="pug">` in Vue components
          {
            resourceQuery: /^\?vue/,
            use: [ {
              loader: 'pug-plain-loader',
              options: {
                x: 1
              }
            } ],

          }
        ]
      },

      {
        test: /\.js$/,
        use: 'babel-loader'
      },

      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      },

      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'less-loader',
        ]
      },

      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: '[path][name].[ext]'
            }
          }
        ]
      },

    ]
  },

  plugins: [
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin( {
      filename: 'static/css/[name].wxss',
    } ),
  ]
}
