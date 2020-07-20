<template>
  <span class="el-breadcrumb__item">
    <span
      :class="['el-breadcrumb__inner', to ? 'is-link' : '']"
      ref="link"
      role="link">
      <slot></slot>
    </span>
    <i v-if="separatorClass" class="el-breadcrumb__separator" :class="separatorClass"></i>
    <span v-else class="el-breadcrumb__separator" role="presentation">{{separator}}</span>
  </span>
</template>
<script>
  export default {
    name: 'ElBreadcrumbItem',
    props: {
      to: {},
      replace: Boolean // 路由跳转，是否覆盖
    },
    data() {
      return {
        separator: '',
        separatorClass: ''
      };
    },

    // 引入父节点
    inject: ['elBreadcrumb'],

    mounted() {
      this.separator = this.elBreadcrumb.separator; // 分隔符
      this.separatorClass = this.elBreadcrumb.separatorClass; // 分隔符样式
      const link = this.$refs.link;
      link.setAttribute('role', 'link');
      // 绑定连接点击事件
      link.addEventListener('click', _ => {
        const { to, $router } = this;
        if (!to || !$router) return;
        this.replace ? $router.replace(to) : $router.push(to);
      });
    }
  };
</script>
