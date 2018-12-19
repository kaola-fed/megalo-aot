const path = require( 'path' )
const RegularLoaderPlugin = require('@megalo/regular-loader/lib/plugin')
const createMegaloTarget = require( '@megalo/target' )
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' )
const compiler = require( '@megalo/regular-template-compiler' )

module.exports = {

  mode: 'development',

  target: createMegaloTarget( {
    compiler: {
      regular: compiler
    },
    platform: 'wechat',
    htmlParse: {
      templateName: 'octoParse',
      src: path.resolve(
        path.dirname( require.resolve( 'octoparse' ) ),
        'lib/platform/wechat'
      ),
    }
  } ),

  entry: {
    'app': path.resolve( __dirname, 'src/index.js' ),
    'package/pages/demo/index': path.resolve( __dirname, 'src/package/pages/demo/index.js' ),
    'pages/counter/index': path.resolve( __dirname, 'src/pages/counter/index.js' ),
  },

  output: {
    path: path.resolve( __dirname, 'dist/' ),
    filename: 'static/js/[name].js',
    chunkFilename: 'static/js/[id].js'
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
    alias: {
      'regularjs': 'mpregular',
    },
  },

  module: {
    rules: [
      // ... other rules
      {
        test: /\.rgl/,
        use: [
          {
            loader: '@megalo/regular-loader',
            options: {}
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
    new MiniCssExtractPlugin( {
      filename: 'static/css/[name].wxss',
    } ),
  ]
}
