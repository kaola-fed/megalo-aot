const path = require( 'path' )
const extractCompilerOptionsFromScriptSource =
  require( '../../shared/utils/extractCompilerOptionsFromScriptSource' )
const removeExtension = require( '../../../utils/removeExtension' )

module.exports = function ( source ) {
  const loaderContext = this
  const callback = loaderContext.async()

  const ext = path.extname(loaderContext.resourcePath)
  let realResourcePath = removeExtension( loaderContext.resourcePath, ext )
  realResourcePath = /.vue$/.test(realResourcePath) ? realResourcePath : `${realResourcePath}.vue`

  extractCompilerOptionsFromScriptSource( source, loaderContext )
    .then( compilerOptions => {
      loaderContext.megaloCacheToAllCompilerOptions(
        realResourcePath,
        compilerOptions,
      )
      callback( null, source )
    } )
    .catch( e => {
      callback( e, source )
    } )
}