const attachModuleToOptions = require('../../shared/attachModuleToOptions');

module.exports = function ( { source, compiler, compilerOptions } ) {
  attachModuleToOptions(compilerOptions)

  return compiler.compileToTemplate(
    source,
    compilerOptions
  )
}
