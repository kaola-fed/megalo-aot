const relativeToRoot = require( '../../shared/utils/relativeToRoot' )
const { ROOT_DATA_VAR } = require( '../../shared/utils/constants' )
const constants = require( '../constants' )

module.exports = function ( { file, entryComponent } = {} ) {
  const entryComponentPath = constants.COMPONENT_OUTPUT_PATH
    .replace( /\[name\]/g, entryComponent )

  return `
<import src="${ relativeToRoot( file ) }${ entryComponentPath }" />
<template is="${ entryComponent }" data="{{{ ...${ROOT_DATA_VAR}['0'], ${ROOT_DATA_VAR} }}}"/>
  `.trim()
}
