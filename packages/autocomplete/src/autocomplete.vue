<template>
  <div
    class="el-autocomplete"
    v-clickoutside="close"
    aria-haspopup="listbox"
    role="combobox"
    :aria-expanded="suggestionVisible"
    :aria-owns="id"
  >
  <!-- 输入框 -->
    <el-input
      ref="input"
      v-bind="[$props, $attrs]"
      @input="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown.up.native.prevent="highlight(highlightedIndex - 1)"
      @keydown.down.native.prevent="highlight(highlightedIndex + 1)"
      @keydown.enter.native="handleKeyEnter"
      @keydown.native.tab="close"
    >
      <template slot="prepend" v-if="$slots.prepend">
        <slot name="prepend"></slot>
      </template>
      <template slot="append" v-if="$slots.append">
        <slot name="append"></slot>
      </template>
      <template slot="prefix" v-if="$slots.prefix">
        <slot name="prefix"></slot>
      </template>
      <template slot="suffix" v-if="$slots.suffix">
        <slot name="suffix"></slot>
      </template>
    </el-input>
    <!-- 建议提示 -->
    <el-autocomplete-suggestions
      visible-arrow
      :class="[popperClass ? popperClass : '']"
      :popper-options="popperOptions"
      ref="suggestions"
      :placement="placement"
      :id="id">
      <li
        v-for="(item, index) in suggestions"
        :key="index"
        :class="{'highlighted': highlightedIndex === index}"
        @click="select(item)"
        :id="`${id}-item-${index}`"
        role="option"
        :aria-selected="highlightedIndex === index"
      >
        <slot :item="item">
          {{ item[valueKey] }}
        </slot>
      </li>
    </el-autocomplete-suggestions>
  </div>
