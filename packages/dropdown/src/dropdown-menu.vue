<template>
  <transition name="el-zoom-in-top" @after-leave="doDestroy">
    <ul class="el-dropdown-menu el-popper" :class="[size && `el-dropdown-menu--${size}`]" v-show="showPopper">
      <slot></slot>
    </ul>
  </transition>
</template>
<script>
  import Popper from 'element-ui/src/utils/vue-popper';

  export default {
    name: 'ElDropdownMenu',

    componentName: 'ElDropdownMenu',

    mixins: [Popper],

    props: {
      visibleArrow: {
        type: Boolean,
        default: true
      },
      arrowOffset: {
        type: Number,
        default: 0
      }
    },

    data() {
      return {
        size: this.dropdown.dropdownSize
      };
    },

    inject: ['dropdown'],

    created() {
      this.$on('updatePopper', () => {
        if (this.showPopper) this.updatePopper(); //展开的情况下，直接更新
      });
      this.$on('visible', val => {
        this.showPopper = val; //展开下拉菜单或者关闭
      });
    },

    mounted() {
      //组织popper2个元素，
      this.$parent.popperElm = this.popperElm = this.$el;
      this.referenceElm = this.$parent.$el;
    },

    watch: {
      //监听父组件的属性
      'dropdown.placement': {
        immediate: true,
        handler(val) {
          this.currentPlacement = val;
        }
      }
    }
  };
</script>
