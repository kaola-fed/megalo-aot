const path = require( 'path' )
const RegularLoaderPlugin = require('@megalo/regular-loader/lib/plugin')
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' )
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {

  mode: 'development',

  entry: path.resolve( __dirname, 'src/index.js' ),

  output: {
    path: path.resolve( __dirname, 'dist/' ),
    filename: '[name].js',
    chunkFilename: '[id].js'
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
    extensions: ['.rgl', '.js', '.json'],
  },

  module: {
    rules: [
      // ... other rules
      {
        test: /\.rgl/,
        use: [
          {
            loader: '@megalo/regular-loader',
            options: {
            }
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
      }
    ]
  },

  plugins: [
    new RegularLoaderPlugin(),
    // new webpack.HotModuleReplacementPlugin(),
    new MiniCssExtractPlugin( {
      filename: '[name].css',
    } ),
    new HtmlWebpackPlugin(),
  ]
}
