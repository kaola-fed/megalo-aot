const { PROXY_EVENT_HANDLER_NAME } = require( './const' )
const { errorLog } = require( './helpers' )

module.exports = {
  'r-animation': notSupported,

  'r-anim': notSupported,

  'r-model': model,

  'r-hide': hide,

  'r-class': nothing,

  'r-style': nothing,
}

function nothing() {
  return ''
}

function model( { tag, value } = {} ) {
  const DEFAULT_EVENT_NAME = 'input'
  const tagEventMap = {
    input: 'input',
    textarea: 'input',
    select: 'change',
  }
  const tagName = tag.tag
  const eventName = tagEventMap[ tagName ] || DEFAULT_EVENT_NAME

  return `value="${ value }" bind${ eventName }="${ PROXY_EVENT_HANDLER_NAME }"`
}

function hide( { value } = {} ) {
  return `hidden="${ value }"`
}

function notSupported( { attr } = {} ) {
  errorLog( `${ attr.name } is not supported` )
}
