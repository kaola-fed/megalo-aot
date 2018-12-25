const path = require( 'path' )
const qs = require( 'qs' )
const loaderUtils = require( 'loader-utils' )
const JSON5 = require( 'json5' )
const yaml = require( 'js-yaml' )
const toString = Object.prototype.toString

module.exports = function ( source ) {
  const loaderContext = this
  const entryHelper = loaderContext.megaloEntryHelper
  const resourcePath = loaderContext.resourcePath
  const query = qs.parse( loaderContext.resourceQuery.slice( 1 ) ) || {}
  const lang = query.lang || 'json'

  if ( entryHelper.isEntry( loaderContext.resourcePath ) ) {
    parseConfig( {
      source,
      lang,
      filepath: resourcePath,
    }, function ( e, config ) { // sync callback
      if ( e ) {
        loaderContext.emitError( getParseError( e, source, resourcePath ) )
        return
      }

      const entryKey = entryHelper.getEntryKey( loaderContext.resourcePath )

      loaderContext.megaloCacheToPages( {
        file: entryKey,
        config: config,
      } )
    } )
  }

  return ''
}

function getParseError( e, source, resourcePath ) {
  const relativePath = path.relative( process.cwd(), resourcePath )
  const reason = `
[@MEGALO/TARGET] Failed to parse <config> block in ${ relativePath },

<config>
${ source.trim() }
</config>

Details: ${ e.message }
`

  return new Error( reason )
}

const handlers = {
  json( { source, filepath } = {} ) {
    return JSON5.parse( source )
  },

  yaml( { source, filepath } = {} ) {
    return yaml.safeLoad( source, {
      filename: filepath,
      json: true,
    } )
  },
}

function parseConfig( { source, lang, filepath } = {}, callback ) {
  const normalizeMap = {
    json: 'json',
    json5: 'json',
    yaml: 'yaml',
    yml: 'yaml',
  }

  const normalizedLang = normalizeMap[ lang ]

  const handler = handlers[ normalizedLang ]

  if ( !handler ) {
    return callback( new Error(
      'Invalid lang for config block: "' + lang + '", ' +
      'consider using "json" or "yaml"'
    ) )
  }

  let config
  try {
    config = handler( {
      source,
      filepath,
    } )

    if ( toString.call( config ) !== '[object Object]' ) {
      config = {}
    }

    callback( null, config )
  } catch ( e ) {
    callback( e )
  }
}
