const path = require( 'path' )
const babel = require( 'babel-core' )
const extractConfigPlugin = require( '../../../babel-plugins/extract-config' )
const entryComponentPlugin = require( '../../../babel-plugins/entry-component' )
const resolveSource = require( '../../../utils/resolveSource' )
const hashify = require( '../../../utils/hashify' )

module.exports = function ( source ) {
  const loaderContext = this
  const entryHelper = loaderContext.megaloEntryHelper
  const callback = loaderContext.async()

  if ( entryHelper.isEntry( loaderContext.resourcePath ) ) {
    const entryKey = entryHelper.getEntryKey( loaderContext.resourcePath )

    const ast = babel.transform( source, {
      extends: path.resolve( process.cwd(), '.babelrc' ),
      plugins: [
        extractConfigPlugin,
        entryComponentPlugin,
      ]
    } )

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
