const path = require( 'path' )
const webpack = require( 'webpack' )
const CopyWebpackPlugin = require( 'copy-webpack-plugin' )
const normalizeCompiler = require( './utils/normalizeCompiler' )

const exts = {
  wechat: {
    xml: 'wxml',
    css: 'wxss'
  },
  alipay: {
    xml: 'axml',
    css: 'acss'
  },
  swan: {
    xml: 'swan',
    css: 'css'
  }
}

function createMegaloTarget( options = {} ) {
  options = normalizeOptions( options )

  const { platform = 'wechat', htmlParse } = options

  const FrameworkPlugins = [
    require( './frameworks/vue/plugin' ),
    require( './frameworks/regular/plugin' )
  ]

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
    FrameworkPlugins.forEach( Plugin => new Plugin( options ).apply( compiler ) )

    const { xml, css } = exts[ platform ] || exts.wechat

    if (htmlParse) {
      new CopyWebpackPlugin([
        {
          from: path.resolve(htmlParse.src, `index.${xml}`),
          to: path.resolve(output.path, 'htmlparse')
        },
        {
          from: path.resolve(htmlParse.src, `index.${css}`),
          to: path.resolve(output.path, 'htmlparse')
        }
      ]).apply( compiler )
    }
  }
}

function normalizeOptions( options = {} ) {
  return Object.assign( {}, options, {
    compiler: normalizeCompiler( options.compiler || {} )
  } )
}

module.exports = createMegaloTarget
