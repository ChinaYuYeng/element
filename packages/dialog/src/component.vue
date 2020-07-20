<template>
<!-- 动画 -->
  <transition
    name="dialog-fade"
    @after-leave="afterLeave">
    <!-- dialog外层 -->
    <div class="el-dialog__wrapper" v-show="visible" @click.self="handleWrapperClick">
      <div
        class="el-dialog"
        :class="[{ 'is-fullscreen': fullscreen, 'el-dialog--center': center }, customClass]"
        ref="dialog"
        :style="style">
        <div class="el-dialog__header">
          <slot name="title">
            <span class="el-dialog__title">{{ title }}</span>
          </slot>
          <button
            type="button"
            class="el-dialog__headerbtn"
            aria-label="Close"
            v-if="showClose"
            @click="handleClose">
            <i class="el-dialog__close el-icon el-icon-close"></i>
          </button>
        </div>
        <div class="el-dialog__body" v-if="rendered"><slot></slot></div>
        <div class="el-dialog__footer" v-if="$slots.footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
  import Popup from 'element-ui/src/utils/popup';
  import Migrating from 'element-ui/src/mixins/migrating';
  import emitter from 'element-ui/src/mixins/emitter';

  export default {
    name: 'ElDialog',

    mixins: [Popup, emitter, Migrating],

    props: {
      title: {
        type: String,
        default: ''
      },

      modal: {
        type: Boolean,
        default: true
      },

      modalAppendToBody: {
        type: Boolean,
        default: true
      },

      appendToBody: {
        type: Boolean,
        default: false
      },

      lockScroll: {
        type: Boolean,
        default: true
      },

      closeOnClickModal: {
        type: Boolean,
        default: true
      },

      closeOnPressEscape: {
        type: Boolean,
        default: true
      },

      showClose: {
        type: Boolean,
        default: true
      },

      width: String,

      fullscreen: Boolean,

      customClass: {
        type: String,
        default: ''
      },

      top: {
        type: String,
        default: '15vh'
      },
      beforeClose: Function,
      center: {
        type: Boolean,
        default: false
      }
    },

    data() {
      return {
        closed: false//当前弹框的状态
      };
    },

    watch: {
      visible(val) {
        if (val) {
          this.closed = false;
          this.$emit('open');
          //如果这个窗口可以滚动，那么实时更新内部的比如下拉框的下拉菜单和框之间的位置，否则，一滚动，下拉菜单没跟着走，不久尴尬了吗
          this.$el.addEventListener('scroll', this.updatePopper);
          this.$nextTick(() => {
            this.$refs.dialog.scrollTop = 0;
          });
          if (this.appendToBody) {
            document.body.appendChild(this.$el);
          }
        } else {
          this.$el.removeEventListener('scroll', this.updatePopper);
          if (!this.closed) this.$emit('close');
        }
      }
    },

    computed: {
      //设置样式
      style() {
        let style = {};
        if (this.width) {
          style.width = this.width;
        }
        if (!this.fullscreen) {
          style.marginTop = this.top;
        }
        return style;
      }
    },

    methods: {
      getMigratingConfig() {
        return {
          props: {
            'size': 'size is removed.'
          }
        };
      },
      handleWrapperClick() {
        //closeOnClickModal点击的其实不是modal，其实点击的是.el-dialog__wrapper
        if (!this.closeOnClickModal) return;
        this.handleClose();
      },
      //关闭dialog
      handleClose() {
        if (typeof this.beforeClose === 'function') {
          this.beforeClose(this.hide);//用户回调，传递关闭方法，支持手动关闭
        } else {
          this.hide();//关闭
        }
      },
      hide(cancel) {
        if (cancel !== false) {
          this.$emit('update:visible', false);//mix里的poper中有对visible监听（prop属性.sync更新数据）
          this.$emit('close');
          this.closed = true;
        }
      },
      //更新下拉选择框，下拉部分和输入框的位置关系
      updatePopper() {
        this.broadcast('ElSelectDropdown', 'updatePopper');
        this.broadcast('ElDropdownMenu', 'updatePopper');
      },
      //当动画结束的时候
      afterLeave() {
        this.$emit('closed');
      }
    },

//第一次创建组件的时候，visible是true，手动调用open(此时visible的监听是无效的，没有设置immediately)
    mounted() {
      if (this.visible) {
        this.rendered = true;
        this.open();
        if (this.appendToBody) {
          document.body.appendChild(this.$el);
        }
      }
    },

    destroyed() {
      // if appendToBody is true, remove DOM node after destroy
      if (this.appendToBody && this.$el && this.$el.parentNode) {
        this.$el.parentNode.removeChild(this.$el);
      }
    }
  };
</script>
