const toString = Object.prototype.toString

module.exports = function ( source ) {
  const loaderContext = this

  const entryHelper = loaderContext.megaloEntryHelper

  if ( entryHelper.isEntry( loaderContext.resourcePath ) ) {
    const entryKey = entryHelper.getEntryKey( loaderContext.resourcePath )

    let config
    try {
      config = JSON.parse( source )
      if ( toString.call( config ) !== '[object Object]' ) {
        config = {}
      }
    } catch ( e ) {
      config = {}
    }

    loaderContext.megaloCacheToPages( {
      file: entryKey,
      config: config,
    } )
  }

  return ''
}
