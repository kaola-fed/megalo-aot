const Compiler = require( './compiler' )

const cp = new Compiler()

function compile( template, options = {} ) {
  return cp.compile( template, options )
}

module.exports = compile
