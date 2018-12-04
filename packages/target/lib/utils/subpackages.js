const path = require( 'path' )

function findSubpackage( filepath, subpackages ) {
  // fix windows path
  filepath = filepath.replace( /\\/g, '/' )

  return subpackages.find( pkg => {
    const root = pkg.root || ''
    const pages = pkg.pages || []
    const fullpaths = pages.map( page => {
      // TODO: pkg.root + '/' is not the best way to detect
      return pkg.root + '/'
    } ).filter( Boolean )

    if ( fullpaths.length === 0 ) {
      return false
    }

    const inSubpackage = new RegExp( fullpaths.join( '|' ) )

    if ( inSubpackage.test( filepath ) ) {
      return true
    }
  } )
}

module.exports = { findSubpackage }
