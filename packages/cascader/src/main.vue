<template>
  <!-- 全组件 -->
  <span
    class="el-cascader"
    :class="[
      {
        'is-opened': menuVisible,
        'is-disabled': cascaderDisabled
      },
      cascaderSize ? 'el-cascader--' + cascaderSize : ''
    ]"
    @click="handleClick"
    @mouseenter="inputHover = true"
    @focus="inputHover = true"
    @mouseleave="inputHover = false"
    @blur="inputHover = false"
    ref="reference"
    v-clickoutside="handleClickoutside"
    @keydown="handleKeydown"
  >
    <!-- 主体input框 -->
    <el-input
      ref="input"
      :readonly="readonly"
      :placeholder="currentLabels.length ? undefined : placeholder"
      v-model="inputValue"
      @input="debouncedInputChange"
      @focus="handleFocus"
      @blur="handleBlur"
      @compositionstart.native="handleComposition"
      @compositionend.native="handleComposition"
      :validate-event="false"
      :size="size"
      :disabled="cascaderDisabled"
    >
    <!-- 右边小图标 -->
      <template slot="suffix">
        <i
          key="1"
          v-if="clearable && inputHover && currentLabels.length"
          class="el-input__icon el-icon-circle-close el-cascader__clearIcon"
          @click="clearValue"
        ></i>
        <i
          key="2"
          v-else
          class="el-input__icon el-icon-arrow-down"
          :class="{ 'is-reverse': menuVisible }"
        ></i>
      </template>
    </el-input>
    <!-- 级联选择之后的完成路径，比如 A/B/c -->
    <span class="el-cascader__label" v-show="inputValue === '' && !isOnComposition">
      <template v-if="showAllLevels">
        <!-- 全部显示 -->
        <template v-for="(label, index) in currentLabels">
          {{ label }}
          <span v-if="index < currentLabels.length - 1" :key="index"> {{ separator }} </span>
        </template>
      </template>
      <template v-else>
        <!-- 只显示最后一个 -->
        {{ currentLabels[currentLabels.length - 1] }}
      </template>
    </span>
  </span>
</template>

<script>
import Vue from 'vue';
import ElCascaderMenu from './menu';
import ElInput from 'element-ui/packages/input';
import Popper from 'element-ui/src/utils/vue-popper';
import Clickoutside from 'element-ui/src/utils/clickoutside';
import emitter from 'element-ui/src/mixins/emitter';
import Locale from 'element-ui/src/mixins/locale';
import { t } from 'element-ui/src/locale';
import debounce from 'throttle-debounce/debounce';
import { generateId } from 'element-ui/src/utils/util';

// 重新定义popperMix
const popperMixin = {
  props: {
    placement: {
      type: String,
      default: 'bottom-start'
    },
    appendToBody: Popper.props.appendToBody,
    arrowOffset: Popper.props.arrowOffset,
    offset: Popper.props.offset,
    boundariesPadding: Popper.props.boundariesPadding,
    popperOptions: Popper.props.popperOptions
  },
  methods: Popper.methods,
  data: Popper.data,
  beforeDestroy: Popper.beforeDestroy
};

