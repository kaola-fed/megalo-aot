const qs = require( 'querystring' )
const RuleSet = require( 'webpack/lib/RuleSet' )
const findRuleByFile = require( '../utils/findRuleByFile' )
const findRuleByQuery = require( '../utils/findRuleByQuery' )
const createEntryHelper = require( '../utils/createEntryHelper' )
const attach = require( '../utils/attachLoaderContext' )
const sortEntrypointFiles = require( '../utils/sortEntrypointFiles' )

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

    // attach to loaderContext
    attachEntryHelper( compiler )
    attachCacheAPI( compiler )

    // generate components
    replaceVueTemplateCompiler( {
      rules,
      compiler: megaloTemplateCompiler,
    } )

    // generate pages
    hookEntry( {
      rules,
    } )

    // transpile `scoped` attribute to class
    replacePitcher( {
      rules,
    } )

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
  allCompilerOptions[ resourcePath ] = allCompilerOptions[ resourcePath ] || {}
  Object.assign( allCompilerOptions[ resourcePath ], compilerOptions )
}

function cacheToTemplates( resourcePath, template ) {
  templates[ resourcePath ] = template
}


// add our loader before vue-loader
function replaceVueTemplateCompiler( { rules, compiler } ) {
  const vueRule = findRuleByFile( rules, [ 'foo.vue', 'foo.vue.html' ] )
  const vueUse = vueRule.use
  const vueUseLoaderIndex = vueUse.findIndex( u => {
    return /^vue-loader|(\/|\\|@)vue-loader/.test( u.loader )
  } )
  const vueUseLoader = vueUse[ vueUseLoaderIndex ]

  // override compiler for `vue-loader` and `./loaders/vue`
  vueUseLoader.options.compiler = compiler
}

// vue-loader clones babel-loader rule, we shall ignore it
function hookEntry( { rules } ) {
  const entryRule = findRuleByFile( rules, [ 'foo.js', 'foo.ts' ] )
  const entryUse = entryRule.use
  const babelUseLoaderIndex = entryUse.findIndex( u => {
    return /^babel-loader|(\/|\\|@)babel-loader/.test( u.loader )
  } )

  const megaloEntryLoader = {
    options: {},
    loader: require.resolve( '../loaders/entry' )
  }

  entryUse.splice( babelUseLoaderIndex + 1, 0, megaloEntryLoader )
}

// use our own pitcher override vue-loader pitcher
function replacePitcher( { rules } ) {
  const vuePitcherRule = findRuleByQuery( rules, [ '?vue&' ] )
  const vuePitcherUse = vuePitcherRule.use
  const vuePitcherLoader = vuePitcherUse[ 0 ]

  // replace
  vuePitcherLoader.loader = require.resolve( '../loaders/pitcher' )
}

module.exports = MegaloPlugin
