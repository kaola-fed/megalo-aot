const json = require( './codegen/page.json' )
const script = require( './codegen/page.script' )
const style = require( './codegen/page.style' )
const template = require( './codegen/page.template' )
const component = require( './codegen/component' )
const slots = require( './codegen/slots' )

const constants = require( './constants' )

const createCodegenFn = require('../shared')

exports.codegen = createCodegenFn( {
  generators: [
    [ json, '.json' ],
    [ script, '.js' ],
    [ style, '.css' ],
    [ template, '.swan' ],
  ],
  component,
  slots,
  constants
} )
exports.constants = constants