const clone = require( 'lodash.clonedeep' )
const Parser = require( './parser/Parser' )
const { transformTagName, transformEventName, nanoid, dealDynamicAndStaticAttr } = require( './helpers' )
const { PROXY_EVENT_HANDLER_NAME } = require( './const' )
const directives = require( './directives' )
const createHistory = require( './history' )
const node = require( './parser/node' )
const _ = require( './parser/util' )

class Compiler {
  compile( template, options = {} ) {
    const tp = new Parser( template, {} )
    this.ast = tp.parse()
    this.options = options

    this.usedComponents = []
    this.marks = {
      eventId: 0,
      localComponentIndex: 0,
      defaultSlotIndex: 0,
      rhtmlId: 0,
      holderId: 0,
      classId: 0
    }
    this.history = createHistory()
    this.usedExpressions = {
      get: {},
      set: {}
    }

    // parent should be component
    this.usedSlots = {
      default: {}
    }

    // mark whether need prefix `<import src="slots" />`
    this.hasInclude = false
    // mark whether need prefix `<import src="../wxparse/index" />`, global
    this.hasRhtml = false
    // mark whether need import all registered components
    this.hasRComponent = false

    const rendered = this.render( this.ast )

    let prefix = ''
    // prefix = prefix + ( this.hasInclude ? `<import src="slots" />\n` : '' )
    // prefix = prefix + ( this.hasRhtml ? `<import src="../wxparse/index" />\n` : '' )

    if ( this.hasRComponent ) {
      const registeredComponents = this.options.components || {}
      this.usedComponents = dedupe(
        Object.keys( registeredComponents )
          .map( k => registeredComponents[ k ] ),
        'name'
      )
    }

    const wxml = this.imports( {
      prefix,
      components: options.imports ?
        Object.keys( options.imports ).map( k => options.imports[ k ] ) :
        [],
      body: this.wrap( {
        name: options.name,
        body: rendered
      } ),
    } )

    const slots = this.renderSlots( this.usedSlots )

    const dependencies = this.usedComponents
      .map( c => {
        // find the same name in imports
        const foundKey = Object.keys( this.options.imports )
          .find( key => {
            const { name } = this.options.imports[ key ]
            return name === c.name
          } )
        const found = this.options.imports[ foundKey ]

        return found && found.name
      } )

    return {
      slots: Object.keys( this.usedSlots.default )
        .map( slotId => ( {
          slotName: slotId,
          body: this.wrap( {
            name: slotId,
            body: this.usedSlots.default[ slotId ]
          } ),
          dependencies: dependencies,
        } ) ),
      ast: this.ast,
      body: wxml,
      expressions: this.usedExpressions,
      needHtmlParse: !!this.hasRhtml,
    }
  }

  renderSlots( slots ) {
    const defaultSlotMap = slots.default
    return Object.keys( defaultSlotMap ).map( slotId => {
      return this.wrap( {
        name: slotId,
        body: defaultSlotMap[ slotId ]
      } )
    } ).join( '\n' )
  }

  wrap( { name, body } ) {
    return name ?
      `<template name="${ name }">${ body }</template>` :
      `${ body }`
  }

  imports( { prefix = '', components, body } ) {
    // const imports = components.map( c => `<import src="${ c.src }" />\n` ).join( '' )
    return prefix + body
  }

  saveExpression( expr ) {
    if ( !expr ) {
      return
    }

    /* eslint-disable */
    if ( expr.body ) {
      this.usedExpressions.get[ expr.body ] = new Function( _.ctxName, _.extName, _.prefix + 'return (' + expr.body + ')' )
    }

    if ( expr.setbody ) {
      this.usedExpressions.set[ expr.setbody ] = new Function( _.ctxName, _.setName, _.extName, _.prefix + 'return (' + expr.setbody + ')' )
    }
    /* eslint-enable */
  }

  render( ast ) {
    if ( Array.isArray( ast ) ) {
      return ast
        .map( v => this.render( v ) )
        .join( '' )
    }

    if ( typeof this[ ast.type ] === 'function' ) {
      return this[ ast.type ]( ast )
    }

    throw new Error( 'unexpected ast type "' + ast.type + '"' )
  }

  template( ast ) {
    this.hasInclude = true
    this.saveExpression( ast.content )
    // use parent data ($p)
    // import all slots first, who use this will give the $slot value
    // __indexMap represents indexes grabbed from list (in runtime)
    return '<template is="{{ $defaultSlot }}" data="{{ ...$root[ $p ], $root, ...__indexMap }}"></template>'
  }

