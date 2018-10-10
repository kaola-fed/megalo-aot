const json = require( './codegen/page.json' )
const style = require( './codegen/page.style' )
const template = require( './codegen/page.template' )
const script = require( './codegen/page.script' )
const component = require( './codegen/component' )
const slots = require( './codegen/slots' )
const emitFile = require( '../../utils/emitFile' )
const constants = require( './constants' )
const relativeToRoot = require( './utils/relativeToRoot' )

function codegen (
  pages = [],
  { templates, allCompilerOptions, megaloTemplateCompiler, megaloOptions } = {},
  { compiler, compilation } = {}
) {
  const { htmlParse = false } = megaloOptions
  const generators = [
    [ json, '.json' ],
    [ script, '.js' ],
    [ style, '.wxss' ],
    [ template, '.wxml' ],
  ]

  pages.forEach( options => {
    const { file } = options
    const generatorOptions = Object.assign({ htmlParse }, options)

    generators.forEach( pair => {
      const generate = pair[ 0 ]
      const extension = pair[ 1 ]
      emitFile( `${ file }${ extension }`, generate( generatorOptions ), compilation )
    } )
  } )

  const allSlotImports = new Set()
  const allSlotContent = new Set()

  // emit components
  Object.keys( templates ).forEach( resourcePath => {
    const source = templates[ resourcePath ]
    const opts = allCompilerOptions[ resourcePath ] || {}

    // clone
    const imports = Object.assign( {}, opts.imports || {} )
    // add slots
    imports[ '_slots_' ] = {
      name: '',
      src: relativeToRoot( constants.COMPONENT_OUTPUT_PATH ) +
        constants.SLOTS_OUTPUT_PATH
    }

    let compilerOptions = Object.assign(
      {},
      allCompilerOptions[ resourcePath ],
      { target: 'wechat', imports, htmlParse }
    )

    const { body, slots, needHtmlParse } = component( {
      source,
      compiler: megaloTemplateCompiler,
      compilerOptions,
    } )

    let finalBody = body
    const name = compilerOptions.name

    if (htmlParse && needHtmlParse) {
      // add htmlparse
      const htmlPraserSrc = relativeToRoot( constants.COMPONENT_OUTPUT_PATH ) +
          constants.HTMLPARSE_OUTPUT_PATH.TEMPLATE
      finalBody = `<import src="${htmlPraserSrc}"/>${body}`
    }

    // emit component
    emitFile(
      constants.COMPONENT_OUTPUT_PATH.replace( /\[name\]/g, name ),
      finalBody,
      compilation
    )

    // collect slots
    slots.forEach( slot => {
      const dependencies = slot.dependencies || []
      const body = slot.body
      dependencies.forEach( d => allSlotImports.add( d ) )
      allSlotContent.add( body )
    } )
  } )

  // slots
  emitFile(
    constants.SLOTS_OUTPUT_PATH,
    slots( {
      imports: allSlotImports,
      bodies: allSlotContent,
    } ),
    compilation
  )
}

exports.codegen = codegen
exports.constants = constants
