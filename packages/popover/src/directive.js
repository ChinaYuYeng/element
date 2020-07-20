//这个指令是用来标定popper和reference的，使用方式v-popper:[ref],指令所在的是popper，ref所代表的组件是reference
const getReference = (el, binding, vnode) => {
  const _ref = binding.expression ? binding.value : binding.arg;
  const popper = vnode.context.$refs[_ref];
  if (popper) {
    if (Array.isArray(popper)) {
      popper[0].$refs.reference = el;
    } else {
      popper.$refs.reference = el;
    }
  }
};

export default {
  bind(el, binding, vnode) {
    getReference(el, binding, vnode);
  },
  inserted(el, binding, vnode) {
    getReference(el, binding, vnode);
  }
};
