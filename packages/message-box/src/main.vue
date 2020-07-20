<template>
  <transition name="msgbox-fade">
    <div
      class="el-message-box__wrapper"
      tabindex="-1"
      v-show="visible"
      @click.self="handleWrapperClick"
      role="dialog"
      aria-modal="true"
      :aria-label="title || 'dialog'">
      <div class="el-message-box" :class="[customClass, center && 'el-message-box--center']">
        <!-- 标题 -->
        <div class="el-message-box__header" v-if="title !== null">
          <div class="el-message-box__title">
            <div
              :class="['el-message-box__status', icon]"
              v-if="icon && center">
            </div>
            <span>{{ title }}</span>
          </div>
          <!-- 右侧控制按钮关闭 -->
          <button
            type="button"
            class="el-message-box__headerbtn"
            aria-label="Close"
            v-if="showClose"
            @click="handleAction(distinguishCancelAndClose ? 'close' : 'cancel')"
            @keydown.enter="handleAction(distinguishCancelAndClose ? 'close' : 'cancel')">
            <i class="el-message-box__close el-icon-close"></i>
          </button>
        </div>
        <!-- 内容 -->
        <div class="el-message-box__content">
          <!-- 图标 -->
          <div
            :class="['el-message-box__status', icon]"
            v-if="icon && !center && message !== ''">
          </div>
          <!-- 文本内容 -->
          <div class="el-message-box__message" v-if="message !== ''">
            <slot>
              <p v-if="!dangerouslyUseHTMLString">{{ message }}</p>
              <p v-else v-html="message"></p>
            </slot>
          </div>
          <!-- 输入框 -->
          <div class="el-message-box__input" v-show="showInput">
            <el-input
              v-model="inputValue"
              :type="inputType"
              @keydown.enter.native="handleInputEnter"
              :placeholder="inputPlaceholder"
              ref="input"></el-input>
            <div class="el-message-box__errormsg" :style="{ visibility: !!editorErrorMessage ? 'visible' : 'hidden' }">{{ editorErrorMessage }}</div>
          </div>
        </div>
        <!-- 右下控制按钮 -->
        <div class="el-message-box__btns">
          <el-button
            :loading="cancelButtonLoading"
            :class="[ cancelButtonClasses ]"
            v-if="showCancelButton"
            :round="roundButton"
            size="small"
            @click.native="handleAction('cancel')"
            @keydown.enter="handleAction('cancel')">
            {{ cancelButtonText || t('el.messagebox.cancel') }}
          </el-button>
          <el-button
            :loading="confirmButtonLoading"
            ref="confirm"
            :class="[ confirmButtonClasses ]"
            v-show="showConfirmButton"
            :round="roundButton"
            size="small"
            @click.native="handleAction('confirm')"
            @keydown.enter="handleAction('confirm')">
            {{ confirmButtonText || t('el.messagebox.confirm') }}
          </el-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script type="text/babel">
  import Popup from 'element-ui/src/utils/popup';  //弹出层控制逻辑
  import Locale from 'element-ui/src/mixins/locale';
  import ElInput from 'element-ui/packages/input';
  import ElButton from 'element-ui/packages/button';
  import { addClass, removeClass } from 'element-ui/src/utils/dom';
  import { t } from 'element-ui/src/locale';
  import Dialog from 'element-ui/src/utils/aria-dialog';

  let messageBox; //diaolog实例
  //消息类型
  let typeMap = {
    success: 'success',
    info: 'info',
    warning: 'warning',
    error: 'error'
  };

  export default {
    mixins: [Popup, Locale],

    props: {
      modal: {
        default: true
      },
      lockScroll: {
        default: true
      },
      showClose: {
        type: Boolean,
        default: true
      },
      closeOnClickModal: {
        default: true
      },
      closeOnPressEscape: {
        default: true
      },
      closeOnHashChange: {
        default: true
      },
      center: {
        default: false,
        type: Boolean
      },
      roundButton: {
        default: false,
        type: Boolean
      }
    },

    components: {
      ElInput,
      ElButton
    },

    computed: {
      icon() {
        const { type, iconClass } = this;
        return iconClass || (type && typeMap[type] ? `el-icon-${ typeMap[type] }` : '');
      },

      confirmButtonClasses() {
        return `el-button--primary ${ this.confirmButtonClass }`;
      },
      cancelButtonClasses() {
        return `${ this.cancelButtonClass }`;
      }
    },

    methods: {
      getSafeClose() {
        const currentId = this.uid;
        return () => {  //返回一个方法 在beforeClose中调用安全关闭
          this.$nextTick(() => {
            if (currentId === this.uid) this.doClose(); 
          });
        };
      },
      //关闭操作
      doClose() {
        if (!this.visible) return;
        this.visible = false;
        this._closing = true; 

        this.onClose && this.onClose(); //close用户回调
        messageBox.closeDialog(); // 解绑，关闭dialog
        if (this.lockScroll) {
          setTimeout(this.restoreBodyStyle, 200);
        }
        this.opened = false;
        this.doAfterClose(); //关闭之后的回调 
        setTimeout(() => {
          if (this.action) this.callback(this.action, this); //这个cb基本就是defaultCallback
        });
      },
      //外层点击行为
      handleWrapperClick() {
        if (this.closeOnClickModal) {
          this.handleAction(this.distinguishCancelAndClose ? 'close' : 'cancel');
        }
      },
      //回车键
      handleInputEnter() {
        if (this.inputType !== 'textarea') {
          return this.handleAction('confirm');
        }
      },

      handleAction(action) {
        if (this.$type === 'prompt' && action === 'confirm' && !this.validate()) {
          //在prompt中确认之后验证不过的，返回
          return;
        }
        this.action = action;
        if (typeof this.beforeClose === 'function') {
          //执行回调
          this.close = this.getSafeClose();
          this.beforeClose(action, this, this.close);
        } else {
          //关闭
          this.doClose();
        }
      },

      validate() {
        if (this.$type === 'prompt') {
          //只有prompt会校验
          const inputPattern = this.inputPattern; //外部提供的正则
          if (inputPattern && !inputPattern.test(this.inputValue || '')) {
            this.editorErrorMessage = this.inputErrorMessage || t('el.messagebox.error');
            addClass(this.getInputElement(), 'invalid');
            return false;
          }
          const inputValidator = this.inputValidator; //外部提供的验证方法
          if (typeof inputValidator === 'function') {
            const validateResult = inputValidator(this.inputValue);
            if (validateResult === false) {
              this.editorErrorMessage = this.inputErrorMessage || t('el.messagebox.error');
              addClass(this.getInputElement(), 'invalid');
              return false;
            }
            if (typeof validateResult === 'string') {
              this.editorErrorMessage = validateResult;
              addClass(this.getInputElement(), 'invalid');
              return false;
            }
          }
        }
        // 验证通过  了
        this.editorErrorMessage = ''; //clear 
        removeClass(this.getInputElement(), 'invalid'); //clear非法样式
        return true;
      },
      //获取第一个聚焦的元素
      getFirstFocus() {
        const btn = this.$el.querySelector('.el-message-box__btns .el-button');
        const title = this.$el.querySelector('.el-message-box__btns .el-message-box__title');
        return btn || title;
      },
      //获得内部的dom元素input或者textarea
      getInputElement() {
        const inputRefs = this.$refs.input.$refs;
        return inputRefs.input || inputRefs.textarea; 
      }
    },

    watch: {
      //输入值监听，实时校验
      inputValue: {
        immediate: true,
        handler(val) {
          this.$nextTick(_ => {
            if (this.$type === 'prompt' && val !== null) {
              this.validate();
            }
          });
        }
      },

      //给予visible新的操作，包括puper中也有visible
      visible(val) {
        if (val) { //true
          this.uid++;
          if (this.$type === 'alert' || this.$type === 'confirm') {
            this.$nextTick(() => {
              this.$refs.confirm.$el.focus();
            });
          }
          this.focusAfterClosed = document.activeElement; //关闭之后的聚焦元素
          //创建dialog显示
          messageBox = new Dialog(this.$el, this.focusAfterClosed, this.getFirstFocus()); 
        }

        // prompt
        if (this.$type !== 'prompt') return;
        if (val) {//有输入框
          setTimeout(() => {
            if (this.$refs.input && this.$refs.input.$el) {
              this.getInputElement().focus(); //聚焦输入框
            }
          }, 500);
        } else {
          this.editorErrorMessage = '';
          removeClass(this.getInputElement(), 'invalid');
        }
      }
    },

    mounted() {
      this.$nextTick(() => {
        if (this.closeOnHashChange) {
          //对浏览器地址hash（#后部分）改变监听，相当于改变路由
          window.addEventListener('hashchange', this.close);
        }
      });
    },

    beforeDestroy() {
      if (this.closeOnHashChange) {
        window.removeEventListener('hashchange', this.close);
      }
      setTimeout(() => {
        messageBox.closeDialog();
      });
    },

    data() {
      return {
        uid: 1,
        title: undefined,
        message: '',
        type: '',
        iconClass: '',
        customClass: '',
        showInput: false,
        inputValue: null,
        inputPlaceholder: '',
        inputType: 'text',
        inputPattern: null,
        inputValidator: null,
        inputErrorMessage: '',
        showConfirmButton: true,
        showCancelButton: false,
        action: '',
        confirmButtonText: '',
        cancelButtonText: '',
        confirmButtonLoading: false,
        cancelButtonLoading: false,
        confirmButtonClass: '',
        confirmButtonDisabled: false,
        cancelButtonClass: '',
        editorErrorMessage: null,
        callback: null,
        dangerouslyUseHTMLString: false,
        focusAfterClosed: null,
        isOnComposition: false,
        distinguishCancelAndClose: false
      };
    }
  };
</script>
