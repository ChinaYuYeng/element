<script>
import UploadList from './upload-list';
import Upload from './upload';
import ElProgress from 'element-ui/packages/progress';
import Migrating from 'element-ui/src/mixins/migrating';

function noop() {}

export default {
  name: 'ElUpload',

  mixins: [Migrating],

  components: {
    ElProgress,
    UploadList,
    Upload
  },

  provide() {
    // 让所有子组件全部能够引用到自己
    return {
      uploader: this
    };
  },

  inject: {
    // 如果父级上有form，可以使用el-form
    elForm: {
      default: ''
    }
  },

  props: {
    action: {
      type: String,
      required: true
    },
    headers: {
      type: Object,
      default() {
        return {};
      }
    },
    data: Object,
    multiple: Boolean,
    name: {
      type: String,
      default: 'file'
    },
    drag: Boolean,
    dragger: Boolean,
    withCredentials: Boolean,
    showFileList: {
      type: Boolean,
      default: true
    },
    accept: String, // 上传文件的类型
    type: {
      type: String,
      default: 'select'
    },
    beforeUpload: Function,
    beforeRemove: Function,
    onRemove: {
      type: Function,
      default: noop
    },
    onChange: {
      type: Function,
      default: noop
    },
    onPreview: {
      type: Function
    },
    onSuccess: {
      type: Function,
      default: noop
    },
    onProgress: {
      type: Function,
      default: noop
    },
    onError: {
      type: Function,
      default: noop
    },
    fileList: {
      type: Array,
      default() {
        return [];
      }
    },
    autoUpload: {
      type: Boolean,
      default: true
    },
    listType: { // 文件列表类型
      type: String,
      default: 'text' // text,picture,picture-card
    },
    httpRequest: Function,
    disabled: Boolean,
    limit: Number,
    onExceed: {
      type: Function,
      default: noop
    }
  },

  data() {
    return {
      uploadFiles: [], // 已上传或者要上传的文件列表
      dragOver: false,
      draging: false,
      tempIndex: 1
    };
  },

  computed: {
    uploadDisabled() {
      return this.disabled || (this.elForm || {}).disabled; // 当前不可用，或者form不可用
    }
  },

  watch: {
    // 外部提供的文件列表，差不多是uploadFiles的初始值
    fileList: {
      immediate: true,
      handler(fileList) {
        this.uploadFiles = fileList.map(item => {
          item.uid = item.uid || (Date.now() + this.tempIndex++);// 唯一键 时间+计数
          item.status = item.status || 'success';// 设置success的图片不会再次上传，此时可以作为已上传的预览，可以自己设置为非成功状态
          return item;
        });
      }
    }
  },

  methods: {
    // 上传图片前的初始化工作，
    /**
     * rawFile是原生文件对象
     */
    handleStart(rawFile) {
      rawFile.uid = Date.now() + this.tempIndex++; // 给原生文件对象一个uid
      let file = {
        status: 'ready',
        name: rawFile.name,
        size: rawFile.size,
        percentage: 0,
        uid: rawFile.uid, // 此处和原生的uid一致，方便寻找相同的uid
        raw: rawFile
      };

      try {
        file.url = URL.createObjectURL(rawFile);
      } catch (err) {
        console.error(err);
        return;
      }

      this.uploadFiles.push(file);// 添加一个文件对象
      this.onChange(file, this.uploadFiles);
    },
    /**
     * ev原生上传事件对象，rawfile原生上传文件对象
     */
    handleProgress(ev, rawFile) {
      const file = this.getFile(rawFile);
      this.onProgress(ev, file, this.uploadFiles);// 用户上传过程回调
      file.status = 'uploading';
      file.percentage = ev.percent || 0;
    },
    // upload成功回调
    handleSuccess(res, rawFile) {
      const file = this.getFile(rawFile);

      if (file) {
        file.status = 'success';
        file.response = res;// 设置http请求响应

        this.onSuccess(res, file, this.uploadFiles);// 成功用户回调
        this.onChange(file, this.uploadFiles);
      }
    },
    // upload 错误事件回调
    handleError(err, rawFile) {
      const file = this.getFile(rawFile);
      const fileList = this.uploadFiles;

      file.status = 'fail';

      fileList.splice(fileList.indexOf(file), 1); // 删除上传出错的文件

      this.onError(err, file, this.uploadFiles);// 用户错误回调
      this.onChange(file, this.uploadFiles); // 用户文件列表改变回调
    },
    // upload和uploadList组件中删除事件的回调函数
    handleRemove(file, raw) {
      if (raw) {
        file = this.getFile(raw);
      }
      let doRemove = () => {
        this.abort(file); // 中断上传
        let fileList = this.uploadFiles;
        fileList.splice(fileList.indexOf(file), 1); // 删除
        this.onRemove(file, fileList); // onremove用户回调
      };

      if (!this.beforeRemove) {
        doRemove(); // 调用
      } else if (typeof this.beforeRemove === 'function') {
        const before = this.beforeRemove(file, this.uploadFiles); // 删除前的回调
        // promise
        if (before && before.then) {
          before.then(() => {
            doRemove();
          }, noop);
          // 其他
        } else if (before !== false) {
          doRemove();
        }
      }
    },
    // 根据给定的对象，找到指定的文件对象
    /**
     * rawFile是原生对象，前期赋值uid，对象file的uid
     */
    getFile(rawFile) {
      let fileList = this.uploadFiles;
      let target;
      fileList.every(item => {// 使用every遍历，可以随时中断退出
        target = rawFile.uid === item.uid ? item : null;
        return !target;
      });
      return target;
    },
    abort(file) {
      // 取消上传
      this.$refs['upload-inner'].abort(file);// 这里的file就是uploadFiles里的元素
    },
    // 清空所有的文件列表
    clearFiles() {
      this.uploadFiles = [];
    },

    // 手动提交
    submit() {
      this.uploadFiles
        .filter(file => file.status === 'ready')// 只提交ready状态的，也就是说，开始给到success状态的话，并不会提交（此时可理解为已经提交），可以做为已提交预览
        .forEach(file => {
          this.$refs['upload-inner'].upload(file.raw);// 手动调用子组件的方法， 逐个提交，图片是一个一个提交的，效率不怎么高啊
        });
    },
    getMigratingConfig() {
      return {
        props: {
          'default-file-list': 'default-file-list is renamed to file-list.',
          'show-upload-list': 'show-upload-list is renamed to show-file-list.',
          'thumbnail-mode': 'thumbnail-mode has been deprecated, you can implement the same effect according to this case: http://element.eleme.io/#/zh-CN/component/upload#yong-hu-tou-xiang-shang-chuan'
        }
      };
    }
  },

  render(h) {
    let uploadList;

    if (this.showFileList) {
      uploadList = (
        <UploadList
          disabled={this.uploadDisabled}
          listType={this.listType}
          files={this.uploadFiles}
          on-remove={this.handleRemove}
          handlePreview={this.onPreview}>
        </UploadList>
      );
    }

    const uploadData = {
      props: {
        type: this.type,
        drag: this.drag,
        action: this.action,
        multiple: this.multiple,
        'before-upload': this.beforeUpload,
        'with-credentials': this.withCredentials,
        headers: this.headers,
        name: this.name,
        data: this.data,
        accept: this.accept,
        fileList: this.uploadFiles,
        autoUpload: this.autoUpload,
        listType: this.listType,
        disabled: this.uploadDisabled,
        limit: this.limit,
        'on-exceed': this.onExceed,
        'on-start': this.handleStart,
        'on-progress': this.handleProgress,
        'on-success': this.handleSuccess,
        'on-error': this.handleError,
        'on-preview': this.onPreview,
        'on-remove': this.handleRemove,
        'http-request': this.httpRequest
      },
      ref: 'upload-inner'
    };

    const trigger = this.$slots.trigger || this.$slots.default;
    const uploadComponent = <upload {...uploadData}>{trigger}</upload>;

    return (
      <div>
        { this.listType === 'picture-card' ? uploadList : ''}
        {
          this.$slots.trigger
            ? [uploadComponent, this.$slots.default]
            : uploadComponent
        }
        {this.$slots.tip}
        { this.listType !== 'picture-card' ? uploadList : ''}
      </div>
    );
  }
};
</script>
