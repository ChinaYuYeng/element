import normalizeWheel from 'normalize-wheel';//统一不同浏览器下滚动表现不一致的问题，同时方便取值

const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

const mousewheel = function(element, callback) {
  if (element && element.addEventListener) {
    element.addEventListener(isFirefox ? 'DOMMouseScroll' : 'mousewheel', function(event) {
      const normalized = normalizeWheel(event);
      callback && callback.apply(this, [event, normalized]);
    });
  }
};

export default {
  bind(el, binding) {
    mousewheel(el, binding.value);
  }
};
