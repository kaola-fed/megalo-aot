const path = require( 'path' )
const webpack = require( 'webpack' )
const CopyWebpackPlugin = require( 'copy-webpack-plugin' )

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
  const { platform = 'wechat', framework = 'vue', htmlParse } = options
  
  const FrameworkPlugin = framework === 'vue' ?
    require( './frameworks/vue/plugins/VuePlugin' ) :
    require( './frameworks/regular/plugins/RegularPlugin' )

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
    new FrameworkPlugin( options ).apply( compiler )

    const { xml, css } = exts[platform] || exts.wechat;

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

module.exports = createMegaloTarget
