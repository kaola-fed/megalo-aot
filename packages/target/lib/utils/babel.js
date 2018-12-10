const babel = require( 'babel-core' )

if ( !babel ) {
  throw new Error(
    'Missing peerDependencies @babel/core or babel-core '
  )
}

module.exports = {
  babel,
}
