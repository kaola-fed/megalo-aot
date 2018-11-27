const { parseComponent } = require( 'vue-template-compiler' )
const compileToTemplate = require( './lib' )
const compile = require( './compile' )
const compileMP = require( './compileMP' )

module.exports = {
  parseComponent, // for sfc
  compile, // for web
  compileMP, // for mp (runtime ast + expressions)
  compileToTemplate, // for mp (emit files)
}
