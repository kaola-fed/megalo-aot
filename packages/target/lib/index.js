const webpack = require( 'webpack' )

function createMegaloTarget( options = {} ) {
  return function ( compiler ) {
    const compilerOptions = compiler.options || {}
    const JsonpTemplatePlugin = require( './plugins/JsonpTemplatePlugin' )
    const FunctionModulePlugin = require( 'webpack/lib/FunctionModulePlugin' )
    const LoaderTargetPlugin = webpack.LoaderTargetPlugin
    const MegaloPlugin = require( './plugins/MegaloPlugin' )

    new FunctionModulePlugin().apply( compiler )
    new JsonpTemplatePlugin().apply( compiler )
    new LoaderTargetPlugin( compilerOptions.target ).apply( compiler )
    new MegaloPlugin( options ).apply( compiler )
  }
}

module.exports = createMegaloTarget
