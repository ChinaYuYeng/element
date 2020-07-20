<template>
  <!-- 颜色选择器的下拉部分 -->
  <transition name="el-zoom-in-top" @after-leave="doDestroy">
    <div
      class="el-color-dropdown"
      v-show="showPopper">
      <div class="el-color-dropdown__main-wrapper">
        <!-- 右侧色区选择 -->
        <hue-slider ref="hue" :color="color" vertical style="float: right;"></hue-slider>
        <!-- 左侧颜色值选择 -->
        <sv-panel ref="sl" :color="color"></sv-panel>
      </div>
      <!-- 显示透明度选择条 -->
      <alpha-slider v-if="showAlpha" ref="alpha" :color="color"></alpha-slider>
      <!-- 预设几种具体颜色供点击选择 -->
      <predefine v-if="predefine" :color="color" :colors="predefine"></predefine>
      <!-- 操作按钮组 -->
      <div class="el-color-dropdown__btns">
        <span class="el-color-dropdown__value">
          <el-input
            v-model="customInput"
            @keyup.native.enter="handleConfirm"
            @blur="handleConfirm"
            size="mini">
          </el-input>
        </span>
        <el-button
          size="mini"
          type="text"
          class="el-color-dropdown__link-btn"
          @click="$emit('clear')">
          {{ t('el.colorpicker.clear') }}
        </el-button>
        <el-button
          plain
          size="mini"
          class="el-color-dropdown__btn"
          @click="confirmValue">
          {{ t('el.colorpicker.confirm') }}
        </el-button>
      </div>
    </div>
  </transition>
</template>

<script>
  import SvPanel from './sv-panel';
  import HueSlider from './hue-slider';
  import AlphaSlider from './alpha-slider';
  import Predefine from './predefine';
  import Popper from 'element-ui/src/utils/vue-popper';
  import Locale from 'element-ui/src/mixins/locale';
  import ElInput from 'element-ui/packages/input';
  import ElButton from 'element-ui/packages/button';

  export default {
    name: 'el-color-picker-dropdown',

    mixins: [Popper, Locale],

    components: {
      SvPanel,
      HueSlider,
      AlphaSlider,
      ElInput,
      ElButton,
      Predefine
    },

    props: {
      color: {
        required: true
      },
      showAlpha: Boolean,
      predefine: Array
    },

    data() {
      return {
        customInput: '' //input框手动输入
      };
    },

    computed: {
      //组件当前颜色
      currentColor() {
        const parent = this.$parent;
        return !parent.value && !parent.showPanelColor ? '' : parent.color.value;
      }
    },

    methods: {
      //确认
      confirmValue() {
        this.$emit('pick');
      },
      //失去焦点事件，执行input写入的颜色
      handleConfirm() {
        this.color.fromString(this.customInput);
      }
    },

    mounted() {
      this.$parent.popperElm = this.popperElm = this.$el; //popper主元素
      this.referenceElm = this.$parent.$el; //popper从元素
    },

    watch: {
      //控制显示与否
      showPopper(val) {
        if (val === true) {
          this.$nextTick(() => {
            const { sl, hue, alpha } = this.$refs;
            sl && sl.update();
            hue && hue.update();
            alpha && alpha.update();
          });
        }
      },

      currentColor(val) {
        this.customInput = val; //当前颜色一变，input框跟着变
      }
    }
  };
</script>
