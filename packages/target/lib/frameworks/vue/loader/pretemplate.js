const loaderUtils = require( 'loader-utils' )

module.exports = function ( data ) {
  const loaderContext = this
  const callback = loaderContext.async()

  const options = loaderUtils.getOptions( loaderContext ) || {}
  const { resourcePath, resourceQuery, loaders } = options

  // note:
  // resourcePath should use absolute path here
  // so we should not use `utils/generateRequest`
  const request = '-!' + [
    require.resolve( './stringify' ),
    ...loaders,
    require.resolve( './select-template' ),
  ].join( '!' ) + '!' + resourcePath + resourceQuery

  loaderContext.loadModule( request, function ( err, source, map, mod ) {
    if ( err ) {
      return callback( err )
    }

    try {
      data.template.content = JSON.parse( source )
    } catch ( e ) {
      loaderContext.emitError( e )
    }

    callback( null, data )
  } )
}