  element( ast ) {
    const beforeTagName = ast.tag || 'div'
    let afterTagName = transformTagName( beforeTagName )
    const children = ast.children || []
    // do not pollute old ast
    const scopeId = this.options.scopeId

    // transform ast when element is in registered components
    const registeredComponents = this.options.components || {}
    const isComponent = Object.prototype.hasOwnProperty.call( registeredComponents, ast.tag ) ||
      ast.tag === 'r-component'

    let isRComponent = false
    if ( ast.tag === 'r-component' ) {
      isRComponent = this.hasRComponent = true
    }

    // runtime tagName and name map string
    const rComponentMapStrArray = []
    let rComponentMapStr = ''
    Object.keys( registeredComponents ).forEach( k => {
      const c = registeredComponents[ k ]
      rComponentMapStrArray.push( `'${ k }': '${ c.name }'` )
    } )
    rComponentMapStr = '{' + rComponentMapStrArray.join( ',' ) + '}'

    // use origin ast for modification purpose
    ast.attrs.forEach( attr => {
      const expr = attr.value || ''

      let holders = []
      if ( typeof expr === 'string' ) {
        holders = new Parser( expr, { mode: 2 } ).parse() || []
      } else if ( expr && expr.type === 'expression' ) {
        // <test attr={ value } />
        // without double quotes, expression has already been parsed in parser phase
        holders = [ expr ]
      }

      const onlySingleExpr = holders.length === 1 && holders[ 0 ].type === 'expression'
      let expressionStr = ''
      if ( !onlySingleExpr ) {
        let constant = true
        const body = []
        holders.forEach( function ( item ) {
          if ( !item.constant ) {
            constant = false
          }

          // silent the mutiple inteplation
          body.push( item.body || '\'' + item.text.replace( /'/g, '\\\'' ) + '\'' )
        } )
        const expr = node.expression( '[' + body.join( ',' ) + '].join(\'\')', null, constant )
        this.saveExpression( expr )

        expressionStr = expr ? expr.body : ''
      } else if ( onlySingleExpr ) {
        const expr = holders[ 0 ]
        this.saveExpression( expr )

        expressionStr = expr ? expr.body : ''
      }

      // add holder
      const expressionHolders = holders.filter( holder => {
        return holder.type === 'expression'
      } )
      const isStatic = expressionHolders.length === 0
      if ( isStatic ) {
        attr.holder = null
      } else {
        attr.holder = expressionHolders[ 0 ]
        attr.holder.holderId = this.marks.holderId
        attr.holder.body = expressionStr
        this.marks.holderId++
      }

      // holderId should not appear in component attrs
      // to ensure extra data will not be passed to setData
      // for performance purpose :)
      if ( isRComponent ) {
        if ( attr.holder && attr.name !== 'is' ) {
          delete attr.holder.holderId
        }
      } else if ( isComponent ) {
        if ( attr.holder ) {
          delete attr.holder.holderId
        }

        // remove unused holders to keep bundle slim
        // delete attr.holder
      }
    } )

    // clone after holderId is attached, we can use holderId later
    let attrs = clone( ast.attrs || [] )

    let hasSlot = false

    if ( isComponent && children && children.length > 0 ) {
      hasSlot = true
    }

    const defaultSlotId = nanoid()

    if ( isComponent ) {
      ast.localComponentIndex = this.marks.localComponentIndex

      const definition = registeredComponents[ ast.tag ]
      // saved for prefixing imports
      if ( definition && !~this.usedComponents.indexOf( definition ) ) {
        this.usedComponents.push( definition )
      }

      // change tag name to template
      afterTagName = 'template'

      const attrIs = attrs.find( attr => attr.name === 'is' )

      // clean all attrs, we only need `is` and `data`
      attrs = []

      if ( definition ) {
        attrs.push( {
          mdf: void 0,
          name: 'is',
          isRaw: true,
          type: 'attribute',
          value: definition.name
        } )
      } else if ( isRComponent && attrIs ) {
        attrs.push( attrIs )
      }

      const lists = this.history.search( 'list' )

      attrs.push( {
        mdf: void 0,
        name: 'data',
        isRaw: true,
        type: 'attribute',
        value: lists.length > 0 ?
          `{{ ...$root[ $kk + '${ this.marks.localComponentIndex }' ${ lists.map( list => `+ '-' + ${ list.data.index }` ).join( '' ) } ], $root, $defaultSlot: '${ hasSlot ? defaultSlotId : 'defaultSlot' }' }}` :
          `{{ ...$root[ $kk + '${ this.marks.localComponentIndex }' ], $root, $defaultSlot: '${ hasSlot ? defaultSlotId : 'defaultSlot' }' }}`
      } )

      this.marks.localComponentIndex++
    }

    // maybe attrs have two or more `r-hrml`s
    let hasRhtml = false

    let attributeStr = attrs
      .map( attr => {
        let value

        // if marked as isRaw, like `data` above
        if ( attr.isRaw || !attr.holder ) {
          value = attr.value
        } else if ( attr.holder ) {
          const lists = this.history.search( 'list' )
          const keypath = attr.holder.holderId +
              ( lists.length > 0 ? ' ' : '' ) +
              lists.map( list => `+ '-' + ${ list.data.index }` ).join( '' )

          value = attr.value = `{{ __holders[ ${ keypath } ] }}`
        }

        // class
        if ( attr.name === 'class' ) {
          return ''
        }

        if ( attr.name === 'style' ) {
          return ''
        }

        if ( attr.name === 'r-html' ) {
          hasRhtml = true
          return ''
        }

        // a[href] -> navigator[url]
        if ( beforeTagName === 'a' && attr.name === 'href' ) {
          return attr.value ? `url="${ value }"` : ''
        }

        // event
        if ( attr.name.startsWith( 'on-' ) ) {
          // modifier: capture | catch | capture-catch
          const modifier = attr.mdf
          const eventName = transformEventName( attr.name.slice( 3 ) )
          const map = {
            capture: 'capture-bind:',
            catch: 'catch',
            'capture-catch': 'capture-catch:'
          }
          const eventPrefix = ( modifier && map[ modifier ] ) ? map[ modifier ] : 'bind'
          return `${ eventPrefix }${ eventName }="${ PROXY_EVENT_HANDLER_NAME }"`
        }

        if ( attr.name.startsWith( 'delegate-' ) || attr.name.startsWith( 'de-' ) ) {
          console.warn( 'delegate|de-<event> is not supported, transpiled to bind<event> automatically' )
          const eventName = transformEventName( attr.name.slice( 3 ) )
          return `bind${ eventName }="proxyEvent"`
        }

        if ( typeof directives[ attr.name ] === 'function' ) {
          return directives[ attr.name ]( {
            attr,
            tag: ast,
            value
          } ) || ''
        }

        // others
        return `${ attr.name }="${ value }"`
      } )

    // deal dynamic class
    const classPrefix = `_${ beforeTagName }${ scopeId ? ' ' + scopeId : '' }`
    const dynamicClass = dealDynamicAndStaticAttr( attrs, 'class', 'r-class' )
    attributeStr.push( `class="${ classPrefix } ${ dynamicClass }"` )

    // deal dynamic style
    const dynamicStyle = dealDynamicAndStaticAttr( attrs, 'style', 'r-style' )
    if ( dynamicStyle ) {
      attributeStr.push( `style="${ dynamicStyle }"` )
    }

    attributeStr = attributeStr.filter( Boolean ).join( ' ' )

    const needEventId = attrs.some(
      attr => (
        attr.name === 'r-model' ||
        attr.name.startsWith( 'on-' ) ||
        attr.name.startsWith( 'delegate-' ) ||
        attr.name.startsWith( 'de-' )
      )
    )

    if ( needEventId ) {
      // comp-id of nested component should be defined at runtime
      const lists = this.history.search( 'list' )
      const eventId = this.marks.eventId + lists.map( list => `-{{ ${ list.data.index } }}` ).join( '' )
      attributeStr = attributeStr + ` data-event-id="${ eventId }" data-comp-id="{{ $k }}"`
      ast.eventId = eventId
      this.marks.eventId++
    }

    // always execute render to save slots and expression
    let childrenStr = this.render( children )

    if ( hasSlot ) {
      this.usedSlots.default[ defaultSlotId ] = childrenStr
    }

    // override children with r-html content
    /* @example
      <div r-html="{ foo }"></div>
      ->
      <div>
        <template is="wxParse" data="{{ wxParseData: __wxparsed[ '0' + '-' + item_index + '-' + item2_index ] ? __wxparsed[ '0' + '-' + item_index + '-' + item2_index ].nodes : [] }}"></template>
      </div>
    */
    if ( hasRhtml ) {
      const lists = this.history.search( 'list' )
      const keypath = this.marks.rhtmlId + ' ' + lists.map( list => `+ '-' + ${ list.data.index }` ).join( '' )

      if ( this.options.htmlParse ) {
        childrenStr = `<template is="${ this.options.htmlParse.templateName }" data="{{ nodes: __wxparsed[ ${ keypath } ] ? __wxparsed[ ${ keypath } ].nodes : [] }}"></template>`
      }

      ast.rhtmlId = this.marks.rhtmlId
      this.marks.rhtmlId++
      // for prefixing `import` after render complete
      this.hasRhtml = true
    }

    // re-map r-component is attribute to another holder
    let attrIs
    ast.attrs.forEach( attr => {
      if ( attr.name === 'is' ) {
        attrIs = attr
      }
    } )

    const main = `<${ afterTagName }${ attributeStr ? ' ' + attributeStr : '' }>${ isComponent ? '' : childrenStr }</${ afterTagName }>`

    if ( isRComponent && attrIs.holder ) {
      const lists = this.history.search( 'list' )
      const keypath = attrIs.holder.holderId +
          ( lists.length > 0 ? ' ' : '' ) +
          lists.map( list => `+ '-' + ${ list.data.index }` ).join( '' )

      const body = `( ${ rComponentMapStr } )[ ${ attrIs.holder.body } ]`
      const mockIs = {
        name: '_mocked_is_',
        type: 'attribute',
        value: attrIs.value,
        constant: false,
        holder: Object.assign( {}, attrIs.holder, {
          holderId: attrIs.holder.holderId,
          body,
          setbody: false
        } )
      }
      ast.attrs.push( mockIs )
      this.saveExpression( {
        body
      } )
      // del original holderId
      delete attrIs.holder.holderId

      return `<block wx:if="{{ __holders[ ${ keypath } ] }}">${ main }</block>`
    }

    return main
  }

