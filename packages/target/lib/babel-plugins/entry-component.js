module.exports = function ( { types: t } ) {
  return {
    visitor: {
      ImportDeclaration( path ) {
        const bindings = path.scope.bindings
        if (
          t.isStringLiteral( path.node.source ) &&
          path.node.source.value === 'vue' &&
          t.isImportDefaultSpecifier( path.node.specifiers[ 0 ] ) &&
          t.isIdentifier( path.node.specifiers[ 0 ].local )
        ) {
          const vueCtorName = path.node.specifiers[ 0 ].local.name
          if ( bindings[ vueCtorName ] ) {
          	const referencePaths = findRefPaths( vueCtorName, bindings )
            const found = referencePaths.find( p => t.isNewExpression( p.parent ) )
          	const args = found.parent.arguments

            if ( args.length === 1 && t.isIdentifier( args[ 0 ] ) ) {
              const entryComponentCtorName = args[ 0 ].name
              const source = findSource( entryComponentCtorName, bindings )
              path.hub.file.metadata.megaloEntryComponent = source
            }
          }
        }

      }
    }
  }

  function findRefPaths( identifierName, bindings ) {
    const binding = bindings[ identifierName ]

    if ( !binding ) {
      return []
    }

    return binding.referencePaths || []
  }

  function findSource( identifierName, bindings ) {
    const binding = bindings[ identifierName ]
    if ( !binding ) {
      return
    }

    if ( t.isImportDeclaration( binding.path.parent ) ) {
      return binding.path.parent.source.value
    }
  }
}
