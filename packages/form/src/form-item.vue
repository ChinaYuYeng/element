<template>
<!--elForm.statusIcon从form那拿到是否显示验证通过与否的小图标 -->
  <div class="el-form-item" :class="[{
       'el-form-item--feedback': elForm && elForm.statusIcon,
      'is-error': validateState === 'error',
      'is-validating': validateState === 'validating',
      'is-success': validateState === 'success',
      'is-required': isRequired || required
    },
    sizeClass ? 'el-form-item--' + sizeClass : ''
  ]">
    <label :for="labelFor" class="el-form-item__label" v-bind:style="labelStyle" v-if="label || $slots.label">
      <!-- labelSuffix给所有label加上统一的后缀字符 -->
      <slot name="label">{{label + form.labelSuffix}}</slot>
    </label>
    <div class="el-form-item__content" v-bind:style="contentStyle">
      <!-- 在这里存放input什么的 -->
      <slot></slot>
      <!-- 以下是错误信息部分 -->
      <transition name="el-zoom-in-top">
        <div
          v-if="validateState === 'error' && showMessage && form.showMessage"
          class="el-form-item__error"
          :class="{
            'el-form-item__error--inline': typeof inlineMessage === 'boolean'
              ? inlineMessage
              : (elForm && elForm.inlineMessage || false)
          }"
        >
          {{validateMessage}}
        </div>
      </transition>
    </div>
  </div>
