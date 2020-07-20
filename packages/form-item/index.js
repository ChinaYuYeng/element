//从form包里引入，支持单独使用
import ElFormItem from '../form/src/form-item';

/* istanbul ignore next */
ElFormItem.install = function(Vue) {
  Vue.component(ElFormItem.name, ElFormItem);
};

export default ElFormItem;
