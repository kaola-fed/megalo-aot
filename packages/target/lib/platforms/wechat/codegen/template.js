const relativeToRoot = require( '../utils/relativeToRoot' )

module.exports = function ( { file, entryComponent } = {} ) {
  return `
<import src="${ relativeToRoot( file ) }components/${ entryComponent }" />
<template is="${ entryComponent }" data="{{ ...$root['0'], $root }}"/>
  `.trim()
}
