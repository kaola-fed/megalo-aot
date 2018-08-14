const relativeToRoot = require( '../utils/relativeToRoot' )

module.exports = function ( { file, files = {} } = {} ) {
  return files.split.style
    .concat( files.main.style )
    .map( s => `@import "${ relativeToRoot( file ) }${ s }"` )
    .join( '\n' )
}
