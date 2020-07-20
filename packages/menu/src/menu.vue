<script type="text/jsx">
  import emitter from 'element-ui/src/mixins/emitter';
  import Migrating from 'element-ui/src/mixins/migrating';
  import Menubar from 'element-ui/src/utils/menu/aria-menubar';
  import { addClass, removeClass, hasClass } from 'element-ui/src/utils/dom';

  export default {
    name: 'ElMenu',

    render (h) {
      const component = (
        <ul
          role="menubar"
          key={ +this.collapse }
          style={{ backgroundColor: this.backgroundColor || '' }}
          class={{
            'el-menu--horizontal': this.mode === 'horizontal',
            'el-menu--collapse': this.collapse,
            "el-menu": true
          }}
        >
          { this.$slots.default }
        </ul>
      );

      if (this.collapseTransition) {
        return (
          <el-menu-collapse-transition>
            { component }
          </el-menu-collapse-transition>
        );
      } else {
        return component;
      }
    },

    componentName: 'ElMenu',

    mixins: [emitter, Migrating],

    provide() {
      return {
        rootMenu: this
      };
    },

    components: {
      'el-menu-collapse-transition': {
        functional: true,
        render(createElement, context) {
          const data = {
            props: {
              mode: 'out-in'
            },
            on: {
              beforeEnter(el) {
                el.style.opacity = 0.2;
              },

              enter(el) {
                addClass(el, 'el-opacity-transition');
                el.style.opacity = 1;
              },

              afterEnter(el) {
                removeClass(el, 'el-opacity-transition');
                el.style.opacity = '';
              },

              beforeLeave(el) {
                if (!el.dataset) el.dataset = {};

                if (hasClass(el, 'el-menu--collapse')) {
                  removeClass(el, 'el-menu--collapse');
                  el.dataset.oldOverflow = el.style.overflow;
                  el.dataset.scrollWidth = el.clientWidth;
                  addClass(el, 'el-menu--collapse');
                } else {
                  addClass(el, 'el-menu--collapse');
                  el.dataset.oldOverflow = el.style.overflow;
                  el.dataset.scrollWidth = el.clientWidth;
                  removeClass(el, 'el-menu--collapse');
                }

                el.style.width = el.scrollWidth + 'px';
                el.style.overflow = 'hidden';
              },

              leave(el) {
                addClass(el, 'horizontal-collapse-transition');
                el.style.width = el.dataset.scrollWidth + 'px';
              }
            }
          };
          return createElement('transition', data, context.children);
        }
      }
    },

    props: {
      mode: {
        type: String,
        default: 'vertical'
      },
      defaultActive: {
        type: String,
        default: ''
      },
      defaultOpeneds: Array,
      uniqueOpened: Boolean,
      router: Boolean,
      menuTrigger: {
        type: String,
        default: 'hover'
      },
      collapse: Boolean,//是否变成图标
      backgroundColor: String,
      textColor: String,
      activeTextColor: String,
      collapseTransition: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        activeIndex: this.defaultActive,
        openedMenus: (this.defaultOpeneds && !this.collapse) ? this.defaultOpeneds.slice(0) : [],
        items: {},//菜单
        submenus: {}//子菜单
      };
    },
    computed: {
      //悬停背景
      hoverBackground() {
        return this.backgroundColor ? this.mixColor(this.backgroundColor, 0.2) : '';
      },
      //是否需要悬浮块（在横向菜单或者垂直菜单<折叠>）
      isMenuPopup() {
        return this.mode === 'horizontal' || (this.mode === 'vertical' && this.collapse);
      }
    },
    watch: {
      defaultActive: 'updateActiveIndex',

      defaultOpeneds(value) {
        if (!this.collapse) {
          this.openedMenus = value;
        }
      },

    //通知所有子菜单更新是否折叠
      collapse(value) {
        if (value) this.openedMenus = [];
        this.broadcast('ElSubmenu', 'toggle-collapse', value);
      }
    },
    methods: {
      //初始化活跃项，打开活跃项所在的菜单
      updateActiveIndex() {
        const item = this.items[this.defaultActive];
        if (item) {
          this.activeIndex = item.index;
          this.initOpenedMenu();//打开子菜单
        } else {
          this.activeIndex = null;
        }
      },

      getMigratingConfig() {
        return {
          props: {
            'theme': 'theme is removed.'
          }
        };
      },
      //把#fff等颜色编号，转化成rgb（）值
      getColorChannels(color) {
        color = color.replace('#', '');
        if (/^[0-9a-fA-F]{3}$/.test(color)) {
          color = color.split('');
          //把#fff变成#ffffff，这里的插入顺序值得学习，从后往前插，这样对应的字符顺序不会改变。从前往后插，字符的index需要动态计算
          for (let i = 2; i >= 0; i--) {
            color.splice(i, 0, color[i]);
          }
          color = color.join('');
        }
        //把16进制转化成10进制
        if (/^[0-9a-fA-F]{6}$/.test(color)) {
          return {
            red: parseInt(color.slice(0, 2), 16),
            green: parseInt(color.slice(2, 4), 16),
            blue: parseInt(color.slice(4, 6), 16)
          };
        } else {
          return {
            red: 255,
            green: 255,
            blue: 255
          };
        }
      },
      //处理颜色数值
      mixColor(color, percent) {
        let { red, green, blue } = this.getColorChannels(color);
        if (percent > 0) { // shade given color
          red *= 1 - percent;
          green *= 1 - percent;
          blue *= 1 - percent;
        } else { // tint given color
          red += (255 - red) * percent;
          green += (255 - green) * percent;
          blue += (255 - blue) * percent;
        }
        return `rgb(${ Math.round(red) }, ${ Math.round(green) }, ${ Math.round(blue) })`;
      },
      //设置响应式items项
      addItem(item) {
        this.$set(this.items, item.index, item);
      },
      //删除对应项
      removeItem(item) {
        delete this.items[item.index];
      },
      //设置响应式子菜单
      addSubmenu(item) {
        this.$set(this.submenus, item.index, item);
      },
      //删除响应式子菜单
      removeSubmenu(item) {
        delete this.submenus[item.index];
      },
      //打开submenu菜单，居然是存入数组
      openMenu(index, indexPath) {
        let openedMenus = this.openedMenus;
        //已经打开的，不打开
        if (openedMenus.indexOf(index) !== -1) return;
        // 将不在该菜单路径下的其余菜单收起
        // collapse all menu that are not under current menu item
        if (this.uniqueOpened) {
          this.openedMenus = openedMenus.filter(index => {
            return indexPath.indexOf(index) !== -1;
          });
        }
        this.openedMenus.push(index);
      },
      //关闭菜单居然是删除数组
      closeMenu(index) {
        const i = this.openedMenus.indexOf(index);
        if (i !== -1) {
          this.openedMenus.splice(i, 1);
        }
      },
      //子菜单被点击，操作打开或者关闭
      handleSubmenuClick(submenu) {
        const { index, indexPath } = submenu;
        let isOpened = this.openedMenus.indexOf(index) !== -1;

        if (isOpened) {
          this.closeMenu(index);
          this.$emit('close', index, indexPath);//sub-menu 关闭的回调，供外部使用
        } else {
          this.openMenu(index, indexPath);
          this.$emit('open', index, indexPath);//sub-menu 展开的回调，供外部使用
        }
      },
      //菜单项（叶子节点）被点击
      handleItemClick(item) {
        const { index, indexPath } = item;
        const oldActiveIndex = this.activeIndex;

        this.activeIndex = item.index;
        //提供事件对外使用
        this.$emit('select', index, indexPath, item);

        //如果水平的或者折叠的就清空打开菜单
        if (this.mode === 'horizontal' || this.collapse) {
          this.openedMenus = [];
        }

        //如果指定路由
        if (this.router) {
          this.routeToItem(item, (error) => {
            //一旦错误就回滚操作
            this.activeIndex = oldActiveIndex;
            if (error) console.error(error);
          });
        }
      },
      // 初始化展开菜单
      // initialize opened menu
      initOpenedMenu() {
        const index = this.activeIndex;
        const activeItem = this.items[index];//当前活跃项
        if (!activeItem || this.mode === 'horizontal' || this.collapse) return;//没有活跃项，或者水平菜单，或者折叠菜单都忽略

        let indexPath = activeItem.indexPath;

        // 展开该菜单项的路径上（往父节点的方向，不是子节点）所有子菜单
        // expand all submenus of the menu item
        indexPath.forEach(index => {
          let submenu = this.submenus[index];
          submenu && this.openMenu(index, submenu.indexPath);
        });
      },
      //转到相应路由
      routeToItem(item, onError) {
        let route = item.route || item.index;
        try {
          //转到指定路由，push（路由，成功回调，失败回调）
          this.$router.push(route, () => {}, onError);
        } catch (e) {
          console.error(e);
        }
      },
      //打开指定子菜单
      open(index) {
        const { indexPath } = this.submenus[index.toString()];
        indexPath.forEach(i => this.openMenu(i, indexPath));
      },
      //关闭指定菜单
      close(index) {
        this.closeMenu(index);
      }
    },
    mounted() {
      this.initOpenedMenu();
      this.$on('item-click', this.handleItemClick);//监听menu-item发出的事件
      this.$on('submenu-click', this.handleSubmenuClick);//监听submenu被点击
      if (this.mode === 'horizontal') {
        new Menubar(this.$el); // eslint-disable-line
      }
      //监听this.items ,一旦变化就更新ActiveIndex
      this.$watch('items', this.updateActiveIndex);
    }
  };
</script>
