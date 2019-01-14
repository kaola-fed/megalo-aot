const postcss = require( 'postcss' )
const parser = require( 'postcss-selector-parser' )
const ignoreTags = [
  'page'
]

module.exports = postcss.plugin( 'postcss-transform-tag', function ( ) {

  return function ( root, result ) {
    root.each(r => {
      if ( r.type !== 'atrule' || !/-keyframe/.test( r.name ) ) {
        const selector = parser( selectors => {
          selectors.walkTags( tag => {
            // ignore orignial
            if ( ignoreTags.indexOf( tag.value ) === -1 ) {
              tag.value = `._${tag.value}`
            }
          } )
        } ).processSync( r.selector )
        r.selector = selector
      }
    })
  }
} )