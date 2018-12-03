<template>
  <div class="container">
    <Child>
      hello world!!!
      <ChildInSlot></ChildInSlot>
    </Child>
    !!!
  </div>
</template>

<script>
  import Child from './Child'
  import ChildInSlot from './ChildInSlot.vue'

  export default {
    components: {
      Child,
      ChildInSlot,
    },
  }
</script>

<style lang="less" scoped>
  .container {
    color: blue;
  }
</style>
