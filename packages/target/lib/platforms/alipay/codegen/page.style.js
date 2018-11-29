const relativeToRoot = require( '../../shared/utils/relativeToRoot' )

module.exports = function ( { file, files = {}, constants, extensions, htmlParse = false } = {} ) {
  const htmlparse = htmlParse ? [ constants.HTMLPARSE_STYLE_OUTPUT_PATH + extensions.style ] : []
  const split = files.split.style || []
  const main = files.main.style || []

  return htmlparse
    .concat( split )
    .concat( main )
    .map( s => `@import "${ relativeToRoot( file ) }${ s }";` )
    .join( '\n' )
}
