const qs = require( 'querystring' )
const RuleSet = require( 'webpack/lib/RuleSet' )
const findRuleByFile = require( '../utils/findRuleByFile' )
const findRuleByQuery = require( '../utils/findRuleByQuery' )
const createEntryHelper = require( '../utils/createEntryHelper' )
const attach = require( '../utils/attachLoaderContext' )
const sortEntrypointFiles = require( '../utils/sortEntrypointFiles' )
const removeExtension = require( '../utils/removeExtension' )
const subpackagesUtil = require( '../utils/subpackages' )
const walkObject = require( '../utils/walkObject' )
const platforms = require( '../platforms' )

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
    const megaloTemplateCompiler = megaloOptions.compiler

    // replace globalObject
    replaceGlobalObject( compiler, megaloOptions )

    // generate pages
    hookJSEntry( {
      rules,
      files: [ 'foo.js', 'foo.ts' ],
      entryLoader: {
        options: {},
        loader: require.resolve( '../loaders/js-entry' ),
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
function hookJSEntry( { rules, files = {}, entryLoader } ) {
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
      const { entrypoints, assets } = compilation || {}
      const appConfig = pages.app && pages.app.config && pages.app.config || {}
      const subpackages = appConfig.subpackages || appConfig.subPackages || []
      const { codegen } = platforms[ platform ]

      // move assets to subpackage
      moveAssets( { assets, subpackages } )

      // emit files, includes:
      // 1. pages (wxml/wxss/js/json)
      // 2. components
      // 3. slots
      // 4. htmlparse
      codegen(
        normalizePages( {
          pages,
          assets,
          subpackages,
          entrypoints,
          platform,
        } ),
        {
          subpackages,
          templates,
          allCompilerOptions,
          megaloTemplateCompiler,
          megaloOptions
        },
        {
          compiler,
          compilation,
        }
      )
    }
  )
}

function normalizePages( { pages, assets, subpackages, entrypoints, platform } ) {
  const chunkFiles = sortEntrypointFiles( entrypoints, platform )
  const normalized = []

  Object.keys( pages ).map( k => {
    const page = pages[ k ] || {}
    const subpackage = subpackagesUtil.findSubpackage( page.file, subpackages )
    // prefix root for subpackage files
    const files = normalizeFiles( {
      files: chunkFiles[ k ],
      subpackage,
      assets, // ensure resource is emitted in assets
    } )

    // add chunk files for pages
    const newPage = Object.assign( {}, page, { files } )

    // subpackage should prefix root
    if ( subpackage ) {
      page.entryComponent.root = subpackage.root
    } else {
      page.entryComponent.root = ''
    }

    normalized.push( newPage )
  } )

  return normalized
}

function normalizeFiles( { files, subpackage, assets } ) {
  const root = subpackage ? subpackage.root + '/' : ''

  walkObject( files, ( file, key, parent ) => {
    if ( typeof file === 'string' ) {
      const renamed = root + file

      // exists
      if ( subpackage && assets[ renamed ] ) {
        parent[ key ] = renamed
      }
    }
  } )

  return files
}

function moveAssets( { assets = {}, subpackages = [] } ) {
  Object.keys( assets ).map( path => {
    const subpackage = subpackagesUtil.findSubpackage( path, subpackages )

    if ( subpackage ) {
      const inSubpackage = path.indexOf( subpackage.root + '/' ) === 0
      if ( !inSubpackage ) {
        assets[ subpackage.root + '/' + path ] = assets[ path ]
        delete assets[ path ]
      }
    }
  } )
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
  if ( !pages[ file ] ) {
    pages[ file ] = {}
  }

  if ( file ) {
    pages[ file ].file = file
  }

  // merge config
  if ( config ) {
    pages[ file ].config = Object.assign( {}, pages[ file ].config || {}, config )
  }

  if ( entryComponent ) {
    pages[ file ].entryComponent = entryComponent
  }
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
