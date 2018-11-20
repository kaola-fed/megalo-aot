const path = require( 'path' )
const loaderUtils = require( 'loader-utils' )
const hash = require( 'hash-sum' )
const { parse } = require( '@vue/component-compiler-utils' )

module.exports = function ( source ) {
  const loaderContext = this
  const options = loaderUtils.getOptions( loaderContext ) || {}

  const {
    target,
    request,
    minimize,
    sourceMap,
    rootContext,
    resourcePath,
    resourceQuery
  } = loaderContext

  const filename = path.basename( resourcePath )
  const context = rootContext || process.cwd()
  const sourceRoot = path.dirname( path.relative( context, resourcePath ) )

  const descriptor = parse( {
    source,
    compiler: options.compiler,
    filename,
    sourceRoot,
    needMap: false
  } )

  const isProduction = options.productionMode || minimize || process.env.NODE_ENV === 'production'
  const rawShortFilePath = path
    .relative( context, resourcePath )
    .replace( /^(\.\.[\/\\])+/, '' )
  const shortFilePath = rawShortFilePath.replace( /\\/g, '/' ) + resourceQuery

  const id = hash(
    isProduction
      ? ( shortFilePath + '\n' + source )
      : shortFilePath
  )

  // console.log( 'descriptor', descriptor )

  const hasScoped = descriptor.styles.some(s => s.scoped)
  const hasFunctional = descriptor.template && descriptor.template.attrs.functional
  const needsHotReload = false

  return source
}
