module.exports = function ( entrypoints ) {
  const results = {}

  entrypoints.forEach( ( entrypoint, file ) => {
    const chunks = entrypoint.chunks || []
    const mainChunks = chunks.filter( c => !isSplitedChunk( c ) )
    const splitChunks = chunks.filter( c => isSplitedChunk( c ) )

    results[ file ] = {
      main: mainChunks.reduce( reduceChunk, {} ),
      split: splitChunks.reduce( reduceChunk, {} ),
    }
  } )

  return results
}

function mapExtension( extension ) {
  return function ( f ) {
    return f.endsWith( extension )
  }
}

function reduceChunk( all, c, i ) {
  all.js = all.js || []
  all.jsMap = all.jsMap || []
  all.style = all.style || []
  all.styleMap = all.styleMap || []
  all.js = all.js.concat( c.files.filter( mapExtension( '.js' ) ) )
  all.jsMap = all.jsMap.concat( c.files.filter( mapExtension( '.js.map' ) ) )
  all.style = all.style.concat( c.files.filter( mapExtension( '.wxss' ) ) )
  all.styleMap = all.styleMap.concat( c.files.filter( mapExtension( '.wxss.map' ) ) )
  return all
}

function isSplitedChunk( chunk ) {
  return typeof chunk.chunkReason !== 'undefined'
}
