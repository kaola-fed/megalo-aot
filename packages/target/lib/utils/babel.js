const tryRequire = require( './try-require' )

const babel = tryRequire( '@babel/core', 'babel-core' )

if ( !babel ) {
  throw new Error(
    'Missing peerDependencies @babel/core or babel-core '
  )
}

module.exports = {
  babel,
}
