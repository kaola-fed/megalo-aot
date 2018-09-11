const path = require( 'path' )
const webpack = require( 'webpack' )
const CopyWebpackPlugin = require( 'copy-webpack-plugin' )

function createMegaloTarget( options = {} ) {
  const { platform = 'wechat', htmlParse } = options

  return function ( compiler ) {
    const compilerOptions = compiler.options || {}
    const { output } = compilerOptions
    const FunctionModulePlugin = require( 'webpack/lib/FunctionModulePlugin' )
    const JsonpTemplatePlugin = require( 'webpack/lib/web/JsonpTemplatePlugin' )
    const LoaderTargetPlugin = webpack.LoaderTargetPlugin
    const MegaloPlugin = require( './plugins/MegaloPlugin' )

    new FunctionModulePlugin().apply( compiler )
    new JsonpTemplatePlugin().apply( compiler )
    new LoaderTargetPlugin( 'mp-' + platform ).apply( compiler )
    new MegaloPlugin( options ).apply( compiler )

    if (htmlParse) {
      new CopyWebpackPlugin([
        {
          from: path.resolve(htmlParse.src, 'index.wxml'),
          to: path.resolve(output.path, 'htmlparse')
        },
        {
          from: path.resolve(htmlParse.src, 'index.wxss'),
          to: path.resolve(output.path, 'htmlparse')
        }
      ]).apply( compiler )
    }
  }
}

module.exports = createMegaloTarget
