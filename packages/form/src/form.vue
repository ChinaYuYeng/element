<template>
  <form class="el-form" :class="[
    labelPosition ? 'el-form--label-' + labelPosition : '',
    { 'el-form--inline': inline }
  ]">
    <slot></slot>
  </form>
</template>
<script>
  import objectAssign from 'element-ui/src/utils/merge';

  export default {
    name: 'ElForm',

    componentName: 'ElForm',

    provide() {
      return {
        elForm: this
      };
    },

    props: {
      model: Object,
      rules: Object,
      labelPosition: String,
      labelWidth: String,
      labelSuffix: {
        type: String,
        default: ''
      },
      inline: Boolean,
      inlineMessage: Boolean,
      statusIcon: Boolean,
      showMessage: {
        type: Boolean,
        default: true
      },
      size: String,
      disabled: Boolean,
      validateOnRuleChange: {
        type: Boolean,
        default: true
      }
    },
    watch: {
      rules() {
        if (this.validateOnRuleChange) {
          this.validate(() => {});
        }
      }
    },
    data() {
      return {
        fields: []// items
      };
    },
    created() {
      // add field
      this.$on('el.form.addField', (field) => {
        if (field) {
          this.fields.push(field);
        }
      });
      /* istanbul ignore next  remove*/
      this.$on('el.form.removeField', (field) => {
        if (field.prop) {
          this.fields.splice(this.fields.indexOf(field), 1);
        }
      });
    },
    methods: {
      // 逐一调用item的reset方法
      resetFields() {
        if (!this.model) {
          process.env.NODE_ENV !== 'production' &&
          console.warn('[Element Warn][Form]model is required for resetFields to work.');
          return;
        }
        this.fields.forEach(field => {
          field.resetField();
        });
      },
      // 清理指定的验证item，默认全部
      clearValidate(props = []) {
        const fields = props.length
          ? this.fields.filter(field => props.indexOf(field.prop) > -1)
          : this.fields;
        fields.forEach(field => {
          field.clearValidate();
        });
      },
      // 验证所有item，逐一调用item的验证方法
      validate(callback) {
        if (!this.model) {
          console.warn('[Element Warn][Form]model is required for validate to work!');
          return;
        }

        let promise;
        // if no callback, return promise 没有设置callback
        if (typeof callback !== 'function' && window.Promise) {
          promise = new window.Promise((resolve, reject) => {
            callback = function(valid) {
              valid ? resolve(valid) : reject(valid);
            };
          });
        }

        let valid = true;
        let count = 0;
        // 如果需要验证的fields为空，调用验证时立刻返回callback
        if (this.fields.length === 0 && callback) {
          callback(true);
        }
        let invalidFields = {};
        this.fields.forEach(field => {
          field.validate('', (message, field) => {
            if (message) {
              valid = false;// 有一次不成功就算验证失败
            }
            invalidFields = objectAssign({}, invalidFields, field);// 收集验证信息
            if (typeof callback === 'function' && ++count === this.fields.length) {
              // 所有验证完之后的回调方法，返回成功与否和不成功的字段
              callback(valid, invalidFields);
            }
          });
        });

        if (promise) {
          return promise;
        }
      },
      // 单独验证指定item
      validateField(prop, cb) {
        let field = this.fields.filter(field => field.prop === prop)[0];
        if (!field) { throw new Error('must call validateField with valid prop string!'); }

        field.validate('', cb);
      }
    }
  };
</script>