  text( ast ) {
    return ast.text || ''
  }

  expression( ast ) {
    this.saveExpression( ast )

    // const hasFilter = ast.hasFilter
    // const hasCallExpression = ast.hasCallExpression

    delete ast.hasFilter
    delete ast.hasCallExpression

    if ( typeof ast.holderId === 'undefined' ) {
      ast.holderId = this.marks.holderId
      this.marks.holderId++
    }

    const lists = this.history.search( 'list' )
    const keypath = ast.holderId +
      ( lists.length > 0 ? ' ' : '' ) +
      lists.map( list => `+ '-' + ${ list.data.index }` ).join( '' )

    return `{{ __holders[ ${ keypath } ] }}`
  }

  'if'( ast ) {
    const condition = this.render( ast.test )
    this.saveExpression( ast.test )

    return `<block wx:if="${ condition }">${ this.render( ast.consequent ) }</block><block wx:else>${ this.render( ast.alternate ) }</block>`
  }

  list( ast ) {
    const sequence = this.render( ast.sequence )
    const variable = ast.variable
    const index = `${ variable }_index`
    const body = ast.body
    const trackby = ast.track && ast.track.raw
    let wxkey = ''

    this.saveExpression( ast.sequence )
    this.saveExpression( ast.track )

    // maybe not supported
    // if ( this.history.searchOne( 'list' ) ) {
    //   errorLog( 'nested {#list}{/list} is not supported' )
    // }

    this.history.push( 'list', { variable, index } )

    if ( trackby ) {
      if ( variable === trackby ) {
        wxkey = '*this'
      } else {
        wxkey = trackby.split( '.' )[ 1 ]
      }
    }

    const rendered = `<block wx:for="${ sequence }" wx:for-item="${ variable }" wx:for-index="${ index }"${ wxkey ? ' wx:key="' + wxkey + '"' : '' }>${ this.render( body ) }</block>`

    this.history.pop( 'list' )

    return rendered
  }
}

function dedupe( items, dedupeKey ) {
  const existed = {}

  return items.filter( item => {
    const value = item[ dedupeKey ]
    if ( !existed[ value ] ) {
      existed[ value ] = true
      return true
    }

    return false
  } )
}

module.exports = Compiler
