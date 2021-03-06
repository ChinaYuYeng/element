<template>
  <button
    class="el-button"
    @click="handleClick"
    :disabled="buttonDisabled || loading"
    :autofocus="autofocus"
    :type="nativeType"
    :class="[
      type ? 'el-button--' + type : '',
      buttonSize ? 'el-button--' + buttonSize : '',
      {
        'is-disabled': buttonDisabled,
        'is-loading': loading,
        'is-plain': plain,
        'is-round': round,
        'is-circle': circle
      }
    ]"
  >
    <i class="el-icon-loading" v-if="loading"></i>
    <i :class="icon" v-if="icon && !loading"></i>
    <span v-if="$slots.default"><slot></slot></span>
  </button>
</template>
<script>
  export default {
    name: 'ElButton',

    inject: {
      // provide提供语义良好的key比较好，parent会相互顶替也有特殊作用
      elForm: {
        default: ''
      },
      elFormItem: {
        default: ''
      }
    },

    props: {
      type: {// 按钮类型primary / success / warning / danger / info / text
        type: String,
        default: 'default'
      },
      size: String,
      icon: { // 自定义loading icon
        type: String,
        default: ''
      },
      nativeType: { // button标签的type，button，reset，submit
        type: String,
        default: 'button'
      },
      loading: Boolean, // 是否显示加载图标
      disabled: Boolean, // 是否可用
      plain: Boolean, // 是否普通
      autofocus: Boolean, // 是否自动获得焦点（整个页面应该只有一个）
      round: Boolean, // 是否圆角按钮
      circle: Boolean// 是否圆形按钮
    },

    computed: {
      _elFormItemSize() {
        return (this.elFormItem || {}).elFormItemSize;
      },
      // 大小
      buttonSize() {
        // this.$ELEMENT全局配置大小，这种设计也不错
        return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size;
      },
      // 是否可用
      buttonDisabled() {
        // 这样的设计不错，可以单独设置disabled，也可以依赖父组件。既能单独使用，又能联合使用
        return this.disabled || (this.elForm || {}).disabled;
      }
    },

    methods: {
      // click回调
      handleClick(evt) {
        this.$emit('click', evt);
      }
    }
  };
</script>
