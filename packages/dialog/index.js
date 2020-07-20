import ElDialog from './src/component';

/* 当单独引入组件的时候，通过使用vue.use()，可以立即注册全局组件 */
ElDialog.install = function(Vue) {
  Vue.component(ElDialog.name, ElDialog);
};

export default ElDialog;
