const { attrsToQuery } = require('./utils')

module.exports = function genStyleInjectionCode (
  loaderContext,
  styles,
  id,
  resourcePath,
  stringifyRequest,
) {
  let styleImportsCode = ``

  function genStyleRequest (style, i) {
    const src = style.src || resourcePath
    const attrsQuery = attrsToQuery(style.attrs, 'css')
    const inheritQuery = `&${loaderContext.resourceQuery.slice(1)}`
    // make sure to only pass id when necessary so that we don't inject
    // duplicate tags when multiple components import the same css file
    const idQuery = style.scoped ? `&id=${id}` : ``
    const query = `?rgl&type=style&index=${i}${idQuery}${attrsQuery}${inheritQuery}`
    return stringifyRequest(src + query)
  }

  styles.forEach((style, i) => {
    const request = genStyleRequest(style, i)
    styleImportsCode += `import style${i} from ${request}\n`
  })

  return styleImportsCode
}
