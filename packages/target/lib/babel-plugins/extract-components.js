module.exports = function ( { types: t } ) {
  return {
    visitor: {

      ExportDefaultDeclaration( path ) {
        const declaration = path.node.declaration

        if ( t.isObjectExpression( declaration ) ) {
          handleObjectExpression( declaration, path )
        }
      },
      CallExpression( path ) {
        // parse components in typescript decorator
        if (isTypescriptDecorator(path)) {
          handleTypescriptDecorator(path)
        }
      }
    },
  }

  function handleObjectExpression( declaration, path ) {
    const componentsProperty = declaration.properties.filter( prop => {
      return t.isObjectProperty( prop ) && t.isIdentifier( prop.key ) &&
        prop.key.name === 'components'
    } )[ 0 ]

    if ( componentsProperty && t.isObjectExpression( componentsProperty.value ) ) {
      const properties = componentsProperty.value.properties
        .filter( prop => t.isObjectProperty( prop ) && t.isIdentifier( prop.value ) )

      const components = {}
      properties.forEach( prop => {
        // prop.key maybe Identifier or StringLiteral
        // Identifier use name, StringLiteral use value
        const key = prop.key.name || prop.key.value
        const value = prop.value.name
        const source = findSource( value, path.scope.bindings )

        components[ key ] = source
      } )

      path.hub.file.metadata.megaloComponents = components
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

  function isTypescriptDecorator( path ) {
    const { callee } = path.node
    return callee.name === '__decorate'
  }

  function handleTypescriptDecorator( path ) {
    const decorators = path.node.arguments[0].elements
    const componentDecorator = findComponentDecorator(decorators)
    if ( componentDecorator ) {
      const componentDeclaration = componentDecorator.arguments[0]
      if (t.isObjectExpression( componentDeclaration )) {
        handleObjectExpression( componentDeclaration, path.scope.parent.path )
      }
    }
  }

  function findComponentDecorator( decorators ) {
    return decorators.find(node => t.isCallExpression(node) && node.callee.name === 'Component')
  }
}
