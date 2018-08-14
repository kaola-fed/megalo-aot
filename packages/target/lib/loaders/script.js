const path = require( 'path' )
const babel = require( 'babel-core' )
const extractComponentsPlugin = require( '../babel-plugins/extract-components' )
const resolveSource = require( '../utils/resolveSource' )
const hashify = require( '../utils/hashify' )

module.exports = function ( source ) {
  const loaderContext = this
  const callback = loaderContext.async()

  const ast = babel.transform( source, {
    extends: path.resolve( process.cwd(), '.babelrc' ),
    plugins: [
      extractComponentsPlugin
    ]
  } )

  const components = ast.metadata.megaloComponents || {}

  const tmp = {}

  Promise.all(
    Object.keys( components ).map( key => {
      const source = components[ key ]
      return resolveSource.call( this, source )
        .then( resolved => {
          const hashed = hashify( resolved )
          tmp[ key ] = {
            name: hashed,
            src: hashed
          }
        } )
    } )
  ).then( () => {
    const compilerOptions = {
      name: hashify( loaderContext.resourcePath ),
      imports: tmp,
    }

    loaderContext.megaloCacheToAllCompilerOptions(
      loaderContext.resourcePath,
      compilerOptions
    )

    callback( null, source )
  }, e => {
    callback( e, source )
  } )
}
