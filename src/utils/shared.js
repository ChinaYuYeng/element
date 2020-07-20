export function isDef(val) {
  return val !== undefined && val !== null;
}
//是否韩语
export function isKorean(text) {
  const reg = /([(\uAC00-\uD7AF)|(\u3130-\u318F)])+/gi;
  return reg.test(text);
}
