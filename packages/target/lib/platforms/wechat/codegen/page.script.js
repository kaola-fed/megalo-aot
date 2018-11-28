const relativeToRoot = require( '../../shared/utils/relativeToRoot' )

module.exports = function ( { file, files = {}, root } = {} ) {
  const split = files.split.js || []
  const main = files.main.js || []
  const rootReg = root!== '.' ? RegExp(`(^|.*/)${root}/(pages/)`) : null,
        isSubPackage = !!rootReg && rootReg.test(file),
        _file = isSubPackage ? file.replace( rootReg, '$1$2') : file
  return split
    .concat( main )
    .map( j => {
      const isSubSource = !!rootReg && rootReg.test(j)
      return `require('${ relativeToRoot( isSubSource ? _file : file ) }${ isSubPackage && isSubSource ? j.replace( rootReg, '$1$2') : j}')`
    })
    .join( '\n' )
}
