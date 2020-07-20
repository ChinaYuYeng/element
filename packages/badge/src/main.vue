<template>
  <div class="el-badge">
    <slot></slot>
    <transition name="el-zoom-in-center">
      <!-- sup是html标签专业做角标的 -->
      <sup
        v-show="!hidden && (content || content === 0 || isDot)"
        v-text="content"
        class="el-badge__content"
        :class="{ 'is-fixed': $slots.default, 'is-dot': isDot }">
      </sup>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'ElBadge',

  props: {
    value: {}, //值
    max: Number,//最大值，超过最大值会显示 '{max}+'，要求 value 是 Number 类型
    isDot: Boolean,//小圆点
    hidden: Boolean //隐藏 badge （右上角）
  },

  computed: {
    //是否超出max的显示
    content() {
      if (this.isDot) return;

      const value = this.value;
      const max = this.max;

      if (typeof value === 'number' && typeof max === 'number') {
        return max < value ? `${max}+` : value;
      }

      return value;
    }
  }
};
</script>