</template>
<script>
  import AsyncValidator from 'async-validator';
  import emitter from 'element-ui/src/mixins/emitter';
  import objectAssign from 'element-ui/src/utils/merge';
  import { noop, getPropByPath } from 'element-ui/src/utils/util';

  export default {
    name: 'ElFormItem',

    componentName: 'ElFormItem',

    mixins: [emitter],

    provide() {
      return {
        elFormItem: this
      };
    },

    inject: ['elForm'],

    props: {
      label: String,
      labelWidth: String,
      prop: String,
      required: {
        type: Boolean,
        default: undefined
      },
      rules: [Object, Array],
      error: String,
      validateStatus: String,//外部设置当前验证状态值，文档没列没说明，基本不怎么使用
      for: String,
      inlineMessage: {//验证信息的显示方式，是否独占一行
        type: [String, Boolean],
        default: ''
      },
      showMessage: {//是否显示验证信息
        type: Boolean,
        default: true
      },
      size: String
    },
    watch: {
      error: {
        immediate: true,
        handler(value) {
          this.validateMessage = value;
          this.validateState = value ? 'error' : '';
        }
      },
      validateStatus(value) {
        this.validateState = value;
      }
    },
    computed: {
      //label标签的for属性值
      labelFor() {
        return this.for || this.prop;
      },
      labelStyle() {
        const ret = {};
        if (this.form.labelPosition === 'top') return ret;
        const labelWidth = this.labelWidth || this.form.labelWidth;
        if (labelWidth) {
          ret.width = labelWidth;
        }
        return ret;
      },
      contentStyle() {
        const ret = {};
        const label = this.label;
        if (this.form.labelPosition === 'top' || this.form.inline) return ret;
        if (!label && !this.labelWidth && this.isNested) return ret;
        const labelWidth = this.labelWidth || this.form.labelWidth;
        if (labelWidth) {
          ret.marginLeft = labelWidth;
        }
        return ret;
      },
      //向上探索直到elform元素返回 和inject: ['elForm']不是一样的吗 ？？？？个人感觉是一样的
      form() {
        let parent = this.$parent;
        let parentName = parent.$options.componentName;
        while (parentName !== 'ElForm') {
          if (parentName === 'ElFormItem') {
            this.isNested = true;
          }
          parent = parent.$parent;
          parentName = parent.$options.componentName;
        }
        return parent;
      },
      //获得该item的值
      fieldValue: {
        cache: false,//1.x的功能已经过时，使用methods代替
        get() {
          const model = this.form.model;
          if (!model || !this.prop) { return; }

          let path = this.prop;
          if (path.indexOf(':') !== -1) {
            path = path.replace(/:/, '.');
          }

          return getPropByPath(model, path, true).v;//从model中获得指定的值
        }
      },
      //返回是否必填
      isRequired() {
        let rules = this.getRules();
        let isRequired = false;

        if (rules && rules.length) {
          //用every的好处就是比传统的简洁，比foreach可以提前接受（return false），比for of 兼容好 。个人还是for of正统
          rules.every(rule => {
            if (rule.required) {
              isRequired = true;
              return false;
            }
            return true;
          });
        }
        return isRequired;
      },
      //form的size
      _formSize() {
        return this.elForm.size;
      },
      //item的大小使用自己的设置或者form的设置
      elFormItemSize() {
        return this.size || this._formSize;
      },
      //指定item的size大小来源，当前或者全局默认设置
      sizeClass() {
        return this.elFormItemSize || (this.$ELEMENT || {}).size;
      }
    },
    data() {
      return {
        validateState: '',
        validateMessage: '',
        validateDisabled: false,
        validator: {},
        isNested: false
      };
    },
    methods: {
      //验证一个item的值
      validate(trigger, callback = noop) {
        this.validateDisabled = false;
        const rules = this.getFilteredRule(trigger);
        if ((!rules || rules.length === 0) && this.required === undefined) {
          callback();
          return true;
        }

        this.validateState = 'validating';

        const descriptor = {};
        if (rules && rules.length > 0) {
          rules.forEach(rule => {
            delete rule.trigger;
          });
        }
        descriptor[this.prop] = rules;//以prop为键保存验证规则{prop:[]}形式

        const validator = new AsyncValidator(descriptor);//创建一个验证对象，这是一个插件，第三方提供
        const model = {};

        model[this.prop] = this.fieldValue;

        validator.validate(model, { firstFields: true }, (errors, invalidFields) => {
          this.validateState = !errors ? 'success' : 'error';
          this.validateMessage = errors ? errors[0].message : '';

          callback(this.validateMessage, invalidFields);//每验证完一个item就能callback
          this.elForm && this.elForm.$emit('validate', this.prop, !errors);//form触发一个验证了的事件，供form外部监听
        });
      },
      //重置验证状态
      clearValidate() {
        this.validateState = '';
        this.validateMessage = '';
        this.validateDisabled = false;
      },
      //重置属性
      resetField() {
        this.validateState = '';//重置验证状态
        this.validateMessage = '';//重置验证信息

        let model = this.form.model;
        let value = this.fieldValue;
        let path = this.prop;
        //可以使用：分隔，但是设置rule的key也必须是：分隔
        if (path.indexOf(':') !== -1) {
          path = path.replace(/:/, '.');
        }

        let prop = getPropByPath(model, path, true);//根据prop寻值

        this.validateDisabled = true;
        //如果form值是数组，就把初始值转化为数组
        if (Array.isArray(value)) {
          prop.o[prop.k] = [].concat(this.initialValue);
        } else {
          //不是的话覆盖
          prop.o[prop.k] = this.initialValue;
        }
        //广播所有的ElTimeSelect恢复初始值，重置时间选择框
        this.broadcast('ElTimeSelect', 'fieldReset', this.initialValue);
      },
      //整合全局和自有的验证规则
      getRules() {
        let formRules = this.form.rules;//总的（form）
        const selfRules = this.rules;//自己的（item）
        const requiredRule = this.required !== undefined ? { required: !!this.required } : [];//直接在属性里指定required，转换成规则集

        const prop = getPropByPath(formRules, this.prop || '');//返回{ o: obj, k: key, v:value};
        formRules = formRules ? (prop.o[this.prop || ''] || prop.v) : [];//拿到某个key下的[{}，{}]多条验证规则

        return [].concat(selfRules || formRules || []).concat(requiredRule);//返回[{},{}]这样的形式规则集
      },
      //根据触发条件筛选rules，
      getFilteredRule(trigger) {
        const rules = this.getRules();

        return rules.filter(rule => {
          if (!rule.trigger || trigger === '') return true;//如果没设置trigger就全部通过
          if (Array.isArray(rule.trigger)) {
            return rule.trigger.indexOf(trigger) > -1;
          } else {
            return rule.trigger === trigger;
          }
        }).map(rule => objectAssign({}, rule));//获得一份浅拷贝，如果某属性市{}或者[]有个屁用，比如说trigger是[]
      },
      //trigger为blur
      onFieldBlur() {
        this.validate('blur');
      },
      //trigger为change
      onFieldChange() {
        if (this.validateDisabled) {
          this.validateDisabled = false;
          return;
        }

        this.validate('change');
      }
    },
    mounted() {
      //必须指定prop，否则父级都不鸟你
      if (this.prop) {
        this.dispatch('ElForm', 'el.form.addField', [this]);//通知父级保存自己
        //保存初始值，以便重置
        let initialValue = this.fieldValue;
        if (Array.isArray(initialValue)) {
          initialValue = [].concat(initialValue);
        }
        Object.defineProperty(this, 'initialValue', {
          value: initialValue
        });

        let rules = this.getRules(); //收集验证规则

        if (rules.length || this.required !== undefined) {
          //这2个事件是有input发出的，根据input的动作，执行相应的验证方式
          this.$on('el.form.blur', this.onFieldBlur);
          this.$on('el.form.change', this.onFieldChange);
        }
      }
    },
    beforeDestroy() {
      //通知父级删除自己
      this.dispatch('ElForm', 'el.form.removeField', [this]);
    }
  };
</script>
