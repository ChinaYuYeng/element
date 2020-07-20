const hasOwnProperty = Object.prototype.hasOwnProperty;

export function noop() {};
//可枚举方法
export function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key);
};

//拷贝自身或者原型上可枚举的属性
function extend(to, _from) {
  for (let key in _from) {
    to[key] = _from[key];
  }
  return to;
};

//把数组对象整合成一个对象
export function toObject(arr) {
  var res = {};
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i]);
    }
  }
  return res;
};

//读取复杂对象‘a.b.c’这样的路径值
export const getValueByPath = function(object, prop) {
  prop = prop || '';
  const paths = prop.split('.');
  let current = object;
  let result = null;
  for (let i = 0, j = paths.length; i < j; i++) {
    const path = paths[i];
    if (!current) break;

    if (i === j - 1) {
      result = current[path];
      break;
    }
    current = current[path];
  }
  return result;
};

//获得指定路径下的obj，key，value
export function getPropByPath(obj, path, strict) {
  let tempObj = obj;
  path = path.replace(/\[(\w+)\]/g, '.$1');//去中括号
  path = path.replace(/^\./, '');//去点

  let keyArr = path.split('.');//分割属性
  let i = 0;
  //长度为1的不进入循环
  for (let len = keyArr.length; i < len - 1; ++i) {
    if (!tempObj && !strict) break;
    let key = keyArr[i];
    if (key in tempObj) {
      tempObj = tempObj[key];
    } else { 
      if (strict) {
        throw new Error('please transfer a valid prop path to form item!');
      }
      break;
    }
  }
  return {
    o: tempObj,
    k: keyArr[i],
    v: tempObj ? tempObj[keyArr[i]] : null
  };
};

//生产id
export const generateId = function() {
  return Math.floor(Math.random() * 10000);
};

//比较2数组是否一样
export const valueEquals = (a, b) => {
  // see: https://stackoverflow.com/questions/3115982/how-to-check-if-two-arrays-are-equal-with-javascript
  if (a === b) return true;
  if (!(a instanceof Array)) return false;
  if (!(b instanceof Array)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i !== a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};
