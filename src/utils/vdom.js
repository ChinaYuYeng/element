import { hasOwn } from 'element-ui/src/utils/util';

//判断vnode居然只需要看下‘componentOptions’属性
export function isVNode(node) {
  return node !== null && typeof node === 'object' && hasOwn(node, 'componentOptions');
};

//获取第一个子元素（过滤掉无用的）
export function getFirstComponentChild(children) {
  return children && children.filter(c => c && c.tag)[0];
};
