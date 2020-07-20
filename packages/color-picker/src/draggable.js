import Vue from 'vue';
let isDragging = false;

export default function(element, options) {
  if (Vue.prototype.$isServer) return;
  const moveFn = function(event) {
    if (options.drag) {
      options.drag(event);
    }
  };
  const upFn = function(event) {
    document.removeEventListener('mousemove', moveFn); //移除
    document.removeEventListener('mouseup', upFn); //移除
    document.onselectstart = null;
    document.ondragstart = null;

    isDragging = false;

    if (options.end) {
      options.end(event);
    }
  };
  element.addEventListener('mousedown', function(event) {
    if (isDragging) return; //正在移动状态
    document.onselectstart = function() { return false; };
    document.ondragstart = function() { return false; };

    document.addEventListener('mousemove', moveFn); //监听拖拽移动事件
    document.addEventListener('mouseup', upFn);//监听拖拽结束事件
    isDragging = true;

    if (options.start) {
      options.start(event);
    }
  });
}
