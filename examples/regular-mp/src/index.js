import App from './App'

const app = new App()

app.$inject()

const a = {obj: 1}
const b = {obj: 2}
const c = { a, ...b }
console.log( c )

export default {
  config: {
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#fff',
      navigationBarTitleText: 'WeChat',
      navigationBarTextStyle: 'black'
    },

    pages: [
      'pages/counter/index',
    ]
  }
}
