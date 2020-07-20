<template>
  <!-- 外包装就是div -->
  <div :class="[
    type === 'textarea' ? 'el-textarea' : 'el-input',
    inputSize ? 'el-input--' + inputSize : '',
    {
      'is-disabled': inputDisabled,
      'el-input-group': $slots.prepend || $slots.append,
      'el-input-group--append': $slots.append,
      'el-input-group--prepend': $slots.prepend,
      'el-input--prefix': $slots.prefix || prefixIcon,
      'el-input--suffix': $slots.suffix || suffixIcon || clearable
    }
    ]"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
  <!-- 非textarea -->
    <template v-if="type !== 'textarea'"> 
      <!-- 前置元素 -->
      <div class="el-input-group__prepend" v-if="$slots.prepend">
        <slot name="prepend"></slot>
      </div>
      <!-- compositionstart compositionupdate  compositionend 可以解决中文输入的问题 http://www.cnblogs.com/lonhon/p/7643095.html-->
      <input
        :tabindex="tabindex"
        v-if="type !== 'textarea'"
        class="el-input__inner"
        v-bind="$attrs"
        :type="type"
        :disabled="inputDisabled"
        :readonly="readonly"
        :autocomplete="autoComplete"
        :value="currentValue"
        ref="input"
        @compositionstart="handleComposition"
        @compositionupdate="handleComposition"    
        @compositionend="handleComposition"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @change="handleChange"
        :aria-label="label"
      >
      <!-- 前置内容 -->
      <span class="el-input__prefix" v-if="$slots.prefix || prefixIcon">
        <slot name="prefix"></slot>
        <i class="el-input__icon"
           v-if="prefixIcon"
           :class="prefixIcon">
        </i>
      </span>
      <!-- 后置内容 -->
      <span
        class="el-input__suffix"
        v-if="$slots.suffix || suffixIcon || showClear || validateState && needStatusIcon">
        <span class="el-input__suffix-inner">
          <template v-if="!showClear">
            <slot name="suffix"></slot>
            <i class="el-input__icon"
              v-if="suffixIcon"
              :class="suffixIcon">
            </i>
          </template>
          <i v-else
            class="el-input__icon el-icon-circle-close el-input__clear"
            @click="clear"
          ></i>
        </span>
        <i class="el-input__icon"
          v-if="validateState"
          :class="['el-input__validateIcon', validateIcon]">
        </i>
      </span>
      <!-- 后置元素 -->
      <div class="el-input-group__append" v-if="$slots.append">
        <slot name="append"></slot>
      </div>
    </template>
    <!-- v-bind="$attrs" 可以绑对象-->
    <textarea
      v-else
      :tabindex="tabindex"
      class="el-textarea__inner"
      :value="currentValue"
      @compositionstart="handleComposition"
      @compositionupdate="handleComposition"
      @compositionend="handleComposition"
      @input="handleInput"
      ref="textarea"
      v-bind="$attrs"
      :disabled="inputDisabled"
      :readonly="readonly"
      :style="textareaStyle"
      @focus="handleFocus"
      @blur="handleBlur"
      @change="handleChange"
      :aria-label="label"
    >
    </textarea>
  </div>
