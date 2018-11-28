const relativeToRoot = require( '../../shared/utils/relativeToRoot' )

const fixGlobalSnippet = `
if (!my.__megalo) {
  my.__megalo = {
    App: App,
  }
}
`

module.exports = function ( { file, files = {}, root } = {} ) {
  const split = files.split.js || []
  const main = files.main.js || []
  const rootReg = root!== '.' ? RegExp(`(^|.*/)${root}/(pages/)`) : null,
        isSubPackage = !!rootReg && rootReg.test(file),
        _file = isSubPackage ? file.replace( rootReg, '$1$2') : file

  const res = split
    .concat( main )
    .map( j => {
      const isSubSource = !!rootReg && rootReg.test(j)
      return `require('${ relativeToRoot( isSubSource ? _file : file ) }${ isSubPackage && isSubSource ? j.replace( rootReg, '$1$2') : j}')`
    })
  
  res.unshift(fixGlobalSnippet)
  return res.join( '\n' )
}
