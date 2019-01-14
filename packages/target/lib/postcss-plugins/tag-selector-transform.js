const postcss = require( 'postcss' )
const parser = require( 'postcss-selector-parser' )
const ignoreTags = [
  'page'
]

module.exports = postcss.plugin( 'postcss-transform-tag', function ( ) {

  return function ( root, result ) {
    root.walkRules( rule => {
      const selector = parser( selectors => {
        selectors.walkTags( tag => {
          // ignore orignial
          if (
            ignoreTags.indexOf( tag.value ) === -1 &&
            !/^\d+%?$/.test( tag.value )
          ) {
            tag.value = `._${tag.value}`
          }
        } )
      } ).processSync( rule.selector )

      rule.selector = selector
    } )
  }
} )