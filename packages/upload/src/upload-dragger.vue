<template>
  <div
    class="el-upload-dragger"
    :class="{
      'is-dragover': dragover
    }"
    @drop.prevent="onDrop"
    @dragover.prevent="onDragover"
    @dragleave.prevent="dragover = false"
  >
    <slot></slot>
  </div>
</template>
<script>
  export default {
    name: 'ElUploadDrag',
    props: {
      disabled: Boolean
    },
    inject: {
      uploader: { // 引用最外面的父组件
        default: ''
      }
    },
    data() {
      return {
        dragover: false
      };
    },
    methods: {
      // 拖拽进入到一个可释放的目标后触发（未释放），与leave相反，离开一个可释放的目标后触发（未释放）
      onDragover() {
        if (!this.disabled) {
          this.dragover = true;
        }
      },
      // 拖拽到一个可释放的目标后触发（已释放）
      onDrop(e) {
        if (this.disabled || !this.uploader) return;
        const accept = this.uploader.accept; // 上传文件的类型
        this.dragover = false;
        // 没有设置上传类型的话，直接选择文件结束
        if (!accept) {
          this.$emit('file', e.dataTransfer.files); // e.dataTransfer.files 拖拽操作特有的事件属性
          return;
        }
        this.$emit('file', [].slice.call(e.dataTransfer.files).filter(file => { // 根据设置的文件类型过滤文件
          const { type, name } = file;
          const extension = name.indexOf('.') > -1
            ? `.${ name.split('.').pop() }`// 获得扩展名，最后一个点 xxxx
            : '';
          const baseType = type.replace(/\/.*$/, ''); // 把/XXX全部去掉
          return accept.split(',')
            .map(type => type.trim())// 去空格
            .filter(type => type)
            .some(acceptedType => {// 满足任何一个文件类型就可以上传
              if (/\..+$/.test(acceptedType)) { // 是否.xxx的扩展名
                return extension === acceptedType;// 看看.xxx是否 === extension
              }
              if (/\/\*$/.test(acceptedType)) { // 是否是image/*,video/*类型的
                return baseType === acceptedType.replace(/\/\*$/, '');
              }
              if (/^[^\/]+\/[^\/]+$/.test(acceptedType)) { // 是否是XXX/XXX, 比如application/msword
                return type === acceptedType;
              }
              return false;
            });
        }));
      }
    }
  };
</script>

