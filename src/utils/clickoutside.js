import Vue from 'vue';
import { on } from 'element-ui/src/utils/dom';

const nodeList = [];
const ctx = '@@clickoutsideContext';

let startClick;
let seed = 0;

//记录mousedown触发元素
!Vue.prototype.$isServer && on(document, 'mousedown', e => (startClick = e));

//当mouseUp触发时判断位置
!Vue.prototype.$isServer && on(document, 'mouseup', e => {
  nodeList.forEach(node => node[ctx].documentHandler(e, startClick));
});

function createDocumentHandler(el, binding, vnode) {
  return function(mouseup = {}, mousedown = {}) {
    //不满足以下条件，就不触发，主要时判断包含关系，应该就是判断指令对应的el和mouseUp触发的元素的位置和mouseDown触发元素的位置关系，是否在el外面
    if (!vnode ||
      !vnode.context ||
      !mouseup.target ||
      !mousedown.target ||
      el.contains(mouseup.target) ||
      el.contains(mousedown.target) ||
      el === mouseup.target ||
      (vnode.context.popperElm &&
      (vnode.context.popperElm.contains(mouseup.target) ||
      vnode.context.popperElm.contains(mousedown.target)))) return;

    if (binding.expression &&
      el[ctx].methodName &&
      vnode.context[el[ctx].methodName]) {
      vnode.context[el[ctx].methodName]();
    } else {
      el[ctx].bindingFn && el[ctx].bindingFn();
    }
  };
}

/**
 * v-clickoutside
 * @desc 点击元素外面才会触发的事件
 * @example
 * ```vue
 * <div v-element-clickoutside="handleClose">
 * ```
 */
export default {
  bind(el, binding, vnode) {
    nodeList.push(el);
    const id = seed++;
    //给dom元素设置自定义属性
    el[ctx] = {
      id,
      documentHandler: createDocumentHandler(el, binding, vnode),
      methodName: binding.expression,
      bindingFn: binding.value
    };
  },

  update(el, binding, vnode) {
    el[ctx].documentHandler = createDocumentHandler(el, binding, vnode);
    el[ctx].methodName = binding.expression;
    el[ctx].bindingFn = binding.value;
  },

  unbind(el) {
    let len = nodeList.length;

    for (let i = 0; i < len; i++) {
      if (nodeList[i][ctx].id === el[ctx].id) {
        nodeList.splice(i, 1);
        break;
      }
    }
    //删除自定义属性
    delete el[ctx];
  }
};
