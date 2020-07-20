<template>
  <!-- 整个checkbox被label包围 -->
  <label
    class="el-checkbox"
    :class="[
      border && checkboxSize ? 'el-checkbox--' + checkboxSize : '',
      { 'is-disabled': isDisabled },
      { 'is-bordered': border },
      { 'is-checked': isChecked }
    ]"
    role="checkbox"
    :aria-checked="indeterminate ? 'mixed': isChecked"
    :aria-disabled="isDisabled"
    :id="id"
  >
    <span class="el-checkbox__input"
      :class="{
        'is-disabled': isDisabled,
        'is-checked': isChecked,
        'is-indeterminate': indeterminate,
        'is-focus': focus
      }"
       aria-checked="mixed"
    >
      <!-- 自定义的checkedbox勾选样式 -->
      <span class="el-checkbox__inner"></span> 
      <!-- 隐藏的input,非display:none,真正操作的背后的元素 -->
      <!-- 是否有trueLable或者falseLable ,这2个是用指定的值代替原本checkbox的值true和false-->
      <input
        v-if="trueLabel || falseLabel"
        class="el-checkbox__original"
        type="checkbox"
        aria-hidden="true"
        :name="name"
        :disabled="isDisabled"
        :true-value="trueLabel" 
        :false-value="falseLabel"
        v-model="model"
        @change="handleChange"
        @focus="focus = true"
        @blur="focus = false">
      <input
        v-else
        class="el-checkbox__original"
        type="checkbox"
        aria-hidden="true"
        :disabled="isDisabled"
        :value="label"
        :name="name"
        v-model="model"
        @change="handleChange"
        @focus="focus = true"
        @blur="focus = false">
    </span>
    <!-- 文本标题 -->
    <span class="el-checkbox__label" v-if="$slots.default || label">
      <slot></slot>
      <template v-if="!$slots.default">{{label}}</template>
    </span>
  </label>
</template>
<script>
  import Emitter from 'element-ui/src/mixins/emitter';

  export default {
    name: 'ElCheckbox',

    mixins: [Emitter],

    // 一般配合form使用
    inject: {
      elForm: {
        default: ''
      },
      elFormItem: {
        default: ''
      }
    },

    componentName: 'ElCheckbox',

    data() {
      return {
        selfModel: false,
        focus: false,
        isLimitExceeded: false
      };
    },

    computed: {
      // 对应input v-model指令,对应的computed可以设置get,set方法
      model: {
        get() {
          return this.isGroup
            ? this.store : this.value !== undefined
              ? this.value : this.selfModel;
        },
        // v-model 对应的变量 不同（普通变量，数组），处理方式不同，可以尝试绑定一个变量或者数组，变量的结果是true或者false，数组是push操作。同时group绑定一个变量还是一个数组，会满足这里的逻辑，因为get取值优先取group
        // v-model指令针对不同的input type，会有不同的执行策略，比如checkbox,text 之间的v-model逻辑就不一样。如果不是原生控件，逻辑就是简单的覆盖，比如group的v-model指令，只是覆盖原值，而不是push操作
        // set的val的值，如果v-model绑定的是一个数组，那么val是一个[],input的value属性值（在这里设置成了label）会push到这个数组里，如果绑定的不是数组，那么就是true或者false
        set(val) {
          if (this.isGroup) {
            this.isLimitExceeded = false;
            // 判断是否溢出
            (this._checkboxGroup.min !== undefined &&
              val.length < this._checkboxGroup.min &&
              (this.isLimitExceeded = true));

            (this._checkboxGroup.max !== undefined &&
              val.length > this._checkboxGroup.max &&
              (this.isLimitExceeded = true));

            this.isLimitExceeded === false &&
            this.dispatch('ElCheckboxGroup', 'input', [val]);// 反馈给checkbox-group v-model 指令 ，这里的值一般是[[lable,lable]]这样的形式,为什么还要一个中括号？？
          } else {
            this.$emit('input', val); // 反馈给单个checkbox v-model指令
            this.selfModel = val;
          }
        }
      },
      // 判断是否选中
      isChecked() {
        if ({}.toString.call(this.model) === '[object Boolean]') {
          return this.model;
        } else if (Array.isArray(this.model)) {
          return this.model.indexOf(this.label) > -1;
        } else if (this.model !== null && this.model !== undefined) {
          return this.model === this.trueLabel;
        }
      },

      isGroup() {
        let parent = this.$parent;
        while (parent) {
          if (parent.$options.componentName !== 'ElCheckboxGroup') {
            parent = parent.$parent;
          } else {
            this._checkboxGroup = parent; // 保存checkboxGroup对象
            return true;
          }
        }
        return false;
      },
      // 数据存储,返回group的数据或者当前的，group的一般是[]
      store() {
        return this._checkboxGroup ? this._checkboxGroup.value : this.value;
      },

      // 是否可用
      isDisabled() {
        return this.isGroup
          ? this._checkboxGroup.disabled || this.disabled || (this.elForm || {}).disabled
          : this.disabled || (this.elForm || {}).disabled;
      },

      // 样式大小
      _elFormItemSize() {
        return (this.elFormItem || {}).elFormItemSize;
      },

      // 样式大小
      checkboxSize() {
        const temCheckboxSize = this.size || this._elFormItemSize || (this.$ELEMENT || {}).size;
        return this.isGroup
          ? this._checkboxGroup.checkboxGroupSize || temCheckboxSize
          : temCheckboxSize;
      }
    },

    props: {
      value: {}, // 这个value值，是间接通过v-model指令绑定变量，默认值是{}
      label: {},
      indeterminate: Boolean,
      disabled: Boolean,
      checked: Boolean,
      name: String,
      trueLabel: [String, Number],
      falseLabel: [String, Number],
      id: String, /* 当indeterminate为真时，为controls提供相关连的checkbox的id，表明元素间的控制关系*/
      controls: String, /* 当indeterminate为真时，为controls提供相关连的checkbox的id，表明元素间的控制关系*/
      border: Boolean,
      size: String
    },

    methods: {
      // 只运行一次，只能增加，记录当前组件的选中状态 ，在这里对于model是否数组的操作有了明显的分支，v-model对应this.model的处理逻辑类似
      addToStore() {
        if (
          Array.isArray(this.model) &&
          this.model.indexOf(this.label) === -1
        ) {
          this.model.push(this.label); // 如果是[]，就push
        } else {
          this.model = this.trueLabel || true;
        }
      },
      // input change事件
      handleChange(ev) {
        if (this.isLimitExceeded) return; // 越界忽略
        let value;
        if (ev.target.checked) {
          value = this.trueLabel === undefined ? true : this.trueLabel;
        } else {
          value = this.falseLabel === undefined ? false : this.falseLabel;
        }
        this.$emit('change', value, ev);
        this.$nextTick(() => {
          if (this.isGroup) {
            this.dispatch('ElCheckboxGroup', 'change', [this._checkboxGroup.value]);
          }
        });
      }
    },

    created() {
      this.checked && this.addToStore();// 选中就操作值
    },
    mounted() { // 为indeterminate元素 添加aria-controls 属性
      if (this.indeterminate) {
        this.$el.setAttribute('aria-controls', this.controls);
      }
    },

    watch: {
      value(value) {
        this.dispatch('ElFormItem', 'el.form.change', value);
      }
    }
  };
</script>
