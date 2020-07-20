import directive from './src/directive';
import service from './src/index';

export default {
  //全局注册
  install(Vue) {
    Vue.use(directive); //注册组件（内部注册指令）
    Vue.prototype.$loading = service; //js方法调用loading组件
  },
  directive,
  service
};
