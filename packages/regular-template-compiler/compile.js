const Regular = require( 'regularjs' )
const htmlMinifier = require( 'html-minifier' )

module.exports = function( source = {}, options = {} ) {
  const { scopeId } = options

  const ast = Regular.parse( source )

  if ( scopeId ) {
    walkElement( ast, function ( node ) {
      node.attrs.push( {
        type: 'attribute',
        name: scopeId,
        value: ''
      } )
    } )
  }

  const transformedAstStr = transformAst( ast, {
    transformToRequire: {
      img: 'src'
    }
  } )

  let code = `
    var template = ${ transformedAstStr };
  `

  return {
    code,
  }
}

function transformAst( ast, options = {}) {
  const transformToRequire = options.transformToRequire || {}
  const map = {}

  // find all img:src
  walkElement( ast, function ( node ) {
    const attrName = transformToRequire[ node.tag ]

    // matched
    if (attrName) {
      node.attrs
        .filter( attr => attr.name === attrName )
        .forEach( attr => {
          if ( !loaderUtils.isUrlRequest( attr.value, process.cwd()) ) {
            return
          }

          // remove hash
          const uri = url.parse( attr.value )
          if ( uri.hash !== null && uri.hash !== undefined ) {
            uri.hash = null
            attr.value = uri.format()
          }

          // use string to make ast stringify-able
          const id = `_o_O_${ nanoid() }_O_o_`
          map[id] = attr.value
          attr.value = id
        } )
    }
  } )

  return JSON.stringify(ast).replace( /"(_o_O_[A-Za-z0-9_~]+_O_o_)"/g, function ( total, $1 ) {
    if ( !map[$1] ) {
      return total
    }

    return 'require(\'' + loaderUtils.urlToRequest(map[ $1], process.cwd()) + '\')'
  } )
}

function walkElement( tree, fn ) {
  tree.forEach( function ( v ) {
    if ( v.type === 'element' ) {
      fn( v )
      if ( v.children ) {
        walkElement( v.children, fn )
      }
    } else if ( v.type === 'if' ) {
      walkElement( v.alternate, fn )
      walkElement( v.consequent, fn )
    } else if ( v.type === 'list' ) {
      walkElement( v.body, fn )
    }
  } )
}

function removeWhitespace( content ) {
  return htmlMinifier.minify( content, {
    caseSensitive: true,
    collapseWhitespace: true,
    collapseInlineTagWhitespace: true,
    preserveLineBreaks: false,
    removeTagWhitespace: false,
    keepClosingSlash: true,
    ignoreCustomFragments: [ /\{[\s\S]*?\}/ ],
    trimCustomFragments: true,
    removeAttributeQuotes: false
  } )
}
