const webpack = require( 'webpack' )
const chalk = require('chalk')
const normalizeCompiler = require( './utils/normalizeCompiler' )

function createMegaloTarget( options = {} ) {
  options = normalizeOptions( options )

  const { platform = 'wechat', htmlParse } = options

  return function ( compiler ) {
    const FunctionModulePlugin = require( 'webpack/lib/FunctionModulePlugin' )
    const JsonpTemplatePlugin = require( 'webpack/lib/web/JsonpTemplatePlugin' )
    const LoaderTargetPlugin = webpack.LoaderTargetPlugin
    const MultiPlatformResolver = require( './plugins/MultiPlatformResolver' )
    const MegaloPlugin = require( './plugins/MegaloPlugin' )
    const CopyHtmlparsePlugin = require( './plugins/CopyHtmlparsePlugin' )
    const FrameworkPlugins = [
      require( './frameworks/vue/plugin' ),
      require( './frameworks/regular/plugin' )
    ]

    // add to webpack resolve.plugins in order to resolve multi-platform js module
    !compiler.options.resolve.plugins && (compiler.options.resolve.plugins = []);
    compiler.options.resolve.plugins.push(new MultiPlatformResolver(platform));
    
    // require multi-platform module like a directory
    const mainFiles = ['index', `index.${platform}`, 'index.default'];
    const extensions = ['.vue', '.js', '.json'];
    
    compiler.options.resolve.mainFiles = getConcatedArray(compiler.options.resolve.mainFiles, mainFiles);
    compiler.options.resolve.extensions = getConcatedArray(compiler.options.resolve.extensions, extensions);

    compiler.options.resolve.mainFiles.length > mainFiles.length && console.log(chalk.yellow('warning') + " megalo modified your webpack config " + chalk.bgBlue("resolve.mainFiles") + ", contact us if any problem occurred");

    new FunctionModulePlugin().apply( compiler )
    new JsonpTemplatePlugin().apply( compiler )
    new LoaderTargetPlugin( 'mp-' + platform ).apply( compiler )
    new MegaloPlugin( options ).apply( compiler )
    FrameworkPlugins.forEach( Plugin => new Plugin( options ).apply( compiler ) )

    if ( !!htmlParse ) {
      new CopyHtmlparsePlugin( { htmlParse, platform } ).apply( compiler )
    }
  }
}

function normalizeOptions( options = {} ) {
  return Object.assign( {}, options, {
    compiler: normalizeCompiler( options.compiler || {} )
  } )
}

function getConcatedArray (source, target) {
  if (!source) {
    return target;
  }

  return [...new Set(source.concat(target))]
}

module.exports = createMegaloTarget
