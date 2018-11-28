module.exports = function( api ) {
  api.cache.forever()

  return {
    presets: [ '@babel/preset-env' ],
    plugins: [ '@babel/plugin-proposal-object-rest-spread' ]
  }
}
