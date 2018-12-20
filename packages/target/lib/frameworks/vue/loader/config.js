const path = require( 'path' )
const JSON5 = require( 'json5' )
const toString = Object.prototype.toString

module.exports = function ( source ) {
  const loaderContext = this

  const entryHelper = loaderContext.megaloEntryHelper

  if ( entryHelper.isEntry( loaderContext.resourcePath ) ) {
    const entryKey = entryHelper.getEntryKey( loaderContext.resourcePath )

    let config
    try {
      config = JSON5.parse( source )
      if ( toString.call( config ) !== '[object Object]' ) {
        config = {}
      }
    } catch ( e ) {
      config = {}

      const relativePath = path.relative( process.cwd(), loaderContext.resourcePath )
      const reason = `
[@MEGALO/TARGET] Failed to parse <config> block in ${ relativePath },

<config>
${ source.trim() }
</config>
`
      loaderContext.emitError( new Error( reason ) )
    }

    loaderContext.megaloCacheToPages( {
      file: entryKey,
      config: config,
    } )
  }

  return ''
}
