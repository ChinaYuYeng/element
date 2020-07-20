<template>
  <li
    class="el-dropdown-menu__item"
    :class="{
      'is-disabled': disabled,
      'el-dropdown-menu__item--divided': divided
    }"
    @click="handleClick"
    :aria-disabled="disabled"
    :tabindex="disabled ? null : -1"
  >
    <slot></slot>
  </li>
</template>
<script>
  import Emitter from 'element-ui/src/mixins/emitter';

  export default {
    name: 'ElDropdownItem',

    mixins: [Emitter],

    props: {
      command: {}, //可自定义数据，可以用来区别item
      disabled: Boolean,
      divided: Boolean
    },

    methods: {
      handleClick(e) {
        this.dispatch('ElDropdown', 'menu-item-click', [this.command, this]);//选项点击，向父组件触发事件
      }
    }
  };
</script>