</template>
<script>
  import debounce from 'throttle-debounce/debounce';
  import ElInput from 'element-ui/packages/input';
  import Clickoutside from 'element-ui/src/utils/clickoutside';
  import ElAutocompleteSuggestions from './autocomplete-suggestions.vue';
  import Emitter from 'element-ui/src/mixins/emitter';
  import Migrating from 'element-ui/src/mixins/migrating';
  import { generateId } from 'element-ui/src/utils/util';
  import Focus from 'element-ui/src/mixins/focus';

  export default {
    name: 'ElAutocomplete',

    mixins: [Emitter, Focus('input'), Migrating],

    inheritAttrs: false,//避免在parentvnode设置的多余属性（去掉被组件定义的props）应用在根节点上。默认是应用在根节点上

    componentName: 'ElAutocomplete',

    components: {
      ElInput,
      ElAutocompleteSuggestions
    },

    directives: { Clickoutside },

    props: {
      valueKey: {
        type: String,
        default: 'value'
      },
      popperClass: String,
      popperOptions: Object,
      placeholder: String,
      disabled: Boolean,
      name: String,
      size: String,
      value: String,
      maxlength: Number,
      minlength: Number,
      autofocus: Boolean,
      fetchSuggestions: Function,
      triggerOnFocus: {
        type: Boolean,
        default: true
      },
      customItem: String,
      selectWhenUnmatched: { //在输入没有任何匹配建议的情况下，按下回车是否触发 select 事件
        type: Boolean,
        default: false
      },
      prefixIcon: String,
      suffixIcon: String,
      label: String,
      debounce: {
        type: Number,
        default: 300
      },
      placement: {
        type: String,
        default: 'bottom-start'
      },
      hideLoading: Boolean //是否隐藏加载图标，是给suggestons组件用的
    },
    data() {
      return {
        activated: false,
        suggestions: [],
        loading: false,
        highlightedIndex: -1, //建议的索引
        suggestionDisabled: false
      };
    },
    computed: {
      suggestionVisible() {
        const suggestions = this.suggestions;
        let isValidData = Array.isArray(suggestions) && suggestions.length > 0;
        //聚焦并且(在加载或者数据已经加载好)
        return (isValidData || this.loading) && this.activated;
      },
      id() {
        return `el-autocomplete-${generateId()}`;
      }
    },
    watch: {
      suggestionVisible(val) {
        //通知显示建议框
        this.broadcast('ElAutocompleteSuggestions', 'visible', [val, this.$refs.input.$refs.input.offsetWidth]);
      }
    },
    methods: {
      //老版本迁移
      getMigratingConfig() {
        return {
          props: {
            'custom-item': 'custom-item is removed, use scoped slot instead.',
            'props': 'props is removed, use value-key instead.'
          }
        };
      },
      //数据获取抽象复用的逻辑
      getData(queryString) {
        if (this.suggestionDisabled) {
          return;
        }
        this.loading = true;//打开加载动画
        //用户自定义数据获取（远程等等）
        this.fetchSuggestions(queryString, (suggestions) => {
          this.loading = false;//关闭加载动画
          if (this.suggestionDisabled) {
            return;
          }
          if (Array.isArray(suggestions)) {
            this.suggestions = suggestions;
          } else {
            console.error('[Element Error][Autocomplete]autocomplete suggestions must be an array');
          }
        });
      },
      //输入更改
      handleChange(value) {
        this.$emit('input', value);
        this.suggestionDisabled = false; //suggestionDisabled这个主要是控制输入值和建议框的行为
        if (!this.triggerOnFocus && !value) {
          this.suggestionDisabled = true;
          this.suggestions = [];
          return;
        }
        this.debouncedGetData(value);
      },
      //输入框聚焦
      handleFocus(event) {
        this.activated = true; //可以打开建议框
        this.$emit('focus', event);
        if (this.triggerOnFocus) {
          this.debouncedGetData(this.value);
        }
      },
      handleBlur(event) {
        this.$emit('blur', event);
      },
      //关闭建议框
      close(e) {
        this.activated = false;
      },
      //回车键回调
      handleKeyEnter(e) {
        //选中建议确定
        if (this.suggestionVisible && this.highlightedIndex >= 0 && this.highlightedIndex < this.suggestions.length) {
          e.preventDefault();
          this.select(this.suggestions[this.highlightedIndex]);
        } else if (this.selectWhenUnmatched) { //无建议可选
          this.$emit('select', {value: this.value});
          this.$nextTick(_ => {
            this.suggestions = [];
            this.highlightedIndex = -1;
          });
        }
      },
      //选完之后的回调
      select(item) {
        this.$emit('input', item[this.valueKey]);
        this.$emit('select', item);//选中确认
        this.$nextTick(_ => {
          this.suggestions = [];
          this.highlightedIndex = -1;
        });
      },
      //高亮显示项，并让其出现在可视区域内，有鼠标滚轮介入除外，只支持键盘up和down
      highlight(index) {
        if (!this.suggestionVisible || this.loading) { return; } //如果么有显示建议框，或者正在加载，退出
        if (index < 0) { //回到最初退出
          this.highlightedIndex = -1;
          return;
        }
        //最后一个不动
        if (index >= this.suggestions.length) {
          index = this.suggestions.length - 1;
        }
        // 以下都是为了计算项在可视区域中（纯键盘操作，一旦有鼠标滚轮介入，表现的就不好了），
        const suggestion = this.$refs.suggestions.$el.querySelector('.el-autocomplete-suggestion__wrap');
        const suggestionList = suggestion.querySelectorAll('.el-autocomplete-suggestion__list li');//li 原生dom

        let highlightItem = suggestionList[index];
        let scrollTop = suggestion.scrollTop;//滚进去的那部分
        let offsetTop = highlightItem.offsetTop;//一项的离顶部的距离
        
        if (offsetTop + highlightItem.scrollHeight > (scrollTop + suggestion.clientHeight)) {
          suggestion.scrollTop += highlightItem.scrollHeight;//滚进去的部分增加一个项的高度
        }
        if (offsetTop < scrollTop) {
          suggestion.scrollTop -= highlightItem.scrollHeight;//滚进去的部分减去一个项的高度
        }
        this.highlightedIndex = index;
        this.$el.querySelector('.el-input__inner').setAttribute('aria-activedescendant', `${this.id}-item-${this.highlightedIndex}`);
      }
    },
    mounted() {
      this.debouncedGetData = debounce(this.debounce, this.getData);
      this.$on('item-click', item => {
        this.select(item);
      });
      let $input = this.$el.querySelector('.el-input__inner');
      $input.setAttribute('role', 'textbox');
      $input.setAttribute('aria-autocomplete', 'list');
      $input.setAttribute('aria-controls', 'id');
      $input.setAttribute('aria-activedescendant', `${this.id}-item-${this.highlightedIndex}`);
    },
    beforeDestroy() {
      this.$refs.suggestions.$destroy();
    }
  };
</script>
