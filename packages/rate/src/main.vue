<template>
  <div
    class="el-rate"
    @keydown="handleKey"
    role="slider"
    :aria-valuenow="currentValue"
    :aria-valuetext="text"
    aria-valuemin="0"
    :aria-valuemax="max"
    tabindex="0">
    <!-- 一项 -->
    <span
      v-for="(item, key) in max"
      class="el-rate__item"
      @mousemove="setCurrentValue(item, $event)"
      @mouseleave="resetCurrentValue"
      @click="selectValue(item)"
      :style="{ cursor: rateDisabled ? 'auto' : 'pointer' }"
      :key="key">
      <!-- i里面是字体图标 -->
      <i
        :class="[classes[item - 1], { 'hover': hoverIndex === item }]"
        class="el-rate__icon"
        :style="getIconStyle(item)">
        <!-- 是否显示半个 ，显示半个其实就是上下2层，底下一层字体灰色，上面字体黄色，让后把上一层缩小一半就会显示半个字体-->
        <i
          v-if="showDecimalIcon(item)"
          :class="decimalIconClass"
          :style="decimalStyle"
          class="el-rate__decimal">
        </i>
      </i>
    </span>
    <!-- 显示文字或者分数 -->
    <span v-if="showText || showScore" class="el-rate__text" :style="{ color: textColor }">{{ text }}</span>
  </div>
</template>

