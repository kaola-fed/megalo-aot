const RuleSet = require( 'webpack/lib/RuleSet' )
const findRuleByFile = require( '../../../utils/findRuleByFile' )
const findRuleByQuery = require( '../../../utils/findRuleByQuery' )

class VuePlugin {
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
    
    compiler.options.module.rules = rules
  }
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

module.exports = VuePlugin
