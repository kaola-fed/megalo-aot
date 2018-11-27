const qs = require( 'querystring' )
const RuleSet = require( 'webpack/lib/RuleSet' )
const findRuleByFile = require( '../utils/findRuleByFile' )
const findRuleByQuery = require( '../utils/findRuleByQuery' )
const createEntryHelper = require( '../utils/createEntryHelper' )
const attach = require( '../utils/attachLoaderContext' )
const sortEntrypointFiles = require( '../utils/sortEntrypointFiles' )
const removeExtension = require( '../utils/removeExtension' )

const pages = {}
const allCompilerOptions = {}
const templates = {}

class MegaloPlugin {
  constructor( options = {} ) {
    this.options = options
  }

  apply( compiler ) {
    const compilerOptions = compiler.options
    const rawRules = compilerOptions.module.rules
    const { rules } = new RuleSet( rawRules )
    const megaloOptions = this.options
    const megaloTemplateCompiler = megaloOptions.compiler ||
      require( '@megalo/template-compiler' )

    // replace globalObject
    replaceGlobalObject( compiler, megaloOptions )

    // generate pages
    hookEntry( {
      rules,
      files: [ 'foo.js', 'foo.ts' ],
      entryLoader: {
        options: {},
        loader: require.resolve( '../loaders/entry' ),
      },
    } )

    // attach to loaderContext
    attachEntryHelper( compiler )
    attachCacheAPI( compiler )

    // lazy emit files using `pages` && `allCompilerOptions` && `templates`
    lazyEmit( compiler, megaloTemplateCompiler, megaloOptions )

    compiler.options.module.rules = rules
  }
}

function replaceGlobalObject( compiler, megaloOptions ) {
  if (megaloOptions.platform === 'alipay') {
    compiler.options.output.globalObject = 'my'
  } else {
    compiler.options.output.globalObject = 'global'
  }
}

// [framework]-loader clones babel-loader rule, we shall ignore it
function hookEntry( { rules, files = {}, entryLoader } ) {
  const entryRule = findRuleByFile( rules, files )

  if ( !entryRule ) {
    return
  }

  const entryUse = entryRule.use
  const babelUseLoaderIndex = entryUse.findIndex( u => {
    return /^babel-loader|(\/|\\|@)babel-loader/.test( u.loader )
  } )

  entryUse.splice( babelUseLoaderIndex + 1, 0, entryLoader )
}

function lazyEmit( compiler, megaloTemplateCompiler, megaloOptions ) {
  const { platform = 'wechat' } = megaloOptions

  compiler.hooks.emit.tap(
    `megalo-plugin-emit`,
    compilation => {
      const entrypoints = compilation.entrypoints
      const chunkFiles = sortEntrypointFiles( entrypoints, platform )
      let codegen

      const pagesWithFiles = []
      Object.keys( pages ).map( k => {
        const page = pages[ k ] || {}
        const files = chunkFiles[ k ]
        pagesWithFiles.push( Object.assign( {}, page, { files } ) )
      } )

      switch( platform ) {
        case 'wechat':
          codegen = require( '../platforms/wechat' ).codegen
          break;
        case 'alipay':
          codegen = require( '../platforms/alipay' ).codegen
          break;
        case 'swan':
          codegen = require( '../platforms/swan' ).codegen
          break;
      }

      // emit files, includes:
      // 1. pages (wxml/wxss/js/json)
      // 2. components
      // 3. slots
      // 4. htmlparse
      codegen(
        pagesWithFiles,
        { templates, allCompilerOptions, megaloTemplateCompiler, megaloOptions },
        {
          compiler,
          compilation,
        }
      )
    }
  )
}

function attachEntryHelper( compiler ) {
  const entryHelper = createEntryHelper( compiler.options.entry )

  attach( 'megalo-plugin-entry-helper', compiler, loaderContext => {
    loaderContext.megaloEntryHelper = entryHelper
  } )
}

function attachCacheAPI( compiler ) {
  attach( 'megalo-plugin-cache-api', compiler, loaderContext => {
    loaderContext.megaloCacheToPages = cacheToPages
    loaderContext.megaloCacheToAllCompilerOptions = cacheToAllCompilerOptions
    loaderContext.megaloCacheToTemplates = cacheToTemplates
  } )
}

// sideEffects: true
function cacheToPages( { file, config, entryComponent } = {} ) {
  pages[ file ] = { file, config, entryComponent }
}

function cacheToAllCompilerOptions( resourcePath, compilerOptions = {} ) {
  resourcePath = removeExtension(resourcePath)
  allCompilerOptions[ resourcePath ] = allCompilerOptions[ resourcePath ] || {}
  Object.assign( allCompilerOptions[ resourcePath ], compilerOptions )
}

function cacheToTemplates( resourcePath, template ) {
  resourcePath = removeExtension(resourcePath)
  templates[ resourcePath ] = template
}

module.exports = MegaloPlugin
