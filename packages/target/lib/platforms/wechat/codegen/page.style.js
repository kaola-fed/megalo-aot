const relativeToRoot = require( '../../shared/utils/relativeToRoot' )

module.exports = function ( { file, files = {}, htmlParse, htmlParsePaths = {} } = {} ) {
  let htmlparse = htmlParse ? [ htmlParsePaths.style ] : []
  let split = files.split.style || []
  const main = files.main.style || []

  // the common style and htmparse style are repeated in the page
  if (file !== 'app') {
    htmlparse = []
    split = []
  }

  return htmlparse
    .concat( split )
    .concat( main )
    .map( s => `@import "${ relativeToRoot( file ) }${ s }"` )
    .join( ';\n' )
}
