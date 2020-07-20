<script>
import ajax from './ajax';
import UploadDragger from './upload-dragger.vue';

export default {
  inject: ['uploader'],
  components: {
    UploadDragger
  },
  props: {
    type: String, // 没用的属性
    action: { // 上传连接
      type: String,
      required: true
    },
    name: {
      type: String,
      default: 'file'
    },
    data: Object,
    headers: Object,
    withCredentials: Boolean,
    multiple: Boolean,
    accept: String,
    onStart: Function,
    onProgress: Function,
    onSuccess: Function,
    onError: Function,
    beforeUpload: Function,
    drag: Boolean,
    onPreview: {
      type: Function,
      default: function() {}
    },
    onRemove: {
      type: Function,
      default: function() {}
    },
    fileList: Array,
    autoUpload: Boolean,
    listType: String,
    httpRequest: {
      type: Function,
      default: ajax
    },
    disabled: Boolean,
    limit: Number,
    onExceed: Function
  },

  data() {
    return {
      mouseover: false,
      reqs: {} // 正在上传的ajax对象引用map
    };
  },

  methods: {
    isImage(str) {
      return str.indexOf('image') !== -1;
    },
    // 原生input type=file元素change事件监听
    handleChange(ev) {
      const files = ev.target.files; // 从原生获得文件对象

      if (!files) return;
      this.uploadFiles(files);
    },
    // 上传文件
    uploadFiles(files) {
      if (this.limit && this.fileList.length + files.length > this.limit) {// 检查个数限制
        this.onExceed && this.onExceed(files, this.fileList);
        return;
      }

      let postFiles = Array.prototype.slice.call(files);
      if (!this.multiple) { postFiles = postFiles.slice(0, 1); } // 是否允许多个上传，否则只能上传第一个

      if (postFiles.length === 0) { return; }

      // 遍历逐个上传原生文件对象
      postFiles.forEach(rawFile => {
        this.onStart(rawFile); // 上传之前的初始化，保存在内存的图片信息存在uploadFiles，这初始化和上传没关系
        if (this.autoUpload) this.upload(rawFile);// 自动上传，否则手动上传，在onstart记录了要上传的文件信息
      });
    },
    // 上传文件
    upload(rawFile) {
      this.$refs.input.value = null;

      if (!this.beforeUpload) {
        return this.post(rawFile); // 没beforeUpload 直接上传
      }

      const before = this.beforeUpload(rawFile);// 这个主要是做一些图片条件筛选，比如大小
      // beforeUpload的返回值是否是promise的
      if (before && before.then) {
        before.then(processedFile => {
          const fileType = Object.prototype.toString.call(processedFile);

          if (fileType === '[object File]' || fileType === '[object Blob]') {
            // blob需要包装成file对象
            if (fileType === '[object Blob]') {
              processedFile = new File([processedFile], rawFile.name, {
                type: rawFile.type
              });
            }
            // 拷贝原始属性
            for (const p in rawFile) {
              if (rawFile.hasOwnProperty(p)) {
                processedFile[p] = rawFile[p];
              }
            }
            this.post(processedFile);
          } else {
            this.post(rawFile);
          }
        }, () => {
          this.onRemove(null, rawFile);// 传递原生文件对象，内部有uid
        });
        // beforeupload（这个主要是做一些图片条件筛选，比如大小）返回值为true的时候
      } else if (before !== false) {
        this.post(rawFile);
        // false的时候
      } else {
        this.onRemove(null, rawFile);
      }
    },
    abort(file) {
      const { reqs } = this; // request请求map，uid为键
      if (file) {
        // 指定某个中断请求
        let uid = file;
        if (file.uid) uid = file.uid;
        if (reqs[uid]) {
          reqs[uid].abort();
        }
      } else {
        // 中断所有请求
        Object.keys(reqs).forEach((uid) => {
          if (reqs[uid]) reqs[uid].abort(); // xhr原生中断方法
          delete reqs[uid]; // 清理引用
        });
      }
    },
    post(rawFile) {
      const { uid } = rawFile;
      // ajax请求的选项设置
      const options = {
        headers: this.headers,
        withCredentials: this.withCredentials,
        file: rawFile,
        data: this.data,
        filename: this.name,
        action: this.action,
        onProgress: e => {
          this.onProgress(e, rawFile);
        },
        onSuccess: res => {
          this.onSuccess(res, rawFile);
          delete this.reqs[uid]; // 删除ajax引用
        },
        onError: err => {
          this.onError(err, rawFile);
          delete this.reqs[uid]; // 删除ajax引用
        }
      };
      const req = this.httpRequest(options);
      this.reqs[uid] = req; // 保存httpRequest引用
      // 支持自定义httpRequest返回Promise
      if (req && req.then) {
        req.then(options.onSuccess, options.onError);
      }
    },
    handleClick() {
      if (!this.disabled) {
        this.$refs.input.value = null; // 清空原图片
        this.$refs.input.click(); // 在input上模拟触发一次点击事件
      }
    },
    // 绑定键盘事件
    handleKeydown(e) {
      if (e.target !== e.currentTarget) return;
      if (e.keyCode === 13 || e.keyCode === 32) {
        this.handleClick();
      }
    }
  },

  render(h) {
    let {
      handleClick,
      drag,
      name,
      handleChange,
      multiple,
      accept,
      listType,
      uploadFiles,
      disabled,
      handleKeydown
    } = this;
    const data = {
      class: {
        'el-upload': true
      },
      // 绑定事件
      on: {
        click: handleClick,
        keydown: handleKeydown
      }
    };
    data.class[`el-upload--${listType}`] = true;
    return (
      <div {...data} tabindex="0" >
        {
          drag
            ? <upload-dragger disabled={disabled} on-file={uploadFiles}>{this.$slots.default}</upload-dragger> // 拖拽组件，slots.default 一般是一些描述性文字
            : this.$slots.default // 一般是一个点击上传的按钮
        }
        <input class="el-upload__input" type="file" ref="input" name={name} on-change={handleChange} multiple={multiple} accept={accept}></input>
      </div>
    );
  }
};
</script>
