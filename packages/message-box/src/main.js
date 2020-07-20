const defaults = {
  title: null,
  message: '',
  type: '',
  iconClass: '',
  showInput: false,
  showClose: true,
  modalFade: true,
  lockScroll: true,
  closeOnClickModal: true,
  closeOnPressEscape: true,
  closeOnHashChange: true,
  inputValue: null,
  inputPlaceholder: '',
  inputType: 'text',
  inputPattern: null,
  inputValidator: null,
  inputErrorMessage: '',
  showConfirmButton: true,
  showCancelButton: false,
  confirmButtonPosition: 'right',
  confirmButtonHighlight: false,
  cancelButtonHighlight: false,
  confirmButtonText: '',
  cancelButtonText: '',
  confirmButtonClass: '',
  cancelButtonClass: '',
  customClass: '',
  beforeClose: null,
  dangerouslyUseHTMLString: false,
  center: false,
  roundButton: false,
  distinguishCancelAndClose: false
};

import Vue from 'vue';
import msgboxVue from './main.vue';
import merge from 'element-ui/src/utils/merge';
import { isVNode } from 'element-ui/src/utils/vdom';

const MessageBoxConstructor = Vue.extend(msgboxVue); //获得vm构造方法

let currentMsg, instance;
let msgQueue = []; //当有一个messagebox显示了，其他的messagebox会缓存在这个里

//默认回调
const defaultCallback = action => {
  if (currentMsg) {
    let callback = currentMsg.callback;
    if (typeof callback === 'function') {
      if (instance.showInput) { //有输入的情况
        callback(instance.inputValue, action);
      } else { //没有输入的情况
        callback(action);
      }
    }
    if (currentMsg.resolve) {
      //promise回调
      if (action === 'confirm') {
        if (instance.showInput) {
          currentMsg.resolve({ value: instance.inputValue, action });
        } else {
          currentMsg.resolve(action);
        }
      } else if (currentMsg.reject && (action === 'cancel' || action === 'close')) {
        currentMsg.reject(action);
      }
    }
  }
};

//实例化
const initInstance = () => {
  instance = new MessageBoxConstructor({
    el: document.createElement('div') //挂载到一个新建的div，游离的呀？？ 完全可以不设置el
    //data：options 实例化的时候可以传递data数据，但是这里是单例共用，属性只能后期赋值覆盖在showNextMsg
  });

  instance.callback = defaultCallback;
};

//调用queue中的下一个msg
const showNextMsg = () => {
  //单例
  if (!instance) {
    initInstance();
  }
  instance.action = '';

  //基本就是选项的处理，值覆盖，从新定义弹框属性
  if (!instance.visible || instance.closeTimer) {
    if (msgQueue.length > 0) {
      currentMsg = msgQueue.shift();
      
      let options = currentMsg.options;
      //拷贝属性
      for (let prop in options) {
        if (options.hasOwnProperty(prop)) {
          instance[prop] = options[prop];
        }
      }
      //设置默认callback ，defaultCallback定义了如何调用弹框操作之后的callback的逻辑
      if (options.callback === undefined) {
        instance.callback = defaultCallback;
      }

        //包装用户的回调
      let oldCb = instance.callback; //不是特意覆盖，基本是defaultCallback的逻辑
      instance.callback = (action, instance) => { //instance在关闭的时候调用这个cb
        oldCb(action, instance); //defaultCallback
        showNextMsg();
      };
      //虚拟节点放置
      if (isVNode(instance.message)) {
        instance.$slots.default = [instance.message];
        instance.message = null;
      } else {
        delete instance.$slots.default;
      }
      ['modal', 'showClose', 'closeOnClickModal', 'closeOnPressEscape', 'closeOnHashChange'].forEach(prop => {
        if (instance[prop] === undefined) {
          instance[prop] = true; //默认这些属性设置为true
        }
      });
      document.body.appendChild(instance.$el); //手动装载到body

      Vue.nextTick(() => {
        instance.visible = true; //显示
      });
    }
  }
};

const MessageBox = function(options, callback) {
  if (Vue.prototype.$isServer) return;
  //以字符串的形式
  if (typeof options === 'string' || isVNode(options)) {
    options = {
      message: options
    };
    if (typeof arguments[1] === 'string') {
      options.title = arguments[1];
    }
  } else if (options.callback && !callback) {
    callback = options.callback;
  }

  if (typeof Promise !== 'undefined') {
    return new Promise((resolve, reject) => { // eslint-disable-line
      //保存队列
      msgQueue.push({
        options: merge({}, defaults, MessageBox.defaults, options), //合并全部选项
        callback: callback, //这个是弹框之后的回调逻辑
        resolve: resolve,
        reject: reject
      });
      //下一个msg
      showNextMsg();
    });
  } else {
    msgQueue.push({
      options: merge({}, defaults, MessageBox.defaults, options),
      callback: callback
    });

    showNextMsg();
  }
};

//设置默认选项值
MessageBox.setDefaults = defaults => {
  MessageBox.defaults = defaults;
};

//快捷调用alert
MessageBox.alert = (message, title, options) => {
  if (typeof title === 'object') {
    options = title;
    title = '';
  } else if (title === undefined) {
    title = '';
  }
  return MessageBox(merge({
    title: title,
    message: message,
    $type: 'alert',
    closeOnPressEscape: false,
    closeOnClickModal: false
  }, options));
};

//快捷调用confirm
MessageBox.confirm = (message, title, options) => {
  if (typeof title === 'object') {
    options = title;
    title = '';
  } else if (title === undefined) {
    title = '';
  }
  return MessageBox(merge({
    title: title,
    message: message,
    $type: 'confirm',
    showCancelButton: true
  }, options));
};
//快捷调用promt
MessageBox.prompt = (message, title, options) => {
  if (typeof title === 'object') {
    options = title;
    title = '';
  } else if (title === undefined) {
    title = '';
  }
  return MessageBox(merge({
    title: title,
    message: message,
    showCancelButton: true,
    showInput: true,
    $type: 'prompt'
  }, options));
};

MessageBox.close = () => {
  instance.doClose();
  instance.visible = false;
  msgQueue = []; //清空queue
  currentMsg = null;
};

export default MessageBox;
export { MessageBox };
