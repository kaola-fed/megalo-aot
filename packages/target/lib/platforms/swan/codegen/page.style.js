const relativeToRoot = require( '../../shared/utils/relativeToRoot' )
const constants = require( '../constants' )

module.exports = function ( { file, files = {}, htmlParse = false, root } = {} ) {
  const htmlparse = htmlParse ? [ constants.HTMLPARSE_OUTPUT_PATH.STYLE ] : []
  const split = files.split.style || []
  const main = files.main.style || []
  const rootReg = root!== '.' ? RegExp(`(^|.*/)${root}/(pages/)`) : null,
        isSubPackage = !!rootReg && rootReg.test(file),
        _file = isSubPackage ? file.replace( rootReg, '$1$2') : file

  return htmlparse
    .concat( split )
    .concat( main )
    .map( s => {
      const isSubSource = !!rootReg && rootReg.test(s)
      return `@import "${ relativeToRoot( isSubSource ? _file : file ) }${ isSubPackage && isSubSource ? s.replace( rootReg, '$1$2') : s}";`
    } )
    .join( '\n' )
}
