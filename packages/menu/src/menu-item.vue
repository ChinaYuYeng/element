<template>
  <li class="el-menu-item"
    role="menuitem"
    tabindex="-1"
    :style="[paddingStyle, itemStyle, { backgroundColor }]"
    :class="{
      'is-active': active,
      'is-disabled': disabled
    }"
    @click="handleClick"
    @mouseenter="onMouseEnter"
    @focus="onMouseEnter"
    @blur="onMouseLeave"
    @mouseleave="onMouseLeave"
  >
    <!--在折叠的情况下， item是elmenu的直接直接子节点的，会有一个tooltip ，是submenu的是popper-->
    <el-tooltip
      v-if="parentMenu.$options.componentName === 'ElMenu' && rootMenu.collapse && $slots.title"
      effect="dark"
      placement="right">
      <div slot="content"><slot name="title"></slot></div>
      <div style="position: absolute;left: 0;top: 0;height: 100%;width: 100%;display: inline-block;box-sizing: border-box;padding: 0 20px;">
        <slot></slot>
      </div>
    </el-tooltip>
    <template v-else>
      <slot></slot>
      <slot name="title"></slot>
    </template>
  </li>
</template>
<script>
  import Menu from './menu-mixin';
  import ElTooltip from 'element-ui/packages/tooltip';
  import Emitter from 'element-ui/src/mixins/emitter';

  export default {
    name: 'ElMenuItem',

    componentName: 'ElMenuItem',

    mixins: [Menu, Emitter],

    components: { ElTooltip },

    props: {
      index: {
        type: String,
        required: true
      },
      route: [String, Object],
      disabled: Boolean
    },
    computed: {
      // 是否是活跃项
      active() {
        return this.index === this.rootMenu.activeIndex;
      },
      hoverBackground() {
        return this.rootMenu.hoverBackground;
      },
      backgroundColor() {
        return this.rootMenu.backgroundColor || '';
      },
      activeTextColor() {
        return this.rootMenu.activeTextColor || '';
      },
      textColor() {
        return this.rootMenu.textColor || '';
      },
      // 横向或者垂直
      mode() {
        return this.rootMenu.mode;
      },
      itemStyle() {
        const style = {
          color: this.active ? this.activeTextColor : this.textColor
        };
        // 如果是横向的并且根节点的直接子元素 （就是下划线变色）
        if (this.mode === 'horizontal' && !this.isNested) {
          style.borderBottomColor = this.active
            // 判断rootMenu是否有设置字体颜色（由prop传递），没有就使用自定义值
            ? (this.rootMenu.activeTextColor ? this.activeTextColor : '')
            : 'transparent';
        }
        return style;
      },
      // 是不是根节点的直接子节点
      isNested() {
        return this.parentMenu !== this.rootMenu;
      }
    },
    methods: {
      // 设置悬停色
      onMouseEnter() {
        if (this.mode === 'horizontal' && !this.rootMenu.backgroundColor) return;
        this.$el.style.backgroundColor = this.hoverBackground;
      },
      // 恢复原来背景色
      onMouseLeave() {
        if (this.mode === 'horizontal' && !this.rootMenu.backgroundColor) return;
        this.$el.style.backgroundColor = this.backgroundColor;
      },
      // 在不是不可用的情况下，通知elmenu节点，和自己的父节点
      handleClick() {
        if (!this.disabled) {
          this.dispatch('ElMenu', 'item-click', this);
          this.$emit('click', this);
        }
      }
    },
    mounted() {
      // 把自己加入到最近的父节点容器
      this.parentMenu.addItem(this);
      // 把自己加入根节点
      this.rootMenu.addItem(this);
    },
    beforeDestroy() {
      // 销毁之前从父节点删除
      this.parentMenu.removeItem(this);
      // 销毁之前从根节点销毁
      this.rootMenu.removeItem(this);
    }
  };
</script>
