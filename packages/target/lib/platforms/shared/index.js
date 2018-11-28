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
    const { subPackagesRoot } = compiler

    // emit page stuff
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
      let page = pages.find(p=>opts.name === p.entryComponent)

      // get page root
      if ( !page ){
        for(let i in subPackagesRoot){
          let root = subPackagesRoot[i]
          if( RegExp(`src/${root}/`).test(resourcePath) ){
            page = { root }
            break
          }
        }
      }
      const { root = '.'} = page || {}
      const COMPONENT_OUTPUT_PATH = constants.COMPONENT_OUTPUT_PATH.replace( /\[root\]\//g, root == '.' ? '' : `${root}/` )

      // clone
      const imports = Object.assign( {}, opts.imports || {} )
      Object.keys(imports).forEach( k => {
        const { src, resolved} = imports[ k ]
        if ( !/\.\./.test( src ) ) {
          Object.assign( imports[ k ], {
            src: relativeToRoot( COMPONENT_OUTPUT_PATH ) + (root !== '.' && RegExp(`src/${root}/`).test(resolved) ? `${root}/` : '') + `components/${src}`
          } )
        }
      } )
      // add slots
      imports[ '_slots_' ] = {
        name: '',
        src: relativeToRoot( COMPONENT_OUTPUT_PATH ) +
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
        currentSlots = slots || []

        let finalBody = body
        const name = compilerOptions.name

        if (htmlParse && needHtmlParse) {
          // add htmlparse
          const htmlPraserSrc = relativeToRoot( COMPONENT_OUTPUT_PATH ) +
              constants.HTMLPARSE_OUTPUT_PATH.TEMPLATE
          finalBody = `<import src="${htmlPraserSrc}"/>${body}`
        }

        // emit component
        emitFile(
          COMPONENT_OUTPUT_PATH.replace( /\[name\]/g, name ),
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