export default {
  name: 'ElCascader',

  directives: { Clickoutside },

  mixins: [popperMixin, emitter, Locale],

  // 也是和form配合使用
  inject: {
    elForm: {
      default: ''
    },
    elFormItem: {
      default: ''
    }
  },

  components: {
    ElInput
  },

  props: {
    options: { // 和tree的数据结构相仿
      type: Array,
      required: true
    },
    props: { // 每一项的属性定义，映射关系
      type: Object,
      default() {
        return {
          children: 'children',
          label: 'label',
          value: 'value',
          disabled: 'disabled'
        };
      }
    },
    value: { // 选中项
      type: Array,
      default() {
        return [];
      }
    },
    separator: { // 显示路径的分隔符
      type: String,
      default: '/'
    },
    placeholder: {
      type: String,
      default() {
        return t('el.cascader.placeholder');
      }
    },
    disabled: Boolean,
    clearable: { // 是否显示清空图标
      type: Boolean,
      default: false
    },
    changeOnSelect: Boolean,
    popperClass: String,
    expandTrigger: { // 次级菜单的展开方式
      type: String,
      default: 'click'
    },
    filterable: Boolean, // 是否可搜索选项
    size: String,
    showAllLevels: { // 输入框中是否显示选中值的完整路径
      type: Boolean,
      default: true
    },
    debounce: { // 搜索关键词输入的去抖延迟，毫秒
      type: Number,
      default: 300
    },
    beforeFilter: {
      type: Function,
      default: () => (() => {})
    },
    hoverThreshold: {
      type: Number,
      default: 500
    }
  },

  data() {
    return {
      currentValue: this.value || [],
      menu: null,
      debouncedInputChange() {},
      menuVisible: false,
      inputHover: false,
      inputValue: '',
      flatOptions: null,
      id: generateId(),
      needFocus: true,
      isOnComposition: false
    };
  },

  computed: {
    // 属性映射搞成computed方便点
    labelKey() {
      return this.props.label || 'label';
    },
    valueKey() {
      return this.props.value || 'value';
    },
    childrenKey() {
      return this.props.children || 'children';
    },
    disabledKey() {
      return this.props.disabled || 'disabled';
    },
    // 根据value获得label
    currentLabels() {
      let options = this.options;
      let labels = [];
      this.currentValue.forEach(value => {
        const targetOption = options && options.filter(option => option[this.valueKey] === value)[0];
        if (targetOption) {
          labels.push(targetOption[this.labelKey]);// 就是为了得到label
          options = targetOption[this.childrenKey];// 改变遍历的对象，切换到子节点，对应相应的value，在foreach中动态改变opations，值得借鉴
        }
      });
      return labels;
    },
    _elFormItemSize() {
      return (this.elFormItem || {}).elFormItemSize;
    },
    // 大小
    cascaderSize() {
      return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size;
    },
    // 是否能用
    cascaderDisabled() {
      return this.disabled || (this.elForm || {}).disabled;
    },
    // 是否只读
    readonly() {
      const isIE = !this.$isServer && !isNaN(Number(document.documentMode));
      return !this.filterable || (!isIE && !this.menuVisible);
    }
  },

  watch: {
    // 打开或者关闭菜单
    menuVisible(value) {
      this.$refs.input.$refs.input.setAttribute('aria-expanded', value);
      value ? this.showMenu() : this.hideMenu();
    },
    // 设置选中项
    value(value) {
      this.currentValue = value;
    },
    currentValue(value) {
      this.dispatch('ElFormItem', 'el.form.change', [value]);
    },
    // 当前label
    currentLabels(value) {
      const inputLabel = this.showAllLevels ? value.join('/') : value[value.length - 1] ;
      this.$refs.input.$refs.input.setAttribute('value', inputLabel); // 设置原生input，value属性值，但是这个值并不会显示，所以只是用/分隔，并不是seprator属性指定分隔符
    },
    // 监听选项，并初始化菜单
    options: {
      deep: true,
      handler(value) {
        if (!this.menu) {
          this.initMenu();
        }
        this.flatOptions = this.flattenOptions(this.options);
        this.menu.options = value;
      }
    }
  },

  methods: {
    // 实例化menu组件，初始化数据，这样做的好处是什么
    initMenu() {
      this.menu = new Vue(ElCascaderMenu).$mount();
      this.menu.options = this.options;
      this.menu.props = this.props; // 这个props不是定义组件时的props，仅仅是data选项中的一个属性
      this.menu.expandTrigger = this.expandTrigger;
      this.menu.changeOnSelect = this.changeOnSelect;
      this.menu.popperClass = this.popperClass;
      this.menu.hoverThreshold = this.hoverThreshold; // 组件中没有定义这个属性，这里增加应该不是响应式的
      this.popperElm = this.menu.$el;// 浮动层
      this.menu.$refs.menus[0].setAttribute('id', `cascader-menu-${this.id}`);// 设置id编号
      // 绑定事件监听
      this.menu.$on('pick', this.handlePick);
      this.menu.$on('activeItemChange', this.handleActiveItemChange);
      this.menu.$on('menuLeave', this.doDestroy);
      this.menu.$on('closeInside', this.handleClickoutside);
    },
    // 打开菜单
    showMenu() {
      if (!this.menu) {
        this.initMenu();
      }

      this.menu.value = this.currentValue.slice(0); // 给menu赋值
      this.menu.visible = true; // 是否显示
      this.menu.options = this.options; // 选项设置
      this.$nextTick(_ => {
        this.updatePopper();
        this.menu.inputWidth = this.$refs.input.$el.offsetWidth - 2;
      });
    },
    // 隐藏菜单
    hideMenu() {
      this.inputValue = '';
      this.menu.visible = false;
      if (this.needFocus) {
        this.$refs.input.focus();
      } else {
        this.needFocus = true;
      }
    },
    // 激活item变化
    handleActiveItemChange(value) {
      this.$nextTick(_ => {
        this.updatePopper();
      });
      this.$emit('active-item-change', value);
    },
    // 键盘绑定
    handleKeydown(e) {
      const keyCode = e.keyCode;
      if (keyCode === 13) {
        this.handleClick();
      } else if (keyCode === 40) { // down
        this.menuVisible = true; // 打开
        setTimeout(() => {
          const firstMenu = this.popperElm.querySelectorAll('.el-cascader-menu')[0];
          firstMenu.querySelectorAll("[tabindex='-1']")[0].focus();
        });
        e.stopPropagation();
        e.preventDefault();
      } else if (keyCode === 27 || keyCode === 9) { // esc  tab
        this.inputValue = '';
        if (this.menu) this.menu.visible = false;
      }
    },
    // 选择item事件
    handlePick(value, close = true) {
      this.currentValue = value; // currentValue变化同时改变currentLabels
      this.$emit('input', value);
      this.$emit('change', value);

      if (close) {
        this.menuVisible = false;
      } else {
        this.$nextTick(this.updatePopper);
      }
    },
    // input事件回调
    handleInputChange(value) {
      if (!this.menuVisible) return; // 没显示菜单，不理会
      const flatOptions = this.flatOptions;

      if (!value) {// 清空input的操作
        this.menu.options = this.options;
        this.$nextTick(this.updatePopper);
        return;
      }

      // 过滤出有这个关键字的项
      let filteredFlatOptions = flatOptions.filter(optionsStack => {
        return optionsStack.some(option => new RegExp(value, 'i').test(option[this.labelKey]));
      });

      if (filteredFlatOptions.length > 0) {
        // 有匹配项，转换
        filteredFlatOptions = filteredFlatOptions.map(optionStack => {
          return {
            __IS__FLAT__OPTIONS: true,
            value: optionStack.map(item => item[this.valueKey]), // 是个数组
            label: this.renderFilteredOptionLabel(value, optionStack), // 是个数组
            disabled: optionStack.some(item => item[this.disabledKey])
          };
        });
      } else {
        // 没有匹配项
        filteredFlatOptions = [{
          __IS__FLAT__OPTIONS: true,
          label: this.t('el.cascader.noMatch'),
          value: '',
          disabled: true
        }];
      }
      this.menu.options = filteredFlatOptions; // 切换到过滤并且带有高亮的文字options
      this.$nextTick(this.updatePopper);
    },
    renderFilteredOptionLabel(inputValue, optionsStack) {
      return optionsStack.map((option, index) => {
        const label = option[this.labelKey];
        const keywordIndex = label.toLowerCase().indexOf(inputValue.toLowerCase());// 全部忽略大小写
        const labelPart = label.slice(keywordIndex, inputValue.length + keywordIndex);// 截取关键字（主要是有大小写）
        const node = keywordIndex > -1 ? this.highlightKeyword(label, labelPart) : label;
        return index === 0 ? node : [' / ', node];
      });
    },
    // 文字高亮
    highlightKeyword(label, keyword) {
      const h = this._c;
      // 解析成node+keyword+node+keyword+node的格式，keyword是被span包围带样式
      return label.split(keyword)
        .map((node, index) => index === 0 ? node : [
          h('span', { class: { 'el-cascader-menu__item__keyword': true }}, [this._v(keyword)]),
          node
        ]);
    },
    // 把嵌套关系转换成并列关系
    flattenOptions(options, ancestor = []) {
      let flatOptions = [];
      options.forEach((option) => {
        const optionsStack = ancestor.concat(option);
        if (!option[this.childrenKey]) {
          flatOptions.push(optionsStack);
        } else {
          if (this.changeOnSelect) {
            flatOptions.push(optionsStack);// 这里会出现[[]]的情况
          }
          flatOptions = flatOptions.concat(this.flattenOptions(option[this.childrenKey], optionsStack));
        }
      });
      return flatOptions;
    },
    // 点击清空
    clearValue(ev) {
      ev.stopPropagation();
      this.handlePick([], true);
    },
    // 关闭回调
    handleClickoutside(pickFinished = false) {
      if (this.menuVisible && !pickFinished) {
        this.needFocus = false;
      }
      this.menuVisible = false;
    },
    // 组件被点击
    handleClick() {
      if (this.cascaderDisabled) return;
      this.$refs.input.focus();// 聚焦
      if (this.filterable) { // 有搜索
        this.menuVisible = true;
        return;
      }
      this.menuVisible = !this.menuVisible; // toggle
    },
    handleFocus(event) {
      this.$emit('focus', event);
    },
    handleBlur(event) {
      this.$emit('blur', event);
    },
    handleComposition(event) {
      this.isOnComposition = event.type !== 'compositionend';
    }
  },

  created() {
    // input事件监听，debounce去抖
    this.debouncedInputChange = debounce(this.debounce, value => {
      const before = this.beforeFilter(value); // 之前过滤

      if (before && before.then) {
        this.menu.options = [{
          __IS__FLAT__OPTIONS: true,
          label: this.t('el.cascader.loading'),
          value: '',
          disabled: true
        }];
        before
          .then(() => {
            this.$nextTick(() => {
              this.handleInputChange(value);
            });
          });
      } else if (before !== false) {
        this.$nextTick(() => {
          this.handleInputChange(value); // 触发input回调
        });
      }
    });
  },

  mounted() {
    this.flatOptions = this.flattenOptions(this.options);
  }
};
</script>
