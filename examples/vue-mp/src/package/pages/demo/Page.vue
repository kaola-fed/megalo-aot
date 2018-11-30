<template>
  <div class="container">
    <Child>
      hello world!!!
    </Child>
    !!!
  </div>
</template>

<script>
  import Child from './Child'

  export default {
    components: {
      Child,
    },
  }
</script>

<style lang="less" scoped>
  .container {
    color: blue;
  }
</style>
