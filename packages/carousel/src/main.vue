<template>
  <div
    class="el-carousel"
    :class="{ 'el-carousel--card': type === 'card' }"
    @mouseenter.stop="handleMouseEnter"
    @mouseleave.stop="handleMouseLeave">
    <!-- 左右2边箭头  -->
    <div
      class="el-carousel__container"
      :style="{ height: height }">
      <transition name="carousel-arrow-left">
        <button
          type="button"
          v-if="arrow !== 'never'"
          v-show="arrow === 'always' || hover"
          @mouseenter="handleButtonEnter('left')"
          @mouseleave="handleButtonLeave"
          @click.stop="throttledArrowClick(activeIndex - 1)"
          class="el-carousel__arrow el-carousel__arrow--left">
          <i class="el-icon-arrow-left"></i>
        </button>
      </transition>
      <transition name="carousel-arrow-right">
        <button
          type="button"
          v-if="arrow !== 'never'"
          v-show="arrow === 'always' || hover"
          @mouseenter="handleButtonEnter('right')"
          @mouseleave="handleButtonLeave"
          @click.stop="throttledArrowClick(activeIndex + 1)"
          class="el-carousel__arrow el-carousel__arrow--right">
          <i class="el-icon-arrow-right"></i>
        </button>
      </transition>
      <!-- 轮播内容放置位置 -->
      <slot></slot> 
    </div>
    <!-- 轮播下方的指示的点 -->
    <ul
      class="el-carousel__indicators"
      v-if="indicatorPosition !== 'none'"
      :class="{ 'el-carousel__indicators--labels': hasLabel, 'el-carousel__indicators--outside': indicatorPosition === 'outside' || type === 'card' }">
      <li
        v-for="(item, index) in items"
        class="el-carousel__indicator"
        :class="{ 'is-active': index === activeIndex }"
        @mouseenter="throttledIndicatorHover(index)"
        @click.stop="handleIndicatorClick(index)">
        <button class="el-carousel__button"><span v-if="hasLabel">{{ item.label }}</span></button>
      </li>
    </ul>
  </div>
</template>

<script>
import throttle from 'throttle-debounce/throttle';
import { addResizeListener, removeResizeListener } from 'element-ui/src/utils/resize-event';

export default {
  name: 'ElCarousel',

  props: {
    initialIndex: { // 初始激活item
      type: Number,
      default: 0
    },
    height: String, // 轮播高度
    trigger: { // 指示器的触发方式（下方的点）
      type: String,
      default: 'hover'
    },
    autoplay: {
      type: Boolean,
      default: true
    },
    interval: {
      type: Number,
      default: 3000
    },
    indicatorPosition: String, // 指示器的位置
    indicator: { // 指示器
      type: Boolean,
      default: true
    },
    arrow: {// 切换箭头的显示时机
      type: String,
      default: 'hover'
    },
    type: String // 轮播播放类型
  },

  data() {
    return {
      items: [],
      activeIndex: -1,
      containerWidth: 0,
      timer: null,
      hover: false
    };
  },

  computed: {
    // 指示器是否由文本
    hasLabel() {
      return this.items.some(item => item.label.toString().length > 0);
    }
  },

  watch: {
    // 监听items，设置初始item
    items(val) {
      if (val.length > 0) this.setActiveItem(this.initialIndex);
    },

    activeIndex(val, oldVal) {
      this.resetItemPosition(oldVal); // 重置
      this.$emit('change', val, oldVal);
    },
    // 自动播放
    autoplay(val) {
      val ? this.startTimer() : this.pauseTimer();
    }
  },

  methods: {
    // 鼠标悬停，取消自动播放
    handleMouseEnter() {
      this.hover = true;
      this.pauseTimer();
    },
    // 鼠标离开，自动播放
    handleMouseLeave() {
      this.hover = false;
      this.startTimer();
    },

    itemInStage(item, index) {
      const length = this.items.length;
      if (index === length - 1 && item.inStage && this.items[0].active ||
        (item.inStage && this.items[index + 1] && this.items[index + 1].active)) {
        return 'left';
      } else if (index === 0 && item.inStage && this.items[length - 1].active ||
        (item.inStage && this.items[index - 1] && this.items[index - 1].active)) {
        return 'right';
      }
      return false;
    },
    // 左右箭头进入
    handleButtonEnter(arrow) {
      this.items.forEach((item, index) => {
        if (arrow === this.itemInStage(item, index)) {
          item.hover = true;
        }
      });
    },
    // 左右箭头离开
    handleButtonLeave() {
      this.items.forEach(item => {
        item.hover = false;
      });
    },

    // 获得items
    updateItems() {
      this.items = this.$children.filter(child => child.$options.name === 'ElCarouselItem');
    },
    // 设置item位置
    resetItemPosition(oldIndex) {
      this.items.forEach((item, index) => {
        item.translateItem(index, this.activeIndex, oldIndex);
      });
    },

    // 触发轮播，index区间[0,items.length-1]
    playSlides() {
      if (this.activeIndex < this.items.length - 1) {
        this.activeIndex++;
      } else {
        this.activeIndex = 0;
      }
    },
    // 结束自动播放
    pauseTimer() {
      clearInterval(this.timer);
    },
    // 自动播放时间设置
    startTimer() {
      if (this.interval <= 0 || !this.autoplay) return;
      this.timer = setInterval(this.playSlides, this.interval);
    },

    // 设置激活项
    setActiveItem(index) {
      // 如果是string的，就比较名字得到index
      if (typeof index === 'string') {
        const filteredItems = this.items.filter(item => item.name === index);
        if (filteredItems.length > 0) {
          index = this.items.indexOf(filteredItems[0]);
        }
      }
      // 其他的情况转换成数字
      index = Number(index);
      // 是nan的或者非整数报错，非整数的判断办法index !== Math.floor(index)
      if (isNaN(index) || index !== Math.floor(index)) {
        process.env.NODE_ENV !== 'production' &&
        console.warn('[Element Warn][Carousel]index must be an integer.');
        return;
      }
      let length = this.items.length;
      const oldIndex = this.activeIndex;// 保存原来的激活索引
      if (index < 0) {// 说明在第一个
        this.activeIndex = length - 1;
      } else if (index >= length) {// 在最后一个
        this.activeIndex = 0;
      } else {
        this.activeIndex = index;
      }
      if (oldIndex === this.activeIndex) { // 搞了半天在原地
        this.resetItemPosition(oldIndex);
      }
    },

    // 前一个
    prev() {
      this.setActiveItem(this.activeIndex - 1);
    },
    // 后一个
    next() {
      this.setActiveItem(this.activeIndex + 1);
    },
    // 指示器点击
    handleIndicatorClick(index) {
      this.activeIndex = index;
    },

    // 指示器悬停
    handleIndicatorHover(index) {
      if (this.trigger === 'hover' && index !== this.activeIndex) {
        this.activeIndex = index;
      }
    }
  },

  created() {
    this.throttledArrowClick = throttle(300, true, index => {
      this.setActiveItem(index);
    });
    this.throttledIndicatorHover = throttle(300, index => {
      this.handleIndicatorHover(index);
    });
  },

  mounted() {
    this.updateItems();
    this.$nextTick(() => {
      addResizeListener(this.$el, this.resetItemPosition); // 对这个el，加监听
      if (this.initialIndex < this.items.length && this.initialIndex >= 0) {
        this.activeIndex = this.initialIndex;
      }
      this.startTimer();
    });
  },

  beforeDestroy() {
    if (this.$el) removeResizeListener(this.$el, this.resetItemPosition);
  }
};
</script>
