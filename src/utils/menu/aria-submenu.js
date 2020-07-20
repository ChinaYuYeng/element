import Utils from '../aria-utils';

const SubMenu = function(parent, domNode) {
  this.domNode = domNode;//当前节点
  this.parent = parent;//父节点
  this.subMenuItems = [];//子节点
  this.subIndex = 0;//子元素的索引
  this.init();
};

SubMenu.prototype.init = function() {
  this.subMenuItems = this.domNode.querySelectorAll('li');//所有的li元素
  this.addListeners();
};

//改变选择的子元素
SubMenu.prototype.gotoSubIndex = function(idx) {
  if (idx === this.subMenuItems.length) {
    idx = 0;
  } else if (idx < 0) {
    idx = this.subMenuItems.length - 1;
  }
  this.subMenuItems[idx].focus();
  this.subIndex = idx;
};

SubMenu.prototype.addListeners = function() {
  const keys = Utils.keys;//键盘key
  const parentNode = this.parent.domNode;
  //遍历每个子元素绑定上下
  Array.prototype.forEach.call(this.subMenuItems, el => {
    el.addEventListener('keydown', event => {
      let prevDef = false;
      switch (event.keyCode) {
        case keys.down:
          this.gotoSubIndex(this.subIndex + 1);
          prevDef = true;
          break;
        case keys.up:
          this.gotoSubIndex(this.subIndex - 1);
          prevDef = true;
          break;
        case keys.tab:
          Utils.triggerEvent(parentNode, 'mouseleave');
          break;
        case keys.enter:
        case keys.space:
          prevDef = true;
          event.currentTarget.click();
          break;
      }
      if (prevDef) {
        event.preventDefault();
        event.stopPropagation();
      }
      return false;
    });
  });
};

export default SubMenu;
