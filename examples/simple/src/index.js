import App from './App'
import Vue from 'vue'

const mountNode = document.createElement( 'div' )
mountNode.id = 'app'
document.body.appendChild( mountNode )

const app = new Vue( App )

app.$mount( '#app' )

export default {
  config: {
    test: 1
  }
}
