<template>
  <div
    :class="[
      'el-color-picker',
      colorDisabled ? 'is-disabled' : '',
      colorSize ? `el-color-picker--${ colorSize }` : ''
    ]"
    v-clickoutside="hide">
    <div class="el-color-picker__mask" v-if="colorDisabled"></div>
    <div class="el-color-picker__trigger" @click="handleTrigger">
      <span class="el-color-picker__color" :class="{ 'is-alpha': showAlpha }">
        <span class="el-color-picker__color-inner"
          :style="{
            backgroundColor: displayedColor
          }"></span>
          <!-- 按钮x -->
        <span class="el-color-picker__empty el-icon-close" v-if="!value && !showPanelColor"></span>
      </span>
        <!-- 按钮下 -->
      <span class="el-color-picker__icon el-icon-arrow-down" v-show="value || showPanelColor"></span>
    </div>
      <!-- 颜色选择器的下拉部分 -->
    <picker-dropdown
       ref="dropdown"
       :class="['el-color-picker__panel', popperClass || '']"
       v-model="showPicker"
       @pick="confirmValue"
       @clear="clearValue"
       :color="color"
       :show-alpha="showAlpha"
       :predefine="predefine">
    </picker-dropdown>
  </div>
</template>

<script>
  import Color from './color';
  import PickerDropdown from './components/picker-dropdown.vue';
  import Clickoutside from 'element-ui/src/utils/clickoutside';

  export default {
    name: 'ElColorPicker',

    props: {
      value: String,
      showAlpha: Boolean,
      colorFormat: String,
      disabled: Boolean,
      size: String,
      popperClass: String,
      predefine: Array
    },

    inject: {
      elForm: {
        default: ''
      },
      elFormItem: {
        default: ''
      }
    },

    directives: { Clickoutside },

    computed: {
      displayedColor() {
        if (!this.value && !this.showPanelColor) {
          //什么都没有的时候，显示透明
          return 'transparent';
        }
        
        return this.displayedRgb(this.color, this.showAlpha);
      },

      _elFormItemSize() {
        return (this.elFormItem || {}).elFormItemSize;
      },
      //尺寸大小
      colorSize() {
        return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size;
      },
      //是否可用
      colorDisabled() {
        return this.disabled || (this.elForm || {}).disabled;
      }
    },

    watch: {
      //外部传值
      value(val) {
        if (!val) {
          this.showPanelColor = false;
        } else if (val && val !== this.color.value) {
          //确保value的值和color内部的值一致
          this.color.fromString(val);
        }
      },
      //颜色对象变动
      color: {
        deep: true,
        handler() {
          this.showPanelColor = true;
        }
      },
      displayedColor(val) {
        if (!this.showPicker) return;
        const currentValueColor = new Color({
          enableAlpha: this.showAlpha,
          format: this.colorFormat
        });
        currentValueColor.fromString(this.value); // 内部的值

        const currentValueColorRgb = this.displayedRgb(currentValueColor, this.showAlpha); //内部的值转换成rgb()
        if (val !== currentValueColorRgb) {
          this.$emit('active-change', val);
        }
      }
    },

    methods: {
      //toggle 选择器
      handleTrigger() {
        if (this.colorDisabled) return;
        this.showPicker = !this.showPicker; 
      },
      //确认按钮
      confirmValue(value) {
        this.$emit('input', this.color.value);
        this.$emit('change', this.color.value);
        this.showPicker = false; //关闭选择器
      },
      //清理事件，关闭选择 ，清空按钮
      clearValue() {
        this.$emit('input', null);
        this.$emit('change', null);
        this.showPanelColor = false;
        this.showPicker = false;
        this.resetColor();
      },
      //关闭重置
      hide() {
        this.showPicker = false;
        this.resetColor();
      },

      //选完，没确认的情况下，重置颜色
      resetColor() {
        this.$nextTick(_ => {
          if (this.value) {
            this.color.fromString(this.value);
          } else {
            this.showPanelColor = false;
          }
        });
      },
      //返回css样式rgb(x,x,x,x)格式
      displayedRgb(color, showAlpha) {
        if (!(color instanceof Color)) {
          throw Error('color should be instance of Color Class');
        }

        const { r, g, b } = color.toRgb(); //转换成 rgb表示
        return showAlpha
          ? `rgba(${ r }, ${ g }, ${ b }, ${ color.get('alpha') / 100 })`
          : `rgb(${ r }, ${ g }, ${ b })`;
      }
    },

    mounted() {
      const value = this.value;
      if (value) {
        this.color.fromString(value); //这个颜色对象会保存这个value的转换值
      }
      this.popperElm = this.$refs.dropdown.$el;
    },

    data() {
      //创建一个颜色对象
      const color = new Color({
        enableAlpha: this.showAlpha, //是否使用透明度
        format: this.colorFormat //颜色格式
      });
      return {
        color, //颜色对象
        showPicker: false,
        showPanelColor: false //用来控制按钮图标x变v
      };
    },

    components: {
      PickerDropdown
    }
  };
</script>
