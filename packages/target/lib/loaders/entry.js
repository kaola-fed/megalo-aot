const path = require( 'path' )
const semver = require( 'semver' )
const { babel } = require( '../utils/babel' )
const extractConfigPlugin = require( '../babel-plugins/extract-config' )
const entryComponentPlugin = require( '../babel-plugins/entry-component' )
const resolveSource = require( '../utils/resolveSource' )
const hashify = require( '../utils/hashify' )

module.exports = function ( source ) {
  const loaderContext = this
  const entryHelper = loaderContext.megaloEntryHelper
  const callback = loaderContext.async()

  if ( entryHelper.isEntry( loaderContext.resourcePath ) ) {
    const entryKey = entryHelper.getEntryKey( loaderContext.resourcePath )

    const babelOptions = {
      filename: loaderContext.resourcePath,
      plugins: [
        extractConfigPlugin,
        entryComponentPlugin,
      ]
    }

    if ( semver.gt( babel.version, '7.0.0' ) ) {
      babelOptions.rootMode = 'upward'
    }

    const ast = babel.transform( source, babelOptions )

    const megaloConfig = ( ast.metadata.megaloConfig && ast.metadata.megaloConfig.value ) || {}
    const entryComponent = ast.metadata.megaloEntryComponent

    if ( !entryComponent ) {
      callback( new Error( 'Cannot resolve entry component for ' + entryKey ) )
      return
    }

    resolveSource.call( loaderContext, entryComponent )
      .then( resolved => {
        loaderContext.megaloCacheToPages( {
          file: entryKey,
          config: megaloConfig,
          entryComponent: hashify( resolved ),
        } )

        callback( null, source )
      }, e => {
        callback( e )
      } )
  } else {
    callback( null, source )
  }
}
