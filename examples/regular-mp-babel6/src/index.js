import App from './App'

const app = new App()

app.$inject()

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
