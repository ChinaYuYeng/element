import ElMenuItem from '../menu/src/menu-item';

/* istanbul ignore next 插件的方式注册*/
ElMenuItem.install = function(Vue) {
  Vue.component(ElMenuItem.name, ElMenuItem);
};

export default ElMenuItem;
