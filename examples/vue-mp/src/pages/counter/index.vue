<template>
  <div class="app">
    <button @click="onMinus">-</button>
    {{ counter }}
    <button @click="onPlus">+</button>
    <abc>
      slot test
      <B />
    </abc>
  </div>
</template>

<script>
import A from './A.vue'
import B from './B.vue'
// import Test from './test'

export default {
  components: {
    'abc': A,
    B,
    // Test,
  },
  created() {
    console.log( 'created' )
  },

  data() {
    return {
      counter: 0
    }
  },

  methods: {
    onMinus() {
      this.counter = this.counter - 1
    },

    onPlus() {
      this.counter = this.counter + 1
    },
  }
}
</script>

<style lang="less" scoped>
  .app {
    font-size: 29px;
  }

  .app .foo {
    color: blue;
  }

  button {
    border: solid 1px #ddd;
  }

  view {
    line-height: 1;
  }
</style>

<style lang="css" scoped>
  .app1 {
    font-size: 29px;
  }

  .app /deep/ .aaa {
    color: blue;
  }
  .app >>> .aaa {
    color: blue;
  }

  >>> .b {
    color: blue;
  }

  /deep/ .b {
    color: blue;
  }
</style>

<config lang="yml">
pages:
    - pages/index
subpackages:
    -
     root: packageA
     pages:
     	- pages/test
    -
     root: pages/packageB
     pages:
     	- pages/test
window:
    backgroundTextStyle: light
    navigationBarBackgroundColor: '#fff'
    navigationBarTitleText: demo
    navigationBarTextStyle: black
</config>
