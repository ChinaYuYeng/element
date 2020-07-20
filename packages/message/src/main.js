import Vue from 'vue';
import Main from './main.vue';
import { PopupManager } from 'element-ui/src/utils/popup';
import { isVNode } from 'element-ui/src/utils/vdom';
let MessageConstructor = Vue.extend(Main); //获得构造方法

let instance;
let instances = [];
let seed = 1;

const Message = function(options) {
  if (Vue.prototype.$isServer) return;
  options = options || {};
  //options是文字 ，转化未对象
  if (typeof options === 'string') {
    options = {
      message: options
    };
  }
  let userOnClose = options.onClose;
  let id = 'message_' + seed++;

   //封装用户的关闭回调逻辑
  options.onClose = function() {
    Message.close(id, userOnClose); //关闭指定id
  };
  instance = new MessageConstructor({
    data: options //实例化
  });
  instance.id = id;
  //是否是虚拟dom
  if (isVNode(instance.message)) {
    instance.$slots.default = [instance.message];//把虚拟dom给default slot
    instance.message = null;
  }
  instance.vm = instance.$mount();//挂载，游离的dom （这里会导致循环引用，但不会报错？？？$mount()返回实例本身）
  document.body.appendChild(instance.vm.$el);//挂载到body
  instance.vm.visible = true;
  instance.dom = instance.vm.$el;
  instance.dom.style.zIndex = PopupManager.nextZIndex();
  instances.push(instance);
  return instance.vm;
};

//直接使用指定类型调用，更加直观的调用方式
['success', 'warning', 'info', 'error'].forEach(type => {
  Message[type] = options => {
    if (typeof options === 'string') {
      options = {
        message: options
      };
    }
    options.type = type;//内部还是要转换成普通的
    return Message(options);
  };
});
//关闭指定message
Message.close = function(id, userOnClose) {
  for (let i = 0, len = instances.length; i < len; i++) {
    if (id === instances[i].id) {
      if (typeof userOnClose === 'function') {
        userOnClose(instances[i]); //执行关闭回调
      }
      instances.splice(i, 1); //删除实例
      break;
    }
  }
};

//关闭所有
Message.closeAll = function() {
  for (let i = instances.length - 1; i >= 0; i--) {
    instances[i].close();
  }
};

export default Message;
