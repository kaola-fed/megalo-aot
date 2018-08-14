const json = require( './codegen/json' )
const style = require( './codegen/style' )
const template = require( './codegen/template' )
const js = require( './codegen/js' )
const emitFile = require( '../../utils/emitFile' )

module.exports = function (
  pages = [],
  { templates, allCompilerOptions, megaloTemplateCompiler } = {},
  { compiler, compilation } = {}
) {
  pages.forEach( options => {
    const { file } = options

    emitFile(
      `${ file }.json`,
      json( options ),
      compilation
    )

    emitFile(
      `${ file }.js`,
      js( options ),
      compilation
    )

    emitFile(
      `${ file }.wxss`,
      style( options ),
      compilation
    )

    emitFile(
      `${ file }.wxml`,
      template( options ),
      compilation
    )
  } )

  const allSlotImports = new Set()
  const allSlotContent = new Set()

  // emit components
  Object.keys( templates ).forEach( resourcePath => {
    const source = templates[ resourcePath ]
    const compilerOptions = Object.assign(
      { target: 'wechat' },
      allCompilerOptions[ resourcePath ]
    )

    const { body, slots } = megaloTemplateCompiler.compileToTemplate(
      source,
      compilerOptions
    )

    const name = compilerOptions.name

    emitFile( `components/${ name }.wxml`, body, compilation )

    slots.forEach( slot => {
      const dependencies = slot.dependencies || []
      const body = slot.body
      dependencies.forEach( d => allSlotImports.add( d ) )
      allSlotContent.add( body )
    } )
  } )

  let slotsOutput = ''
  allSlotImports.forEach( im => {
    slotsOutput = slotsOutput + `<import src="${ im }" />\n`
  } )

  slotsOutput = slotsOutput + `\n`

  allSlotContent.forEach( c => {
    slotsOutput = slotsOutput + c + `\n\n`
  } )

  emitFile( `components/slots.wxml`, slotsOutput, compilation )
}
