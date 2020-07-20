<template>
  <div class="el-color-predefine">
    <div class="el-color-predefine__colors">
      <div class="el-color-predefine__color-selector"
           :class="{selected: item.selected, 'is-alpha': item._alpha < 100}"
           v-for="(item, index) in rgbaColors"
           :key="colors[index]"
           @click="handleSelect(index)">
          <!-- 颜色显示 -->
        <div :style="{'background-color': item.value}"> 
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Color from '../color';

  export default {
    props: {
      colors: { type: Array, required: true }, //预定义的颜色数组
      color: { required: true } //颜色对象
    },
    data() {
      return {
        rgbaColors: this.parseColors(this.colors, this.color) //这里可以用 this，
      };
    },
    methods: {
      //选中某种
      handleSelect(index) {
        this.color.fromString(this.colors[index]);
      },
      //把颜色数组转换成颜色对象数组
      parseColors(colors, color) {
        return colors.map(value => {
          const c = new Color();
          c.enableAlpha = true;
          c.format = 'rgba';
          c.fromString(value);
          c.selected = c.value === color.value; //判断 是否选择中
          return c;
        });
      }
    },
    watch: {
      //可以这样监听父节点,但是不能这样监听子节点，因为$children是数组
      '$parent.currentColor'(val) {
        //比较是否显示选中
        const color = new Color();
        color.fromString(val);

        this.rgbaColors.forEach(item => {
          item.selected = color.compare(item);
        });
      },
      //重新解析选中颜色和所有颜色
      colors(newVal) {
        this.rgbaColors = this.parseColors(newVal, this.color);
      },
      //重新解析选中颜色和所有颜色
      color(newVal) {
        this.rgbaColors = this.parseColors(this.colors, newVal);
      }
    }
  };
</script>