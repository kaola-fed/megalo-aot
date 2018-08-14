module.exports = function removeExtension( str ) {
  return str.replace( /\.\w+$/g, '' )
}
