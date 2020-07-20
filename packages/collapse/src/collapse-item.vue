<template>
  <div class="el-collapse-item" :class="{'is-active': isActive}">
    <div
      role="tab"
      :aria-expanded="isActive"
      :aria-controls="`el-collapse-content-${id}`"
      :aria-describedby ="`el-collapse-content-${id}`"
    >
      <div
        class="el-collapse-item__header"
        @click="handleHeaderClick"
        role="button"
        :id="`el-collapse-head-${id}`"
        tabindex="0"
        @keyup.space.enter.stop="handleEnterClick"
        :class="{
          'focusing': focusing,
          'is-active': isActive
        }"
        @focus="handleFocus"
        @blur="focusing = false"
      >
        <i
          class="el-collapse-item__arrow el-icon-arrow-right"
          :class="{'is-active': isActive}">
        </i>
        <slot name="title">{{title}}</slot>
      </div>
    </div>
    <el-collapse-transition>
      <div
        class="el-collapse-item__wrap"
        v-show="isActive"
        role="tabpanel"
        :aria-hidden="!isActive"
        :aria-labelledby="`el-collapse-head-${id}`"
        :id="`el-collapse-content-${id}`"
      >
        <div class="el-collapse-item__content">
          <slot></slot>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>
<script>
  import ElCollapseTransition from 'element-ui/src/transitions/collapse-transition';
  import Emitter from 'element-ui/src/mixins/emitter';
  import { generateId } from 'element-ui/src/utils/util';

  export default {
    name: 'ElCollapseItem',

    componentName: 'ElCollapseItem',

    mixins: [Emitter],

    components: { ElCollapseTransition },

    data() {
      return {
        contentWrapStyle: {
          height: 'auto',
          display: 'block'
        },
        contentHeight: 0,
        focusing: false,
        isClick: false
      };
    },

    inject: ['collapse'],

    props: {
      title: String,
      name: { //item的唯一标识符
        type: [String, Number],
        default() {
          return this._uid;
        }
      }
    },

    computed: {
      //是否激活 ，判断父容器激活数据
      isActive() {
        return this.collapse.activeNames.indexOf(this.name) > -1;
      },
      id() {
        return generateId();
      }
    },

    methods: {
      handleFocus() {
        setTimeout(() => {
          if (!this.isClick) {
            this.focusing = true;
          } else {
            this.isClick = false;
          }
        }, 50);
      },
      //鼠标点击
      handleHeaderClick() {
        this.dispatch('ElCollapse', 'item-click', this);
        this.focusing = false;
        this.isClick = true;
      },
      //键盘enter
      handleEnterClick() {
        this.dispatch('ElCollapse', 'item-click', this);
      }
    }
  };
</script>
