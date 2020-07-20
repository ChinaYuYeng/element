<template>
  <!-- 就一个i标签 给定名字，组成相应的class-->
  <i :class="'el-icon-' + name"></i>
</template>

<script>
  export default {
    name: 'ElIcon',

    props: {
      name: String
    }
  };
</script>
