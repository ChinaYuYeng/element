import Vue from 'vue';
import Main from './main.vue';
import { PopupManager } from 'element-ui/src/utils/popup';
import { isVNode } from 'element-ui/src/utils/vdom';
const NotificationConstructor = Vue.extend(Main); //把定义好的vue模板，转换成构造方法

let instance;
let instances = [];
let seed = 1;

const Notification = function(options) {
  if (Vue.prototype.$isServer) return;
  //整理选项
  options = options || {};
  const userOnClose = options.onClose;//用户指定的关闭回调
  const id = 'notification_' + seed++;
  const position = options.position || 'top-right';

  //封装用户的关闭回调逻辑
  options.onClose = function() {
    Notification.close(id, userOnClose);//关闭指定的。。。
  };

  //创建实列
  instance = new NotificationConstructor({
    data: options//给vue实例赋值
  });

  //message选项支持vnode
  if (isVNode(options.message)) {
    instance.$slots.default = [options.message];
    options.message = 'REPLACED_BY_VNODE';
  }
  instance.id = id;
  instance.$mount();//挂载vue实例，但是没有提供el选项，也没有参数，挂载后，属于游离的dom元素
  document.body.appendChild(instance.$el);//手动把dom依附到body
  instance.visible = true;//显示
  instance.dom = instance.$el;
  instance.dom.style.zIndex = PopupManager.nextZIndex();//设置显示层级

  //多个同时展示时，每个指定方向下的垂直偏移（自身高度和每个之间的间隔）
  let verticalOffset = options.offset || 0;
  instances.filter(item => item.position === position).forEach(item => {
    verticalOffset += item.$el.offsetHeight + 16;
  });
  verticalOffset += 16;
  instance.verticalOffset = verticalOffset;
  instances.push(instance);//持久管理
  return instance;
};

//直接使用指定类型调用，更加直观的调用方式
['success', 'warning', 'info', 'error'].forEach(type => {
  Notification[type] = options => {
    //如果options不是{}
    if (typeof options === 'string' || isVNode(options)) {
      options = {
        message: options
      };
    }
    options.type = type;//设置type
    return Notification(options);//普通调用
  };
});

//关闭指定的
Notification.close = function(id, userOnClose) {
  let index = -1;
  const len = instances.length;
  const instance = instances.filter((instance, i) => { //用fileter遍历找到索引和实例
    if (instance.id === id) {
      index = i;
      return true;
    }
    return false;
  })[0];
  if (!instance) return;

  if (typeof userOnClose === 'function') {
    userOnClose(instance);//执行用户的关闭回调
  }
  instances.splice(index, 1);//删除持久化

  if (len <= 1) return; //如果实例数量只有1个以下，就不再调整位置
  const position = instance.position;
  const removedHeight = instance.dom.offsetHeight;
  for (let i = index; i < len - 1 ; i++) {//从删除之后的同位置元素调整距离
    if (instances[i].position === position) {
      instances[i].dom.style[instance.verticalProperty] =
        parseInt(instances[i].dom.style[instance.verticalProperty], 10) - removedHeight - 16 + 'px';//之后的元素每个减去高度，和间距
    }
  }
};

//关闭所有的
Notification.closeAll = function() {
  for (let i = instances.length - 1; i >= 0; i--) {
    instances[i].close();
  }
};

export default Notification;
