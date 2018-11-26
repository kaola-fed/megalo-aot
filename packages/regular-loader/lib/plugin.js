const qs = require('querystring')
const RuleSet = require('webpack/lib/RuleSet')

const id = 'regular-loader-plugin'
const NS = 'regular-loader'

class RegularLoaderPlugin {
  apply (compiler) {
    // add NS marker so that the loader can detect and report missing plugin
    if (compiler.hooks) {
      // webpack 4
      compiler.hooks.compilation.tap(id, compilation => {
        compilation.hooks.normalModuleLoader.tap(id, loaderContext => {
          loaderContext[NS] = true
        })
      })
    } else {
      // webpack < 4
      compiler.plugin('compilation', compilation => {
        compilation.plugin('normal-module-loader', loaderContext => {
          loaderContext[NS] = true
        })
      })
    }

    // use webpack's RuleSet utility to normalize user rules
    const rawRules = compiler.options.module.rules
    const { rules } = new RuleSet(rawRules)

    // find the rule that applies to rgl files
    let rglRuleIndex = rawRules.findIndex(createMatcher(`foo.rgl`))
    if (rglRuleIndex < 0) {
      rglRuleIndex = rawRules.findIndex(createMatcher(`foo.rgl.html`))
    }
    const rglRule = rules[rglRuleIndex]

    if (!rglRule) {
      throw new Error(
        `[RegularLoaderPlugin Error] No matching rule for .rgl files found.\n` +
        `Make sure there is at least one root-level rule that matches .rgl or .rgl.html files.`
      )
    }

    if (rglRule.oneOf) {
      throw new Error(
        `[RegularLoaderPlugin Error] regular-loader 2.x currently does not support rgl rules with oneOf.`
      )
    }

    // get the normlized "use" for rgl files
    const rglUse = rglRule.use
    // get regular-loader options
    const rglLoaderUseIndex = rglUse.findIndex(u => {
      return /^regular-loader|(\/|\\|@)regular-loader/.test(u.loader)
    })

    if (rglLoaderUseIndex < 0) {
      throw new Error(
        `[RegularLoaderPlugin Error] No matching use for regular-loader is found.\n` +
        `Make sure the rule matching .rgl files include regular-loader in its use.`
      )
    }

    // make sure regular-loader options has a known ident so that we can share
    // options by reference in the template-loader by using a ref query like
    // template-loader??regular-loader-options
    const rglLoaderUse = rglUse[rglLoaderUseIndex]
    rglLoaderUse.ident = 'regular-loader-options'
    rglLoaderUse.options = rglLoaderUse.options || {}

    // for each user rule (expect the rgl rule), create a cloned rule
    // that targets the corresponding language blocks in *.rgl files.
    const clonedRules = rules
      .filter(r => r !== rglRule)
      .map(cloneRule)

    // global pitcher (responsible for injecting template compiler loader & CSS
    // post loader)
    const pitcher = {
      loader: require.resolve('./loaders/pitcher'),
      resourceQuery: query => {
        const parsed = qs.parse(query.slice(1))
        return parsed.rgl != null
      },
      options: {
        cacheDirectory: rglLoaderUse.options.cacheDirectory,
        cacheIdentifier: rglLoaderUse.options.cacheIdentifier
      }
    }

    // replace original rules
    compiler.options.module.rules = [
      pitcher,
      ...clonedRules,
      ...rules
    ]
  }
}

function createMatcher (fakeFile) {
  return (rule, i) => {
    // #1201 we need to skip the `include` check when locating the rgl rule
    const clone = Object.assign({}, rule)
    delete clone.include
    const normalized = RuleSet.normalizeRule(clone, {}, '')
    return (
      !rule.enforce &&
      normalized.resource &&
      normalized.resource(fakeFile)
    )
  }
}

function cloneRule (rule) {
  const { resource, resourceQuery } = rule
  // Assuming `test` and `resourceQuery` tests are executed in series and
  // synchronously (which is true based on RuleSet's implementation), we can
  // save the current resource being matched from `test` so that we can access
  // it in `resourceQuery`. This ensures when we use the normalized rule's
  // resource check, include/exclude are matched correctly.
  let currentResource
  const res = Object.assign({}, rule, {
    resource: {
      test: resource => {
        currentResource = resource
        return true
      }
    },
    resourceQuery: query => {
      const parsed = qs.parse(query.slice(1))
      if (parsed.rgl == null) {
        return false
      }
      if (resource && parsed.lang == null) {
        return false
      }
      const fakeResourcePath = `${currentResource}.${parsed.lang}`
      if (resource && !resource(fakeResourcePath)) {
        return false
      }
      if (resourceQuery && !resourceQuery(query)) {
        return false
      }
      return true
    }
  })

  if (rule.oneOf) {
    res.oneOf = rule.oneOf.map(cloneRule)
  }

  return res
}

RegularLoaderPlugin.NS = NS
module.exports = RegularLoaderPlugin
