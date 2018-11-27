const { TAG_MAP, EVENT_MAP } = require( './const' )

exports.dealDynamicAndStaticAttr = function ( attrs, staticAttr, dynamicAttr ) {
  const staticAstArr = attrs.filter( attr => attr.name === staticAttr )
  const dynamicAstArr = attrs.filter( attr => attr.name === dynamicAttr )
  const staticAst = staticAstArr[ staticAstArr.length > 0 ? staticAstArr.length - 1 : 0 ]
  const dynamicAst = dynamicAstArr[ dynamicAstArr.length > 0 ? dynamicAstArr.length - 1 : 0 ]

  let dynamic
  if ( staticAst && dynamicAst ) {
    if ( staticAst.holder ) {
      // if r-class/r-style class/style both have interpolation final holderId is class/style interpolation holderId
      dynamic = staticAst.value
    } else {
      dynamic = dynamicAst.value
    }
  } else if ( !staticAst && dynamicAst ) {
    dynamic = dynamicAst.value
  } else if ( staticAst && !dynamicAst ) {
    dynamic = staticAst.value
  } else {
    dynamic = ''
  }
  return dynamic
}

exports.transformTagName = function transformTagName( tagName ) {
  return TAG_MAP[ tagName ] || tagName
}

exports.transformEventName = function transformEventName( eventName ) {
  return EVENT_MAP[ eventName ] || eventName
}

exports.errorLog = function ( message ) {
  throw new Error( message )
}

const isNode = typeof process !== 'undefined' && ( String( process ) ) === '[object process]'

exports.nanoid = function () {
  if ( isNode ) {
    return require( 'nanoid' )()
  }
  const format = require( 'nanoid/format' )
  const random = require( 'nanoid/random-browser' )
  return format( random, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_~', 10 )
}
