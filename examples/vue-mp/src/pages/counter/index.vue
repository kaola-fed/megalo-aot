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

export default {
  components: {
    'abc': A,
    B,
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
</style>

<style lang="css" scoped>
  .app1 {
    font-size: 29px;
  }
</style>

<config>
  {
    a: 1,
  }
</config>
