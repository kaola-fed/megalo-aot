const FrameworkPlugin = require( '../../shared/plugin' )

class RegularPlugin {
  constructor( options = {} ) {
    this.options = options
  }

  apply( compiler ) {
    const options = this.options || {}
    const hasCompiler = !!options.compiler

    new FrameworkPlugin(
      Object.assign( this.options, {
        sfcFiles: [ 'foo.rgl', 'foo.rgl.html' ],
        pitcherQuery: [ '?rgl&' ],
        frameworkLoaderRegexp: /^@megalo\/regular-loader|(\/|\\|@)@megalo\/regular-loader/,
        pitcherLoader: require.resolve( '../loader/pitcher' ),
        compiler: ( hasCompiler && options.compiler.regular ) ?
          options.compiler.regular :
          require( '@megalo/regular-template-compiler' )
      } )
    ).apply( compiler )
  }
}

module.exports = RegularPlugin
