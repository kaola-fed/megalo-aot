const path = require( 'path' )
const qs = require( 'querystring' )
const RuleSet = require( 'webpack/lib/RuleSet' )
const findRuleByFile = require( '../utils/findRuleByFile' )
const findAllRulesByFile = require( '../utils/findAllRulesByFile' )
const findRuleByQuery = require( '../utils/findRuleByQuery' )
const createEntryHelper = require( '../utils/createEntryHelper' )
const attach = require( '../utils/attachLoaderContext' )
const sortEntrypointFiles = require( '../utils/sortEntrypointFiles' )
const removeExtension = require( '../utils/removeExtension' )
const subpackagesUtil = require( '../utils/subpackages' )
const walkObject = require( '../utils/walkObject' )
const replacer = require( '../utils/replacer' )
const toAsset = require( '../utils/toAsset' )
const deferred = require( '../utils/deferred' )
const platforms = require( '../platforms' )
const chalk = require('chalk')
const MultiPlatformResolver = require( './MultiPlatformResolver' )

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

    // modify the resolve options
    modifyResolveOption(compiler, megaloOptions);

    // generate pages
    hookJSEntry( {
      rules,
      files: [ 'foo.js', 'foo.ts' ],
      entryLoader: {
        options: {},
        loader: require.resolve( '../loaders/js-entry' ),
      },
    } )

    // use to support multi-platform style in vue component
    hookCss( {
      rules,
      files: getStyleRulesWithVueLoaderRules([ 'foo.css', 'foo.scss', 'foo.sass', 'foo.less', 'foo.styl', 'foo.stylus', 'foo.mcss' ]),
      loader: require.resolve( '../loaders/multi-platform-style' ),
    } )

    // hook url-loader/file-loader
    hookAssets( {
      rules,
      files: [ 'foo.jpg', 'foo.jpeg', 'foo.png', 'foo.gif' ],
    } )

    hookAssets( {
      rules,
      files: [ 'foo.ttf', 'foo.eot', 'foo.woff', 'foo.woff2', 'foo.svg' ],
    } )

    // attach to loaderContext
    attachEntryHelper( compiler )
    attachCacheAPI( compiler )
    attachDeferredAPI( compiler )

    // lazy emit files using `pages` && `allCompilerOptions` && `templates`
    lazyEmit( compiler, megaloTemplateCompiler, megaloOptions )

    compiler.options.module.rules = rules
  }
}

function getStyleRulesWithVueLoaderRules (arr) {
  let newArr = [];

  arr.forEach((item) => {
    let lang = item.split(".")[1];

    newArr.push(item, `foo.vue?vue&type=style&lang=${lang}&`);
  });

  return newArr;
}

function modifyResolveOption ( compiler, options ) {
  const { platform = 'wechat' } = options;

  // add to webpack resolve.plugins in order to resolve multi-platform js module
  !compiler.options.resolve.plugins && (compiler.options.resolve.plugins = []);
  compiler.options.resolve.plugins.push(new MultiPlatformResolver(platform));

  // require multi-platform module like a directory
  const mainFiles = [`index.${platform}`, 'index'];
  const extensions = ['.vue', '.js', '.json'];

  compiler.options.resolve.mainFiles = getConcatedArray(compiler.options.resolve.mainFiles, mainFiles);
  compiler.options.resolve.extensions = getConcatedArray(compiler.options.resolve.extensions, extensions);

  compiler.options.resolve.mainFiles.length > mainFiles.length && console.log(chalk.yellow('warning') + " megalo modified your webpack config " + chalk.bgBlue("resolve.mainFiles") + ", contact us if any problem occurred");
}

function getConcatedArray (source, target) {
  if (!source) {
    return target;
  }

  return [...new Set(source.concat(target))]
}

function hookAssets( { rules, files } ) {
  const rule = findRuleByFile( rules, files )

  if ( !rule ) {
    return
  }

  const use = rule.use
  const urlLoader = use.find( u => {
    return /^url-loader|(\/|\\|@)url-loader/.test( u.loader )
  } )
  const fileLoader = use.find( u => {
    return /^file-loader|(\/|\\|@)file-loader/.test( u.loader )
  } )

  replacePublicPathOption(
    urlLoader ||
    fileLoader
  )
}

function replacePublicPathOption( loader ) {
  if ( !loader ) {
    return
  }

  if ( !loader.options ) {
    loader.options = {}
  }

  // already hooked before
  if (
    loader.options.outputPath &&
    ( loader.options.outputPath.hooked === true )
  ) {
    return
  }

  const options = loader.options

  const oldOutputPath = options.outputPath

  options.outputPath = function ( url, resourcePath, context ) {
    let outputPath = url

    if ( oldOutputPath ) {
      if (typeof oldOutputPath === 'function') {
        outputPath = oldOutputPath(url, resourcePath, context)
      } else {
        outputPath = path.posix.join( oldOutputPath, url )
      }
    }

    outputPath = replacer.encode( outputPath )

    return outputPath
  }

  options.outputPath.hooked = true
}

function fixAssetPaths( { assets, subpackages } ) {
  Object.keys( assets ).map( path => {
    const source = assets[ path ].source()

    if ( replacer.isEncoded( source ) ) {
      const decodedSource = replacer.decode( source, matched => {
        const subpackage = subpackagesUtil.findSubpackage( matched, subpackages )
        if ( subpackage ) {
          const inSubpackage = matched.indexOf( subpackage.root + '/' ) === 0
          if ( !inSubpackage ) {
            return subpackage.root + '/' + matched
          }
        }

        return matched
      } )

      assets[ path ] = toAsset( decodedSource )
    }

    if ( replacer.isEncoded( path ) ) {
      assets[ replacer.clean( path ) ] = assets[ path ]
      delete assets[ path ]
    }
  } )
}

function replaceGlobalObject( compiler, megaloOptions ) {
  if (megaloOptions.platform === 'alipay') {
    compiler.options.output.globalObject = 'my'
  } else {
    compiler.options.output.globalObject = 'global'
  }
}

// [framework]-loader clones babel-loader rule, we shall ignore it
function hookJSEntry( { rules, files = [], entryLoader } ) {
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

function hookCss({ rules, files = [], loader }) {
  const entryRuleArr = findAllRulesByFile(rules, files), vueIndex = findAllRulesByFile(rules, ['foo.vue', 'foo.vue.html'])[0] || -1;

  if ( !entryRuleArr.length ) {
    return
  }
  // add loader to loaders which also enclude loaders cloned by vue-loader-plugin while vue-loader itself should not be applied this change 
  entryRuleArr.forEach((index) => {
    if ( index != vueIndex ) {
      rules[index].use ? rules[index].use.unshift( loader ) : rules[index].use = [ loader ]
    }
  });
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
      // fix assets path generated by file-loder
      // as as we change the output path with `moveAssets`
      fixAssetPaths( { assets, subpackages } )

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
    if ( page.entryComponent ) {
      if ( subpackage ) {
        page.entryComponent.root = subpackage.root
      } else {
        page.entryComponent.root = ''
      }
    } else {
      newPage.entryComponent = {
        root: ''
      }
      // throw new Error( `Cannot parse entry component for "${ page.file }"` )
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

const _deferredCache = {}
function attachDeferredAPI( compiler ) {
  attach( 'megalo-plugin-deferred-api', compiler, loaderContext => {
    loaderContext.megaloDeferred = function ( key ) {
      if ( !_deferredCache[ key ] ) {
        _deferredCache[ key ] = deferred()

        _deferredCache[ key ].del = function () {
          delete _deferredCache[ key ]
        }
      }

      return _deferredCache[ key ]
    }
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
