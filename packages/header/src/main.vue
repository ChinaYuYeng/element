<template>
  <!-- html header元素 接受一个高度 -->
  <header class="el-header" :style="{ height }">
    <slot></slot>
  </header>
</template>

<script>
  export default {
    name: 'ElHeader',

    componentName: 'ElHeader',

    props: {
      height: {
        type: String,
        default: '60px'
      }
    }
  };
</script>
