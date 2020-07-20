<template>
  <div class="el-collapse" role="tablist" aria-multiselectable="true">
    <slot></slot>
  </div>
</template>
<script>
  export default {
    name: 'ElCollapse',

    componentName: 'ElCollapse',

    props: {
      accordion: Boolean, //是否手风琴的效果（一次只展开一个）
      value: { //当前激活的面板，手风琴只能是string、
        type: [Array, String, Number],
        default() {
          return [];
        }
      }
    },

    data() {
      return {
        activeNames: [].concat(this.value) //concat的好处是可以兼任value 的type ，不管是array ，string ，number
      };
    },
    //把自己提供给所有子元素
    provide() {
      return {
        collapse: this
      };
    },

    watch: {
      //当后续value改变，重新计算activeNames
      value(value) {
        this.activeNames = [].concat(value);
      }
    },

    methods: {
      //更新激活面板
      setActiveNames(activeNames) {
        activeNames = [].concat(activeNames);
        let value = this.accordion ? activeNames[0] : activeNames; //手风琴的只有1个是激活的
        this.activeNames = activeNames;
        this.$emit('input', value);
        this.$emit('change', value);
      },
      //item点击回调
      handleItemClick(item) {
        //手风琴
        if (this.accordion) {
          //如果点击的就是激活的，设置‘’ (关闭) ，不是就设置item.name(打开指定)
          this.setActiveNames(
            (this.activeNames[0] || this.activeNames[0] === 0) &&
            this.activeNames[0] === item.name
              ? '' : item.name
          );
        } else {
          let activeNames = this.activeNames.slice(0);//转换成数组
          let index = activeNames.indexOf(item.name);
            //有就删除
          if (index > -1) {
            activeNames.splice(index, 1);
            //没就加入
          } else {
            activeNames.push(item.name);
          }
          this.setActiveNames(activeNames);
        }
      }
    },

    created() {
      //监听item被点击
      this.$on('item-click', this.handleItemClick);
    }
  };
</script>
