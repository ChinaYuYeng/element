//初始化的时候就确定聚焦的唯一元素，同时统一了调用代码，无需传参
export default function(ref) {
  return {
    methods: {
      focus() {
        this.$refs[ref].focus();
      }
    }
  };
};
