const toAsset = require( './toAsset' )

module.exports = function emitFile( filepath, source, compilation ) {
  compilation.assets[ filepath ] = toAsset( source )
}
