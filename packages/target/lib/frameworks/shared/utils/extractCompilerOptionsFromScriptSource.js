const path = require( 'path' )
const semver = require( 'semver' )
const { babel } = require( '../../../utils/babel' )
const extractComponentsPlugin = require( '../../../babel-plugins/extract-components' )
const resolveSource = require( '../../../utils/resolveSource' )
const hashify = require( '../../../utils/hashify' )
const removeExtension = require( '../../../utils/removeExtension' )

module.exports = function( source, loaderContext ) {
  const babelOptions = {
    filename: loaderContext.resourcePath,
    plugins: [
      extractComponentsPlugin
    ]
  }

  const ast = babel.transform( source, babelOptions )

  const components = ast.metadata.megaloComponents || {}

  const tmp = {}

  return Promise.all(
    Object.keys( components ).map( key => {
      const source = components[ key ]
      return resolveSource.call( loaderContext, source )
        .then( resolved => {
          const hashed = hashify( resolved )
          tmp[ key ] = {
            name: hashed,
            src: hashed
          }
        } )
    } )
  ).then( () => {
    const ext = path.extname(loaderContext.resourcePath)
    let realResourcePath = removeExtension( loaderContext.resourcePath, ext )
    realResourcePath = /.rgl$/.test(realResourcePath) ? realResourcePath : `${realResourcePath}.rgl`
    const compilerOptions = {
      name: hashify( realResourcePath ),
      imports: tmp,
      components: tmp,
    }

    return compilerOptions
  } )
}
