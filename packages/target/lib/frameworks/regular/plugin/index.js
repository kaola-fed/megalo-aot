const FrameworkPlugin = require( '../../shared/plugin' )

class RegularPlugin {
  constructor( options = {} ) {
    this.options = options
  }

  apply( compiler ) {
    new FrameworkPlugin(
      Object.assign( this.options, {
        sfcFiles: [ 'foo.rgl', 'foo.rgl.html' ],
        pitcherQuery: [ '?rgl&' ],
        frameworkLoaderRegexp: /^@megalo\/regular-loader|(\/|\\|@)@megalo\/regular-loader/,
        pitcherLoader: require.resolve( '../loader/pitcher' ),
        compiler: this.options.compiler || require( '@megalo/regular-template-compiler' )
      } )
    ).apply( compiler )
  }
}

module.exports = RegularPlugin
