const relativeToRoot = require( '../utils/relativeToRoot' )

module.exports = function ( { file, files = {} } = {} ) {
  return files.split.js
    .concat( files.main.js )
    .map( j => `require('${ relativeToRoot( file ) }${ j }')` )
    .join( '\n' )
}
