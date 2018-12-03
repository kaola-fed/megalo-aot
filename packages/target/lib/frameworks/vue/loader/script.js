const path = require( 'path' )
const extractCompilerOptionsFromScriptSource =
  require( '../../shared/utils/extractCompilerOptionsFromScriptSource' )
const extractPageFromScriptSource =
  require( '../../shared/utils/extractPageFromScriptSource' )
const removeExtension = require( '../../../utils/removeExtension' )
const extractComponentsPlugin = require( '../babel-plugins/extract-components' )

module.exports = function ( source ) {
  const loaderContext = this
  const callback = loaderContext.async()
  const realResourcePath = removeExtension( loaderContext.resourcePath, '.js' )

  const jobs = [
    extractCompilerOptionsFromScriptSource( source, extractComponentsPlugin, loaderContext ),
    extractPageFromScriptSource( source, loaderContext ),
  ]

  Promise.all( jobs )
    .then( data => {
      const [ compilerOptions, page ] = data || []

      loaderContext.megaloCacheToAllCompilerOptions(
        realResourcePath,
        compilerOptions,
      )

      if ( page ) {
        loaderContext.megaloCacheToPages( page )
      }

      callback( null, source )
    } )
    .catch( e => {
      callback( e, source )
    } )
}
