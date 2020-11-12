<template>
  <div class="el-color-svpanel"
      :style="{
        backgroundColor: background
      }">
    <div class="el-color-svpanel__white"></div>
    <div class="el-color-svpanel__black"></div>
    <div class="el-color-svpanel__cursor"
      :style="{
        top: cursorTop + 'px',
        left: cursorLeft + 'px'
      }">
      <div></div>
    </div>
  </div>
</template>

<script>
  import draggable from '../draggable';

  export default {
    name: 'el-sl-panel',

    props: {
      color: {
        required: true
      }
    },

    computed: {
      //当前颜色
      colorValue() {
        // color虽然是个new的实例，但是依然是个对象{hue:'',value:''}
        // 在this.color.set改变value的时候会触发计算属性watch重新计算，进而触发下方的watch，进行背景色更新
        const hue = this.color.get('hue');
        const value = this.color.get('value');
        return { hue, value };
      }
    },

    watch: {
      //更新
      colorValue() {
        this.update();
      }
    },

    methods: {
      update() {
        const saturation = this.color.get('saturation');
        const value = this.color.get('value');

        const el = this.$el;
        let { width, height } = el.getBoundingClientRect();

        if (!height) height = width * 3 / 4;

        this.cursorLeft = saturation * width / 100;
        this.cursorTop = (100 - value) * height / 100;

        this.background = 'hsl(' + this.color.get('hue') + ', 100%, 50%)';
      },

      handleDrag(event) {
        const el = this.$el;
        const rect = el.getBoundingClientRect();

        let left = event.clientX - rect.left;
        let top = event.clientY - rect.top;
        left = Math.max(0, left);
        left = Math.min(left, rect.width);

        top = Math.max(0, top);
        top = Math.min(top, rect.height);

        this.cursorLeft = left;
        this.cursorTop = top;
        //更改颜色
        this.color.set({
          saturation: left / rect.width * 100,
          value: 100 - top / rect.height * 100
        });
      }
    },

    mounted() {
      draggable(this.$el, {
        drag: (event) => {
          this.handleDrag(event);
        },
        end: (event) => {
          this.handleDrag(event);
        }
      });

      this.update();
    },

    data() {
      return {
        cursorTop: 0,
        cursorLeft: 0,
        background: 'hsl(0, 100%, 50%)'
      };
    }
  };
</script>
