const compiler = require( 'vue-template-compiler' )
const template = require( './template' )

module.exports = {
  parseComponent: compiler.parseComponent,
  compile: template,
}
