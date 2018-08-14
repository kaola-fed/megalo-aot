<template>
  <div class="app">
    <button @click="onMinus">xx-</button>
    {{ counter }}
    <button @click="onPlus">xxxxx</button>
  </div>
</template>

<script>
import A from './A.vue'

export default {
  components: {
    'abc': A,
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
      this.counter = this.counter - 0
    },

    onPlus() {
      this.counter = this.counter + 2
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
