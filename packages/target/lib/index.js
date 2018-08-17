const webpack = require( 'webpack' )

function createMegaloTarget( options = {} ) {
  const platform = options.platform || 'wechat'

  return function ( compiler ) {
    const compilerOptions = compiler.options || {}
    const FunctionModulePlugin = require( 'webpack/lib/FunctionModulePlugin' )
    const JsonpTemplatePlugin = require( 'webpack/lib/web/JsonpTemplatePlugin' )
    const LoaderTargetPlugin = webpack.LoaderTargetPlugin
    const MegaloPlugin = require( './plugins/MegaloPlugin' )

    new FunctionModulePlugin().apply( compiler )
    new JsonpTemplatePlugin().apply( compiler )
    new LoaderTargetPlugin( 'mp-' + platform ).apply( compiler )
    new MegaloPlugin( options ).apply( compiler )
  }
}

module.exports = createMegaloTarget
