module.exports = function createEntryHelper( entries = {} ) {
  return {
    isEntry: function isEntry( filepath = '' ) {
      return !!Object.keys( entries )
        .some( key => entries[ key ] === filepath )
    },

    getEntryKey: function getEntryKey( filepath = '' ) {
      return Object.keys( entries )
        .find( key => entries[ key ] === filepath )
    }
  }
}
