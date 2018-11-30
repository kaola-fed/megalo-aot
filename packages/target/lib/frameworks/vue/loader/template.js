const qs = require( 'querystring' )
const loaderUtils = require( 'loader-utils' )
const { compileTemplate } = require('@vue/component-compiler-utils')
const removeExtension = require( '../../../utils/removeExtension' )
const getMD5 = require( '../../../utils/md5' )

// Loader that compiles raw template into JavaScript functions.
// This is injected by the global pitcher (../pitch) for template
// selection requests initiated from vue files.
module.exports = function (source) {
  const loaderContext = this
  const query = qs.parse(this.resourceQuery.slice(1))

  // although this is not the main vue-loader, we can get access to the same
  // vue-loader options because we've set an ident in the plugin and used that
  // ident to create the request for this loader in the pitcher.
  const options = loaderUtils.getOptions(loaderContext) || {}
  const { id } = query
  const isProduction = loaderContext.minimize || process.env.NODE_ENV === 'production'
  const isFunctional = query.functional

  // allow using custom compiler via options
  const compiler = options.compiler

  const realResourcePath = removeExtension( loaderContext.resourcePath )
  const target = this.target.replace(/^mp-/, '')
  const md5 = getMD5( source.trim() + target )

  const compilerOptions = Object.assign({}, options.compilerOptions, {
    scopeId: query.scoped ? `v-${id}` : null,
    comments: query.comments,
    realResourcePath,
    target,
    md5
  })

  loaderContext.megaloCacheToAllCompilerOptions(
    realResourcePath,
    compilerOptions
  )
  loaderContext.megaloCacheToTemplates(
    realResourcePath,
    {
      source,
      useCompiler: 'vue',
    }
  )

  // for vue-component-compiler
  const finalOptions = {
    source,
    filename: this.resourcePath,
    compiler,
    compilerOptions,
    // allow customizing behavior of vue-template-es2015-compiler
    transpileOptions: options.transpileOptions,
    transformAssetUrls: options.transformAssetUrls || true,
    isProduction,
    isFunctional,
    optimizeSSR: false
  }

  const compiled = compileTemplate(finalOptions)

  // tips
  if (compiled.tips && compiled.tips.length) {
    compiled.tips.forEach(tip => {
      loaderContext.emitWarning(tip)
    })
  }

  // errors
  if (compiled.errors && compiled.errors.length) {
    loaderContext.emitError(
      `\n  Error compiling template:\n${pad(compiled.source)}\n` +
        compiled.errors.map(e => `  - ${e}`).join('\n') +
        '\n'
    )
  }

  const { code } = compiled

  // finish with ESM exports
  return code + `\nexport { render, staticRenderFns }`
}

function pad (source) {
  return source
    .split(/\r?\n/)
    .map(line => `  ${line}`)
    .join('\n')
}
