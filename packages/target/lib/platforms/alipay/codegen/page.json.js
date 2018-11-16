const {
  convertAppConfig,
  convertPageConfig
} = require( '../convert-config' )

module.exports = function ( { config, file } ) {
  let converted = {}
  if (file === 'app') {
    converted = convertAppConfig( config )
  } else {
    converted = convertPageConfig( config )
  }
  return JSON.stringify( converted, 0, 2 )
}