<script>
  import { hasClass } from 'element-ui/src/utils/dom';
  import Migrating from 'element-ui/src/mixins/migrating';

  export default {
    name: 'ElRate',

    mixins: [Migrating],

    inject: {
      elForm: {
        default: ''
      }
    },

    data() {
      return {
        pointerAtLeftHalf: true,
        currentValue: this.value,
        hoverIndex: -1
      };
    },

    props: {
      // 外部通过v-model指令绑定value
      value: {
        type: Number,
        default: 0
      },
      lowThreshold: { //低分和中等分数的界限值，值本身被划分在低分中
        type: Number,
        default: 2
      },
      highThreshold: { //高分和中等分数的界限值，值本身被划分在高分中
        type: Number,
        default: 4
      },
      max: {
        type: Number,
        default: 5
      },
      colors: { //icon 的颜色数组
        type: Array,
        default() {
          return ['#F7BA2A', '#F7BA2A', '#F7BA2A'];
        }
      },
      voidColor: {
        type: String,
        default: '#C6D1DE'
      },
      disabledVoidColor: {
        type: String,
        default: '#EFF2F7'
      },
      iconClasses: {
        type: Array,
        default() {
          return ['el-icon-star-on', 'el-icon-star-on', 'el-icon-star-on'];
        }
      },
      voidIconClass: {
        type: String,
        default: 'el-icon-star-off'
      },
      disabledVoidIconClass: {
        type: String,
        default: 'el-icon-star-on'
      },
      disabled: {
        type: Boolean,
        default: false
      },
      allowHalf: {
        type: Boolean,
        default: false
      },
      showText: { //是否显示辅助文字，若为真，则会从 texts 数组中选取当前分数对应的文字内容
        type: Boolean,
        default: false
      },
      showScore: { //是否显示当前分数，show-score 和 show-text 不能同时为真
        type: Boolean,
        default: false
      },
      textColor: {
        type: String,
        default: '#1f2d3d'
      },
      texts: {
        type: Array,
        default() {
          return ['极差', '失望', '一般', '满意', '惊喜'];
        }
      },
      scoreTemplate: {
        type: String,
        default: '{value}'
      }
    },

    computed: {
      text() {
        let result = '';
        if (this.showScore) {
          result = this.scoreTemplate.replace(/\{\s*value\s*\}/, this.rateDisabled
            ? this.value
            : this.currentValue); //显示分数
        } else if (this.showText) {
          result = this.texts[Math.ceil(this.currentValue) - 1];//显示文字
        }
        return result;
      },
      //显示半个，样式计算
      decimalStyle() {
        let width = '';
        if (this.rateDisabled) {
          width = `${ this.valueDecimal < 50 ? 0 : 50 }%`;
        }
        if (this.allowHalf) {
          width = '50%';
        }
        return {
          color: this.activeColor,
          width
        };
      },
      //得到小数部分
      valueDecimal() {
        return this.value * 100 - Math.floor(this.value) * 100;
      },

      decimalIconClass() {
        return this.getValueFromMap(this.value, this.classMap);
      },

      voidClass() {
        return this.rateDisabled ? this.classMap.disabledVoidClass : this.classMap.voidClass;
      },

      //激活样式
      activeClass() {
        return this.getValueFromMap(this.currentValue, this.classMap);
      },

      colorMap() {
        return {
          lowColor: this.colors[0],
          mediumColor: this.colors[1],
          highColor: this.colors[2],
          voidColor: this.voidColor,
          disabledVoidColor: this.disabledVoidColor
        };
      },
      //激活图标颜色
      activeColor() {
        return this.getValueFromMap(this.currentValue, this.colorMap);
      },

      classes() {
        let result = [];
        let i = 0;
        let threshold = this.currentValue;
        if (this.allowHalf && this.currentValue !== Math.floor(this.currentValue)) {
          threshold--;
        }
        for (; i < threshold; i++) {
          result.push(this.activeClass);
        }
        for (; i < this.max; i++) {
          result.push(this.voidClass);
        }
        return result;
      },

      classMap() {
        return {
          lowClass: this.iconClasses[0],
          mediumClass: this.iconClasses[1],
          highClass: this.iconClasses[2],
          voidClass: this.voidIconClass,
          disabledVoidClass: this.disabledVoidIconClass
        };
      },

      rateDisabled() {
        return this.disabled || (this.elForm || {}).disabled;
      }
    },

    watch: {
      value(val) {
        this.currentValue = val;
        this.pointerAtLeftHalf = this.value !== Math.floor(this.value);
      }
    },

    methods: {
      getMigratingConfig() {
        return {
          props: {
            'text-template': 'text-template is renamed to score-template.'
          }
        };
      },
      //不同的值下，获得不同的颜色
      getValueFromMap(value, map) {
        let result = '';
        if (value <= this.lowThreshold) {
          result = map.lowColor || map.lowClass;
        } else if (value >= this.highThreshold) {
          result = map.highColor || map.highClass;
        } else {
          result = map.mediumColor || map.mediumClass;
        }
        return result;
      },

      showDecimalIcon(item) {
        let showWhenDisabled = this.rateDisabled && this.valueDecimal > 0 && item - 1 < this.value && item > this.value;
        /* istanbul ignore next */
        let showWhenAllowHalf = this.allowHalf &&
          this.pointerAtLeftHalf &&
          item - 0.5 <= this.currentValue &&
          item > this.currentValue;
        return showWhenDisabled || showWhenAllowHalf;
      },

      getIconStyle(item) {
        const voidColor = this.rateDisabled ? this.colorMap.disabledVoidColor : this.colorMap.voidColor;
        return {
          color: item <= this.currentValue ? this.activeColor : voidColor
        };
      },

      //触发各种事件
      selectValue(value) {
        if (this.rateDisabled) {
          return;
        }
        if (this.allowHalf && this.pointerAtLeftHalf) {
          this.$emit('input', this.currentValue); //通知v-model指令值变更
          this.$emit('change', this.currentValue);
        } else {
          this.$emit('input', value);
          this.$emit('change', value);
        }
      },

      handleKey(e) {
        if (this.rateDisabled) {
          return;
        }
        let currentValue = this.currentValue;
        const keyCode = e.keyCode;
        if (keyCode === 38 || keyCode === 39) { // left / down
          if (this.allowHalf) {
            currentValue += 0.5;
          } else {
            currentValue += 1;
          }
          e.stopPropagation();
          e.preventDefault();
        } else if (keyCode === 37 || keyCode === 40) {
          if (this.allowHalf) {
            currentValue -= 0.5;
          } else {
            currentValue -= 1;
          }
          e.stopPropagation();
          e.preventDefault();
        }
        currentValue = currentValue < 0 ? 0 : currentValue;
        currentValue = currentValue > this.max ? this.max : currentValue;

        this.$emit('input', currentValue);
        this.$emit('change', currentValue);
      },
      //鼠标移入设置
      setCurrentValue(value, event) {
        if (this.rateDisabled) {
          return;
        }
        /* istanbul ignore if */
        if (this.allowHalf) {
          let target = event.target;
          if (hasClass(target, 'el-rate__item')) {
            target = target.querySelector('.el-rate__icon');//找到字体图标
          }
          if (hasClass(target, 'el-rate__decimal')) { //支持半个显示
            target = target.parentNode;
          }
          this.pointerAtLeftHalf = event.offsetX * 2 <= target.clientWidth; //是否指在一半
          this.currentValue = this.pointerAtLeftHalf ? value - 0.5 : value; //设置值
        } else {
          this.currentValue = value;
        }
        this.hoverIndex = value;
      },
      //鼠标移出重置
      resetCurrentValue() {
        if (this.rateDisabled) {
          return;
        }
        if (this.allowHalf) {
          this.pointerAtLeftHalf = this.value !== Math.floor(this.value);
        }
        this.currentValue = this.value;
        this.hoverIndex = -1;
      }
    },

    created() {
      if (!this.value) {
        this.$emit('input', 0);
      }
    }
  };
</script>
