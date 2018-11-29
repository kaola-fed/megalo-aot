const emitFile = require( '../../utils/emitFile' )
const relativeToRoot = require( './utils/relativeToRoot' )
const getMD5 = require( '../../utils/md5' )
const constants = require( './constants' )
const subpackagesUtil = require( '../../utils/subpackages' )

const compiledComponentTemplates = {}

module.exports = function( {
  generators,
  extensions,
} ) {
  return function(
    pages = [],
    { subpackages, templates, allCompilerOptions, megaloTemplateCompiler, megaloOptions } = {},
    { compiler, compilation } = {}
  ) {
    const { htmlParse = false, platform } = megaloOptions

    let htmlParsePaths = {
      template: constants.HTMLPARSE_TEMPLATE_OUTPUT_PATH + extensions.template,
      style: constants.HTMLPARSE_STYLE_OUTPUT_PATH + extensions.style,
    }

    // emit page stuff
    pages.forEach( options => {
      const { file } = options

      const generatorOptions = normalizeGeneratorOptions(
        Object.assign( {}, options, { htmlParse, htmlParsePaths } ),
        { constants, extensions }
      )

      ;[ 'json', 'script', 'style', 'template' ].forEach( type => {
        const generated = generators[ type ]( generatorOptions )
        const outPath = `${ file }${ extensions[ type ] }`

        emitFile( outPath, generated, compilation )
      } )
    } )

    const allSlotImports = new Set()
    const allSlotContent = new Set()

    // emit components
    Object.keys( templates ).forEach( resourcePath => {
      const source = templates[ resourcePath ]
      const compilerOptions = allCompilerOptions[ resourcePath ] || {}

      // is importee in subpackage ?
      const importeeSubpackage = subpackagesUtil.findSubpackage( resourcePath, subpackages )
      const importeeOutPath = constants.COMPONENT_OUTPUT_PATH
        .replace( /\[name\]/g, compilerOptions.name )
        .replace( /\[root\]/g, importeeSubpackage ? importeeSubpackage.root + '/' : '' ) +
        extensions.template

      const imports = normalizeImports( {
        imports: compilerOptions.imports,
        importeeOutPath,
        extensions,
        subpackages,
      } )

      // add slots
      imports[ '_slots_' ] = {
        name: '',
        src: relativeToRoot( importeeOutPath ) +
          constants.SLOTS_OUTPUT_PATH +
          extensions.template
      }

      const importsStr = Object.keys( imports ).reduce( ( res, key ) => {
        return res += `,${imports[ key ].src}`
      }, '' )
      const md5 = getMD5( source + importsStr )
      const compiledComponentTemplate = compiledComponentTemplates[ resourcePath ] || {}
      let currentSlots = []

      if (compiledComponentTemplate.md5 !== md5) {
        const { body, slots, needHtmlParse } = generators.component( {
          source,
          compiler: megaloTemplateCompiler,
          compilerOptions: Object.assign(
            {},
            compilerOptions,
            { target: platform, imports, htmlParse }
          ),
        } )

        compiledComponentTemplates[ resourcePath ] = {
          md5,
          body,
          slots,
          needHtmlParse
        }
        currentSlots = slots || []

        let finalBody = body

        if (htmlParse && needHtmlParse) {
          // add htmlparse
          const htmlPraserSrc = relativeToRoot( importeeOutPath ) +
            constants.HTMLPARSE_TEMPLATE_OUTPUT_PATH +
            extensions.template

          // TODO: move this to codegen
          finalBody = `<import src="${htmlPraserSrc}"/>${body}`
        }

        // emit component
        emitFile(
          importeeOutPath,
          finalBody,
          compilation
        )
      } else {
        currentSlots = compiledComponentTemplate.slots || []
      }

      // collect slots
      currentSlots.forEach( slot => {
        const dependencies = slot.dependencies || []
        const body = slot.body
        dependencies.forEach( d => allSlotImports.add( d ) )
        allSlotContent.add( body )
      } )
    } )

    // slots
    emitFile(
      constants.SLOTS_OUTPUT_PATH + extensions.template,
      generators.slots( {
        imports: allSlotImports,
        bodies: allSlotContent,
      } ),
      compilation
    )
  }
}

function normalizeGeneratorOptions( options, { constants, extensions } ) {
  const entryComponent = options.entryComponent || {}

  // resolve entryComponent src
  entryComponent.src = constants.COMPONENT_OUTPUT_PATH
    .replace( /\[root\]/g, entryComponent.root ? entryComponent.root + '/' : '' )
    .replace( /\[name\]/g, entryComponent.name ) +
    extensions.template

  return options
}

function normalizeImports( {
  imports = {},
  importeeOutPath,
  extensions = {},
  subpackages = []
} ) {
  imports = Object.assign( {}, imports )

  Object.keys( imports ).forEach( k => {
    const { name, resolved } = imports[ k ]

    const subpackage = subpackagesUtil.findSubpackage( resolved, subpackages )
    const root = subpackage ? subpackage.root + '/' : ''

    const src = relativeToRoot( importeeOutPath ) +
      constants.COMPONENT_OUTPUT_PATH
        .replace( /\[root\]/g, root )
        .replace( /\[name\]/g, name ) +
      extensions.template

    imports[ k ].src = src
  } )

  return imports
}
