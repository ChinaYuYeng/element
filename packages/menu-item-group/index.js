import ElMenuItemGroup from '../menu/src/menu-item-group';

/* istanbul ignore next 插件的方式注册*/
ElMenuItemGroup.install = function(Vue) {
  Vue.component(ElMenuItemGroup.name, ElMenuItemGroup);
};

export default ElMenuItemGroup;
