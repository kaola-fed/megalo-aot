const relativeToRoot = require( '../../shared/utils/relativeToRoot' )
const constants = require( '../constants' )

module.exports = function ( { file, files = {}, htmlParse = false } = {} ) {
  const htmlparse = htmlParse ? [ constants.HTMLPARSE_OUTPUT_PATH.STYLE ] : []
  const split = files.split.style || []
  const main = files.main.style || []

  return htmlparse
    .concat( split )
    .concat( main )
    .map( s => `@import "${ relativeToRoot( file ) }${ s }";` )
    .join( '\n' )
}
