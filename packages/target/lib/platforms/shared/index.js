const emitFile = require( '../../utils/emitFile' )
const relativeToRoot = require( './utils/relativeToRoot' )
const getMD5 = require( '../../utils/md5' )

const compiledComponentTemplates = {}

module.exports = function({
  generators,
  component,
  slots,
  constants
} ) {
  return function(
    pages = [],
    { templates, allCompilerOptions, megaloTemplateCompiler, megaloOptions } = {},
    { compiler, compilation } = {}
  ) {
    const { htmlParse = false, platform } = megaloOptions

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
      Object.keys(imports).forEach( k => {
        const { src } = imports[ k ]
        if ( !/\.\./.test( src ) ) {
          Object.assign( imports[ k ], {
            src: relativeToRoot( constants.COMPONENT_OUTPUT_PATH ) + `components/${src}`
          } )
        }
      } )
      // add slots
      imports[ '_slots_' ] = {
        name: '',
        src: relativeToRoot( constants.COMPONENT_OUTPUT_PATH ) +
          constants.SLOTS_OUTPUT_PATH
      }

      const importsStr = Object.keys( imports ).reduce( ( res, key ) => {
        return res += `,${imports[ key ].src}`
      }, '' )
      const md5 = getMD5( source + importsStr )
      const compiledComponentTemplate = compiledComponentTemplates[ resourcePath ] || {}
      let currentSlots = []

      if (compiledComponentTemplate.md5 !== md5) {
        let compilerOptions = Object.assign(
          {},
          allCompilerOptions[ resourcePath ],
          { target: platform, imports, htmlParse }
        )
  
        const { body, slots, needHtmlParse } = component( {
          source,
          compiler: megaloTemplateCompiler,
          compilerOptions,
        } )
  
        compiledComponentTemplates[ resourcePath ] = {
          md5,
          body,
          slots,
          needHtmlParse
        }
        currentSlots = slots
  
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
      constants.SLOTS_OUTPUT_PATH,
      slots( {
        imports: allSlotImports,
        bodies: allSlotContent,
      } ),
      compilation
    )
  }
}