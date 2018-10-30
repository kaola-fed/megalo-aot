const relativeToRoot = require( '../../shared/utils/relativeToRoot' )
const constants = require( '../constants' )

module.exports = function ( { file, entryComponent } = {} ) {
  const entryComponentPath = constants.COMPONENT_OUTPUT_PATH
    .replace( /\[name\]/g, entryComponent )

  return `
<import src="${ relativeToRoot( file ) }${ entryComponentPath }" />
<template is="${ entryComponent }" data="{{ ...$root['0'], $root }}"/>
  `.trim()
}
