<template>
  <transition name="el-notification-fade">
    <div
      :class="['el-notification', customClass, horizontalClass]"
      v-show="visible"
      :style="positionStyle"
      @mouseenter="clearTimer()"  
      @mouseleave="startTimer()"
      @click="click"
      role="alert"
    >
      <i
        class="el-notification__icon"
        :class="[ typeClass, iconClass ]"
        v-if="type || iconClass">
      </i>
      <div class="el-notification__group" :class="{ 'is-with-icon': typeClass || iconClass }">
        <h2 class="el-notification__title" v-text="title"></h2>
        <!-- 内容 -->
        <div class="el-notification__content" v-show="message">
          <slot>
            <!-- 这种写法是在外面没提供slot的时候默认显示的模板，外面提供会替换掉这个模板 -->
            <p v-if="!dangerouslyUseHTMLString">{{ message }}</p>
            <p v-else v-html="message"></p>
          </slot>
        </div>
        <div
          class="el-notification__closeBtn el-icon-close"
          v-if="showClose"
          @click.stop="close"></div>
      </div>
    </div>
  </transition>
</template>

<script type="text/babel">
  let typeMap = {
    success: 'success',
    info: 'info',
    warning: 'warning',
    error: 'error'
  };

  export default {
    data() {
      return {
        visible: false,
        title: '',
        message: '',
        duration: 4500,
        type: '',
        showClose: true,//是否显示关闭按钮
        customClass: '',
        iconClass: '',
        onClose: null,
        onClick: null,
        closed: false,
        verticalOffset: 0,
        timer: null,
        dangerouslyUseHTMLString: false,
        position: 'top-right'
      };
    },

    computed: {
      typeClass() {
        return this.type && typeMap[this.type] ? `el-icon-${ typeMap[this.type] }` : '';
      },

      horizontalClass() {
        return this.position.indexOf('right') > -1 ? 'right' : 'left';
      },

      verticalProperty() {
        return /^top-/.test(this.position) ? 'top' : 'bottom';
      },

      positionStyle() {
        return {
          [this.verticalProperty]: `${ this.verticalOffset }px`
        };
      }
    },

    watch: {
      //监听是否关闭状态
      closed(newVal) {
        if (newVal) {
          this.visible = false;
          this.$el.addEventListener('transitionend', this.destroyElement);//动画结束时销毁
        }
      }
    },

    methods: {
      //销毁组件
      destroyElement() {
        this.$el.removeEventListener('transitionend', this.destroyElement);//移除事件
        this.$destroy(true);//vue销毁
        this.$el.parentNode.removeChild(this.$el);//dom移除
      },
      //点击回调动作
      click() {
        if (typeof this.onClick === 'function') {
          this.onClick();
        }
      },
      //关闭的回调动作（外部提供）
      close() {
        this.closed = true;//设置状态
        if (typeof this.onClose === 'function') {
          this.onClose();
        }
      },
      //提供鼠标进入清楚计时
      clearTimer() {
        clearTimeout(this.timer);
      },
      //鼠标离开设置定时，多少时间后关闭
      startTimer() {
        if (this.duration > 0) {
          this.timer = setTimeout(() => {
            if (!this.closed) {
              this.close();
            }
          }, this.duration);
        }
      },
      keydown(e) {
        if (e.keyCode === 46 || e.keyCode === 8) {
          this.f(); // detele 取消倒计时
        } else if (e.keyCode === 27) { // esc关闭消息
          if (!this.closed) {
            this.close();
          }
        } else {
          this.startTimer(); // 恢复倒计时
        }
      }
    },
    mounted() {
      //展示之后设置定时 ，这段代码直接调用this.startTimer()不久行了
      if (this.duration > 0) {
        this.timer = setTimeout(() => {
          if (!this.closed) {
            this.close();
          }
        }, this.duration);
      }
      document.addEventListener('keydown', this.keydown);//绑定键盘事件
    },
    beforeDestroy() {
      document.removeEventListener('keydown', this.keydown);//移除
    }
  };
</script>

