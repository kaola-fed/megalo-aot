<template>
  <div class="app">
    <button @click="onMinus">-</button>
    {{ counter }}
    <button @click="onPlus">+</button>
  </div>
</template>

<script>
export default {
  mpType: 'page',

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

<style lang="less">

</style>
