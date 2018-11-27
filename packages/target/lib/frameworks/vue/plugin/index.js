const FrameworkPlugin = require( '../../shared/plugin' )

class VuePlugin {
  constructor( options = {} ) {
    this.options = options
  }

  apply( compiler ) {
    new FrameworkPlugin(
      Object.assign( this.options, {
        sfcFiles: [ 'foo.vue', 'foo.vue.html' ],
        pitcherQuery: [ '?vue&' ],
        frameworkLoaderRegexp: /^vue-loader|(\/|\\|@)vue-loader/,
        pitcherLoader: require.resolve( '../loader/pitcher' ),
        compiler: this.options.compiler || require( '@megalo/template-compiler' )
      } )
    ).apply( compiler )
  }
}

module.exports = VuePlugin