</template>
<script>
  import emitter from 'element-ui/src/mixins/emitter';
  import Migrating from 'element-ui/src/mixins/migrating';
  import calcTextareaHeight from './calcTextareaHeight';
  import merge from 'element-ui/src/utils/merge';
  import { isKorean } from 'element-ui/src/utils/shared';

  export default {
    name: 'ElInput',

    componentName: 'ElInput',

    mixins: [emitter, Migrating],

    inheritAttrs: false,

    inject: {
      elForm: {
        default: ''
      },
      elFormItem: {
        default: ''
      }
    },

    data() {
      return {
        currentValue: this.value === undefined || this.value === null
          ? ''
          : this.value,
        textareaCalcStyle: {},
        hovering: false,
        focused: false,
        isOnComposition: false,
        valueBeforeComposition: null
      };
    },

    props: {
      value: [String, Number],
      size: String,
      resize: String,
      form: String,
      disabled: Boolean,
      readonly: Boolean,
      type: {
        type: String,
        default: 'text'
      },
      autosize: {
        type: [Boolean, Object],
        default: false
      },
      autoComplete: {
        type: String,
        default: 'off'
      },
      validateEvent: {
        type: Boolean,
        default: true
      },
      suffixIcon: String,
      prefixIcon: String,
      label: String,
      clearable: {
        type: Boolean,
        default: false
      },
      tabindex: String
    },

    computed: {
      _elFormItemSize() {
        return (this.elFormItem || {}).elFormItemSize; 
      },
      validateState() {
        return this.elFormItem ? this.elFormItem.validateState : '';
      },
      needStatusIcon() {
        return this.elForm ? this.elForm.statusIcon : false;
      },
      validateIcon() {
        return {
          validating: 'el-icon-loading',
          success: 'el-icon-circle-check',
          error: 'el-icon-circle-close'
        }[this.validateState];
      },
      textareaStyle() {
        return merge({}, this.textareaCalcStyle, { resize: this.resize });
      },
      inputSize() {
        //优先自己的size，或者是item或者form的size
        return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size;
      },
      inputDisabled() {
        return this.disabled || (this.elForm || {}).disabled;
      },
      showClear() {
        return this.clearable &&
          !this.disabled &&
          !this.readonly &&
          this.currentValue !== '' &&
          (this.focused || this.hovering);
      }
    },

    watch: {
      //开始赋值
      'value'(val, oldValue) {
        this.setCurrentValue(val);
      }
    },

    methods: {
      focus() {
        (this.$refs.input || this.$refs.textarea).focus();
      },
      blur() {
        (this.$refs.input || this.$refs.textarea).blur();
      },
      getMigratingConfig() {
        return {
          props: {
            'icon': 'icon is removed, use suffix-icon / prefix-icon instead.',
            'on-icon-click': 'on-icon-click is removed.'
          },
          events: {
            'click': 'click is removed.'
          }
        };
      },
      //blur事件回调
      handleBlur(event) {
        this.focused = false; //失去焦点
        this.$emit('blur', event);
        if (this.validateEvent) { //如果是在form中,有验证需要,触发验证
          this.dispatch('ElFormItem', 'el.form.blur', [this.currentValue]);
        }
      },
      //这方法是选定文本内容
      select() {
        (this.$refs.input || this.$refs.textarea).select();
      },
      //自动调整textarea大小
      resizeTextarea() {
        if (this.$isServer) return;
        const { autosize, type } = this;
        if (type !== 'textarea') return;//只有testarea才行
        if (!autosize) {//不设置为自动调整
          this.textareaCalcStyle = {
            minHeight: calcTextareaHeight(this.$refs.textarea).minHeight
          };
          return;
        }
        const minRows = autosize.minRows;
        const maxRows = autosize.maxRows;

        this.textareaCalcStyle = calcTextareaHeight(this.$refs.textarea, minRows, maxRows);//自动计算高度
      },
      handleFocus(event) {
        this.focused = true;//进入焦点
        this.$emit('focus', event);
      },
      handleComposition(event) {
        if (event.type === 'compositionend') {
          this.isOnComposition = false; //中文输入结束
          //这个目的可能是？？？输入中文的时候，input事件会在拼音的时候触发，出现（中文shuru）这样的形式，valueBeforeComposition这个保存了（中文）,这样（shuru）这个就没了
          this.currentValue = this.valueBeforeComposition;
          this.valueBeforeComposition = null;
          this.handleInput(event); //中文输入完成，最终值确认，赋值
        } else {
          const text = event.target.value;
          const lastCharacter = text[text.length - 1] || '';
          this.isOnComposition = !isKorean(lastCharacter); //非韩语,才认为输入开始
          if (this.isOnComposition && event.type === 'compositionstart') {
            this.valueBeforeComposition = text; //保存输入前的值
          }
        }
      },
      //input事件每次输入就触发
      handleInput(event) {
        const value = event.target.value;
        this.setCurrentValue(value); 
        if (this.isOnComposition) return; //正在输入中文返回
        this.$emit('input', value);
      },
      handleChange(event) {
        this.$emit('change', event.target.value);
      },
      //主要是set值
      setCurrentValue(value) {
        if (this.isOnComposition && value === this.valueBeforeComposition) return;//valueBeforeComposition的作用也就判断下前后是否变化
        this.currentValue = value;
        if (this.isOnComposition) return;
        this.$nextTick(_ => {
          this.resizeTextarea(); //调整textarea大小
        });
        if (this.validateEvent) {
          this.dispatch('ElFormItem', 'el.form.change', [value]); //触发change验证
        }
      },
      //计算前后字符串的位置
      calcIconOffset(place) {
        const el = this.$el.querySelector(`.el-input__${place}`);
        if (!el || el.parentNode !== this.$el) return;
        const pendantMap = {
          suffix: 'append',
          prefix: 'prepend'
        };

        const pendant = pendantMap[place];
        if (this.$slots[pendant]) { //有给slot，就设置样式
          el.style.transform = `translateX(${place === 'suffix' ? '-' : ''}${this.$el.querySelector(`.el-input-group__${pendant}`).offsetWidth}px)`;
        } else {
          el.removeAttribute('style');
        }
      },
      updateIconOffset() {
        this.calcIconOffset('prefix');
        this.calcIconOffset('suffix');
      },
      //重置
      clear() {
        this.$emit('input', '');
        this.$emit('change', '');
        this.$emit('clear');
        this.setCurrentValue('');
        this.focus();
      }
    },

    created() {
      this.$on('inputSelect', this.select);
    },

    mounted() {
      this.resizeTextarea();
      this.updateIconOffset();
    },

    updated() {
      this.$nextTick(this.updateIconOffset);
    }
  };
</script>
