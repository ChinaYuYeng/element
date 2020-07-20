<template>
  <div class="el-color-hue-slider" :class="{ 'is-vertical': vertical }">
    <div class="el-color-hue-slider__bar" @click="handleClick" ref="bar"></div>
    <div class="el-color-hue-slider__thumb"
         :style="{
           left: thumbLeft + 'px',
           top: thumbTop + 'px'
         }"
         ref="thumb">
    </div>
  </div>
</template>

<script>
  import draggable from '../draggable';

  export default {
    name: 'el-color-hue-slider',

    props: {
      color: {
        required: true
      },

      vertical: Boolean
    },

    data() {
      return {
        thumbLeft: 0,
        thumbTop: 0
      };
    },

    computed: {
      hueValue() {
        const hue = this.color.get('hue');
        return hue;
      }
    },

    watch: {
      hueValue() {
        this.update();
      }
    },

    methods: {
      //在bar上点击操作
      handleClick(event) {
        const thumb = this.$refs.thumb;
        const target = event.target;

        if (target !== thumb) {
          this.handleDrag(event);
        }
      },
      //拖拽的处理过程
      handleDrag(event) {
        const rect = this.$el.getBoundingClientRect();
        const { thumb } = this.$refs;
        let hue;

        if (!this.vertical) {
          //左右侧临界值计算
          let left = event.clientX - rect.left;
          left = Math.min(left, rect.width - thumb.offsetWidth / 2);
          left = Math.max(thumb.offsetWidth / 2, left);

          hue = Math.round((left - thumb.offsetWidth / 2) / (rect.width - thumb.offsetWidth) * 360);
        } else {
          //上下临界值计算
          let top = event.clientY - rect.top;
          top = Math.min(top, rect.height - thumb.offsetHeight / 2);
          top = Math.max(thumb.offsetHeight / 2, top);

          hue = Math.round((top - thumb.offsetHeight / 2) / (rect.height - thumb.offsetHeight) * 360);
        }

        this.color.set('hue', hue);//设置改变color的内部值
      },
      //滑块横向距离
      getThumbLeft() {
        if (this.vertical) return 0;
        const el = this.$el;
        const hue = this.color.get('hue');

        if (!el) return 0;
        const thumb = this.$refs.thumb;
        return Math.round(hue * (el.offsetWidth - thumb.offsetWidth / 2) / 360);
      },
      //滑块纵向距离
      getThumbTop() {
        if (!this.vertical) return 0;
        const el = this.$el;
        const hue = this.color.get('hue');

        if (!el) return 0;
        const thumb = this.$refs.thumb;
        return Math.round(hue * (el.offsetHeight - thumb.offsetHeight / 2) / 360);
      },
      //更新滑块的显示位置
      update() {
        this.thumbLeft = this.getThumbLeft(); //更新滑块横向位置
        this.thumbTop = this.getThumbTop(); //更新滑块纵向位置
      }
    },

    mounted() {
      const { bar, thumb } = this.$refs; //拿到2个组件

      const dragConfig = {
        drag: (event) => {
          this.handleDrag(event);
        },
        end: (event) => {
          this.handleDrag(event);
        }
      };
      //定义拖拽
      draggable(bar, dragConfig);
      draggable(thumb, dragConfig);
      this.update();
    }
  };
</script>
