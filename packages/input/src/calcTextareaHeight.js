//用来计算textarea在输入的时候自动调整高度。
/**
 * 思路就是创建一个隐藏的textarea，给予同样的内容，在特定的style下，获得内容高度，和单行内容高度，通过综合计算得到高度值，返回
 */
let hiddenTextarea;

//隐藏样式
const HIDDEN_STYLE = `
  height:0 !important;
  visibility:hidden !important;
  overflow:hidden !important;
  position:absolute !important;
  z-index:-1000 !important;
  top:0 !important;
  right:0 !important
`;

const CONTEXT_STYLE = [
  'letter-spacing',
  'line-height',
  'padding-top',
  'padding-bottom',
  'font-family',
  'font-weight',
  'font-size',
  'text-rendering',
  'text-transform',
  'width',
  'text-indent',
  'padding-left',
  'padding-right',
  'border-width',
  'box-sizing'
];

//获取这个元素的指定属性
function calculateNodeStyling(targetElement) {
  const style = window.getComputedStyle(targetElement); //style对象

  const boxSizing = style.getPropertyValue('box-sizing');

  const paddingSize = (
    parseFloat(style.getPropertyValue('padding-bottom')) +
    parseFloat(style.getPropertyValue('padding-top'))
  );

  const borderSize = (
    parseFloat(style.getPropertyValue('border-bottom-width')) +
    parseFloat(style.getPropertyValue('border-top-width'))
  );

  const contextStyle = CONTEXT_STYLE
    .map(name => `${name}:${style.getPropertyValue(name)}`)
    .join(';');

  return { contextStyle, paddingSize, borderSize, boxSizing };
}

export default function calcTextareaHeight(
  targetElement,
  minRows = 1,
  maxRows = null
) {
  if (!hiddenTextarea) {
    hiddenTextarea = document.createElement('textarea');//创建一个
    document.body.appendChild(hiddenTextarea);
  }

  let {
    paddingSize,
    borderSize,
    boxSizing,
    contextStyle
  } = calculateNodeStyling(targetElement);

  hiddenTextarea.setAttribute('style', `${contextStyle};${HIDDEN_STYLE}`);//设置样式
  hiddenTextarea.value = targetElement.value || targetElement.placeholder || ''; //拿到目标textarea的值

  let height = hiddenTextarea.scrollHeight; //隐藏textarea的文本高度
  const result = {};

  if (boxSizing === 'border-box') {
    height = height + borderSize; //算上边高
  } else if (boxSizing === 'content-box') {
    height = height - paddingSize; //减去padding
  }

  hiddenTextarea.value = '';//清空
  let singleRowHeight = hiddenTextarea.scrollHeight - paddingSize; //单行高度

  //计算最小行
  if (minRows !== null) {
    let minHeight = singleRowHeight * minRows;
    if (boxSizing === 'border-box') {
      minHeight = minHeight + paddingSize + borderSize;
    }
    height = Math.max(minHeight, height);
    result.minHeight = `${ minHeight }px`;
  }
  //计算最大行
  if (maxRows !== null) {
    let maxHeight = singleRowHeight * maxRows;
    if (boxSizing === 'border-box') {
      maxHeight = maxHeight + paddingSize + borderSize;
    }
    height = Math.min(maxHeight, height);
  }
  result.height = `${ height }px`;  //最终高度
  hiddenTextarea.parentNode && hiddenTextarea.parentNode.removeChild(hiddenTextarea); //清理隐藏textarea
  hiddenTextarea = null;
  return result;
};
