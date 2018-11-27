module.exports = function createHistory( initialState ) {
  return {
    _: initialState ?
      [ initialState ] :
      [],

    push( name, data ) {
      this._.push( { name, data } )
    },

    pop( name ) {
      if ( !name ) {
        this._.pop()
        return
      }

      const last = this.current()
      if ( last && ( last.name === name ) ) {
        this._.pop()
      }
    },

    current() {
      const len = this._.length
      const last = this._[ len - 1 ]
      return last
    },

    // search from start to end
    search( name ) {
      return this._.filter( v => v.name === name )
    },

    // search from end to start
    reverseSearch( name ) {
      return this.search( name ).reverse()
    },

    // search from end to start, but only return last one
    searchOne( name ) {
      return this.reverseSearch( name )[ 0 ]
    },

    all() {
      return this._
    }
  }
}
