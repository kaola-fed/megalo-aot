const emitFile = require( '../../utils/emitFile' )
const relativeToRoot = require( './utils/relativeToRoot' )
const getMD5 = require( '../../utils/md5' )
const hash = require( 'hash-sum' )
const constants = require( './constants' )
const subpackagesUtil = require( '../../utils/subpackages' )

const DEFAULT_IMPORT_GENERATORS = {
  'import': {
    template: require( './codegen/import.template.js' ),
    style: require( './codegen/import.style.js' ),
  }
}

const _caches = {}

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

    generators = Object.assign( {}, DEFAULT_IMPORT_GENERATORS, generators )

    // emit page template / style / script / json
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

    const components = []

    // prepare for generate components and slots
    Object.keys( templates ).forEach( resourcePath => {
      const { source, useCompiler } = templates[ resourcePath ]
      const compilerOptions = allCompilerOptions[ resourcePath ] || {}
      const name = compilerOptions.name
      const imports = compilerOptions.imports
      const subpackage = subpackagesUtil.findSubpackage(
        resourcePath, subpackages
      )

      const md5 = hash( { source, imports } )
      let cached = _caches[ resourcePath ] || {}

      // changed
      if ( cached.md5 !== md5 ) {
        let compiler = megaloTemplateCompiler[ useCompiler ] ||
          megaloTemplateCompiler.vue

        const generated = generators.component( {
          source,
          compiler,
          compilerOptions: Object.assign(
            {},
            compilerOptions,
            { target: platform, imports, htmlParse }
          ),
        } )

        cached = _caches[ resourcePath ] = {
          md5,
          body: generated.body || '',
          slots: generated.slots || [],
          needHtmlParse: !!generated.needHtmlParse,
        }
      }

      components.push( {
        resourcePath,
        subpackage,
        name,
        imports,
        body: cached.body,
        slots: cached.slots,
        needHtmlParse: cached.needHtmlParse,
      } )
    } )

    const MAIN_COMPONENT_NAMES = components
      .filter( c => !c.subpackage )
      .map( c => c.name )

    const extracted = new Set()
    const mainSlots = new Set()
    const subpackageSlots = {}

    components.forEach( function( component ) {
      const { subpackage, slots } = component
      const root = subpackage ? subpackage.root + '/' : ''

      if ( subpackage ) {
        const shouldExtracted = slots.some( slot => {
          return slot.dependencies
            .some( dependency => !!~MAIN_COMPONENT_NAMES.indexOf( dependency ) )
        } )

        slots.forEach( slot => {
          if ( shouldExtracted ) {
            slot.dependencies.forEach( d => extracted.add( d ) )
            mainSlots.add( slot )
          } else {
            subpackageSlots[ root ] = subpackageSlots[ root ] || new Set()
            subpackageSlots[ root ].add( slot )
          }
        } )
      } else {
        slots.forEach( s => mainSlots.add( s ) )
      }
    } )

    // prepare { name: { outPath, root } }
    const NAME_MAP = {}
    components.forEach( component => {
      const { name, subpackage } = component

      const root = extracted.has( name ) ?
        '' :
        ( subpackage ? subpackage.root + '/' : '' )

      const outPath = constants.COMPONENT_OUTPUT_PATH
        .replace( /\[root\]/g, root )
        .replace( /\[name\]/g, name ) +
        extensions.template

      NAME_MAP[ name ] = { outPath, root }
    } )

    // begin generate components and slots

    components.forEach( component => {
      const { name, body, imports, subpackage, needHtmlParse } = component
      const { outPath, root } = NAME_MAP[ name ]
      const pathPrefix = relativeToRoot( outPath )
      const content = []

      const MAIN_SLOTS_OUTPATH = constants.SLOTS_OUTPUT_PATH
        .replace( /\[root\]/g, '' ) + extensions.template
      const SUBPACKAGE_SLOTS_OUTPATH = constants.SLOTS_OUTPUT_PATH
        .replace( /\[root\]/g, root ) + extensions.template

      // add main slots import
      const mainSlotsSrc = pathPrefix + MAIN_SLOTS_OUTPATH
      content.push( generators.import.template( { src: mainSlotsSrc } ) )

      // add subpackage slots import
      if ( root && subpackageSlots[ root ] ) {
        const subpackageSlotsSrc = pathPrefix + SUBPACKAGE_SLOTS_OUTPATH
        content.push( generators.import.template( { src: subpackageSlotsSrc } ) )
      }

      // add htmlparse import
      if ( needHtmlParse ) {
        const htmlParsePath = pathPrefix + htmlParsePaths.template
        content.push( generators.import.template( { src: htmlParsePath } ) )
      }

      // add dependency imports
      Object.keys( imports ).forEach( key => {
        const imp = imports[ key ]
        const { root } = NAME_MAP[ imp.name ]
        const importSrc = pathPrefix + constants.COMPONENT_OUTPUT_PATH
          .replace( /\[root\]/g, root )
          .replace( /\[name\]/g, imp.name ) +
          extensions.template

        content.push( generators.import.template( { src: importSrc } ) )
      } )

      content.push( body )

      emitFile(
        outPath,
        content.join( '\n' ),
        compilation
      )
    } )

    // main slots
    emitFile(
      constants.SLOTS_OUTPUT_PATH
        .replace( /\[root\]/g, '' ) +
      extensions.template,
      generators.slots( genSlotsGeneratorArgs( {
        slots: mainSlots,
        constants,
        NAME_MAP,
      } ) ),
      compilation
    )

    // subpackage slots
    Object.keys( subpackageSlots ).forEach( root => {
      const slots = subpackageSlots[ root ]
      emitFile(
        constants.SLOTS_OUTPUT_PATH
          .replace( /\[root\]/g, root ) +
        extensions.template,
        generators.slots( genSlotsGeneratorArgs( {
          slots: slots,
          root,
          constants,
          NAME_MAP,
        } ) ),
        compilation
      )
    } )

  }
}

function genSlotsGeneratorArgs( { slots, root = '', NAME_MAP, constants } ) {
  slots = Array.from( slots )
  const slotOutPath = constants.SLOTS_OUTPUT_PATH
    .replace( /\[root\]/g, root )
  const pathPrefix = relativeToRoot( slotOutPath )

  return slots.reduce( ( total, slot ) => {
    const srcs = slot.dependencies.map( name => {
      const { outPath } = NAME_MAP[ name ]
      return pathPrefix + outPath
    } ).filter( Boolean )

    total.imports = total.imports.concat( srcs )
    total.bodies.push( slot.body )

    return total
  }, {
    imports: [],
    bodies: []
  } )
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
