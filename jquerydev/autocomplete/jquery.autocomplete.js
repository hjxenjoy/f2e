/**
 * 基于jQuery的模糊查询插件
 * jquery.autocomplete.js
 * @base jquery-1.8.3
 * @author hjxenjoy@foxmail.com
 * @date 2014-08-22
 */
;(function(global){
  'use strict';

  var $ = global.jQuery,
      namespace = 'autocomplete-api',
      // 监听文本框内容变化事件
      inputEvent = 'propertychange.autocomplete-api input.autocomplete-api',
      _slice = [].slice,
      _replace = String.prototype.replace,
      zIndex = 100,
      config = {
        // 是否多选(tags)
        multiple: false,
        // 数据源/查询数据源方法
        source: null,
        // 输入最少多少字符激活查询匹配
        minlength: 3,
        // 插件z-index，防止被覆盖
        zIndex: 0,
        // 模糊查询默认提示, multiple==false时生效
        placeholder: '请选择',
        // 动态查询数据时提示信息
        loading: '正在查询...',
        // 查询/匹配结果为空时信息
        empty: '无匹配数据',
        // 默认一次最多显示结果个数
        size: 10,
        // 视图宽度，单位px
        width: 300,
        dropdown: {
          // 下拉宽度
          width: 300,
          // 下拉结果list最大高度
          maxHeight: 200
        },
        // 格式化提供的数据list为插件所需格式
        format: null,
        // 进行查询匹配时，匹配的对象key数组
        target: 'label', // or ['label', 'value']
        // 选择数据
        select: null,
        // 渲染
        render: null,
        // 清空所选
        clear: null,
        // 值变化(包括清空)时
        change: null,
        // 冻结，变为只读模式
        freeze: null,
        // 解冻
        unfreeze: null
      };

  function Autocomplete(element, options) {
    this.element = element;
    this.options = options;
    this.init();
  }
  Autocomplete.prototype = {
    constructor: Autocomplete,

    init: function () {
      var source = this.options.source,
          dropdown = this.options.dropdown,
          that = this;
      // change之前的值
      this.ex = [];

      // 静态数据源，初始化时直接格式化缓存
      this.isStatic = (typeof source !== 'function');
      if (this.isStatic) {
        this.list = $.map(source, function (item) {
          return that.format(item);
        });
      }

      if (this.options.multiple) {
        this.createTags();
      } else {
        this.create();
      }

      // 设置了索引偏差
      if (this.options.zIndex !== 0) {
        this.parent.css('zIndex', zIndex + this.options.zIndex);
      } else {
        this.parent.css('zIndex', zIndex--);
      }

      if (dropdown.width) {
        this.dropdown.css('width', (dropdown.width - 2) + 'px');
      }
      if (dropdown.maxHeight) {
        this.dropdown.find('.ac-result').css(
          'maxHeight', dropdown.maxHeight + 'px'
        );
      }

    },

    // 创建模糊查询视图--单选
    create: function () {
      var
      width = this.options.width,
      rid = 'autocomplete' + _replace.call(Math.random(), /\D/, ''),
      html = [
        '<div class="autocomplete" id="' + rid + '">',
        '  <div class="ac-view">',
        '    <div class="ac-label ac-place">',
        this.options.placeholder + '</div>',
        '    <span class="ac-caret"></span>',
        '  </div>',
        '  <div class="ac-dropdown hide">',
        '    <input type="text" class="ac-search" autocomplete="false"/>',
        '    <div class="ac-result">',
        '      <div class="ac-loading hide"></div>',
        '      <div class="ac-message hide"></div>',
        '      <ul></ul>',
        '      <p></p>',
        '    </div>',
        '  </div>',
        '</div>'
      ];
      this.element.before(html.join(''));

      // 对象缓存
      this.parent = $('#' + rid);
      this.view = this.parent.find('.ac-view');
      this.label = this.parent.find('.ac-label');
      this.dropdown = this.parent.find('.ac-dropdown');
      this.searcher = this.parent.find('.ac-search');
      this.result = this.parent.find('ul');
      this.loading = this.parent.find('.ac-loading');
      this.message = this.parent.find('.ac-message');

      this.listen();

      // 判断是否存在值
      var existLabel = this.element.data('autocomplete'),
        value = this.element.val();
      if (value) {
        existLabel = existLabel ? existLabel : value;
        this.label.text(existLabel).removeClass('ac-place');
        this.ex = [{label: existLabel, value: value }];
      }

      if (width > 0) {
        this.parent.css('width', width + 'px');
        this.label.css('width', (width - 34) + 'px');
      }
    },

    // 创建模糊查询视图--多选
    createTags: function () {
      var
      width = this.options.width,
      rid = 'autocomplete' + _replace.call(Math.random(), /\D/, ''),
      html = [
        '<div class="autocomplete ac-tags" id="' + rid + '">',
        '  <div class="tags-cart">',
        '    <input type="text" class="tags-search" autocomplete="false"/>',
        '    <div class="tags-line"></div>',
        '  </div>',
        '  <div class="ac-dropdown hide">',
        '    <div class="ac-result">',
        '      <div class="ac-loading hide"></div>',
        '      <div class="ac-message hide"></div>',
        '      <ul></ul>',
        '      <p></p>',
        '    </div>',
        '  </div>',
        '</div>'
      ];
      this.element.before(html.join(''));

      // 对象缓存
      this.parent = $('#' + rid);
      this.tagcart = this.parent.find('.tags-cart');
      this.dropdown = this.parent.find('.ac-dropdown');
      this.searcher = this.parent.find('.tags-search');
      this.result = this.parent.find('ul');
      this.loading = this.parent.find('.ac-loading');
      this.message = this.parent.find('.ac-message');

      this.listenTags();

      if (width > 0) {
        this.parent.css('width', width + 'px');
      }
    },

    listen: function () {
      var that = this;
      this.view.on('click.autocomplete-api', function () {
        if (that.parent.hasClass('freeze')) {
          return false;
        }
        that.toggle();
      });

      this.searcher
      .on('keypress.autocomplete-api', function (e) {
        // 阻止ENTER表单自动提交
        if (e.keyCode === 13) {
          that.select(that.result.find('li.hover').index());
          e.preventDefault();
        }
      })
      .on('keydown.autocomplete-api', function (e) {
        var target, x = window.scrollX, y = window.scrollY;
        if (e.keyCode === 38) {  // key up
          target = that.result.find('li.hover').removeClass('hover');
          if (target.prev('li').length) {
            target.prev('li').addClass('hover')[0].scrollIntoView();
          } else {
            that.result.find('li').last()
              .addClass('hover')[0].scrollIntoView();
          }
          window.scrollTo(x, y);
        } else if (e.keyCode === 40) {  // key down
          target = that.result.find('li.hover').removeClass('hover');
          if (target.next('li').length) {
            target.next('li').addClass('hover')[0].scrollIntoView();
          } else {
            that.result.find('li').first()
              .addClass('hover')[0].scrollIntoView();
          }
          window.scrollTo(x, y);
        }
      });

      this.searcher.on(inputEvent, function () {
        // 防止IE下js改变文本框的值时触发propertychange事件
        if (!that.dropdown.hasClass('hide')) {
          that.match();
        }
      });

      this.result
        .on('click.autocomplete-api', 'li', function (e) {
          that.select($(this).index());
          e.stopPropagation();
        });
    },

    listenTags: function () {
      var that = this;
      this.searcher
      .on('focus.toggle-dropdown', function () {
        if (that.parent.hasClass('freeze')) {
          return false;
        }
        if (that.options.minlength === 0) {
          that.showDrop();
        }
      })
      .on('keypress.autocomplete-api', function (e) {
        if (e.keyCode === 13) {
          that.select(that.result.find('li.hover').index());
          e.preventDefault();
        }
      })
      .on('keydown.autocomplete-api', function (e) {
        var target, x = window.scrollX, y = window.scrollY;
        if (e.keyCode === 38) {  // key up
          target = that.result.find('li.hover').removeClass('hover');
          if (target.prev('li').length) {
            target.prev('li').addClass('hover')[0].scrollIntoView();
          } else {
            that.result.find('li').last()
              .addClass('hover')[0].scrollIntoView();
          }
          window.scrollTo(x, y);
        } else if (e.keyCode === 40) {  // key down
          target = that.result.find('li.hover').removeClass('hover');
          if (target.next('li').length) {
            target.next('li').addClass('hover')[0].scrollIntoView();
          } else {
            that.result.find('li').first()
              .addClass('hover')[0].scrollIntoView();
          }
          window.scrollTo(x, y);
        } else if (e.keyCode === 8) { // delete or backspace
          if (!this.value) {
            that.remove(that.searcher.prev('.tags-label').find('.tag-close'));
            e.preventDefault();
          }
        }
      });

      this.searcher.on(inputEvent, function () {
        if (!that.dropdown.hasClass('hide')) {
          that.match();
        }
      });

      this.result
        .on('click.autocomplete-api', 'li', function (e) {
          that.select($(this).index());
          e.stopPropagation();
        });

      this.tagcart
        .on('click.autocomplete.prevent', '.tags-label', function (e) {
          e.stopPropagation();
        })
        .on('click.autocomplete.prevent', '.tags-search', function (e) {
          e.stopPropagation();
        })
        .on('click.autocomplete.', '.tag-close', function () {
          var $this = $(this);
          that.remove($this);
        })
        .on('click.autocomplete.focus-search', function () {
          that.searcher.focus();
        });
    },

    // 下拉控制
    toggle: function () {
      this.dropdown.hasClass('hide') ? this.showDrop() : this.hideDrop();
    },

    // 关闭下拉
    hideDrop: function () {
      $('.ac-dropdown').addClass('hide').find('.ac-search').val('');
    },

    // 显示下拉
    showDrop: function () {
      this.hideDrop();
      this.dropdown.removeClass('hide');
      if (this.options.minlength === 0) {
        // 下拉直接匹配数据
        this.match();
      }

      if (!this.options.multiple) {
        this.searcher.focus();
      }
    },

    // 查询数据
    search: function (pattern) {
      var source = this.options.source,
          defer = $.Deferred();
      source(pattern, defer.resolve);
      return defer.promise();
    },

    // 根据返回数据匹配数据列表
    match: function () {
      var result1 = [],
        result2 = [],
        highlight = this.highlight,
        target = this.options.target,
        count = 0,
        pattern = this.searcher.val(),
        that = this;

      // clear data before
      this.cache = [];
      this.result.html('');

      if (this.isStatic) {
        $.each(this.list, function (i, item) {
          var li = '';
          if (!pattern || item.label.indexOf(pattern) > -1) {
            li = '<li>' + that.render(item, pattern, highlight) + '</li>';
            if (that.isEqual(target, item, pattern)) {
              result1.push([item, li]);
            } else {
              result2.push([item, li]);
            }
            count += 1;
            if (count >= that.options.size) {
              return false;
            }
          }
        });
        this.display(result1.concat(result2));
      } else {
        this.loading.removeClass('hide').text(this.options.loading);
        this.search(pattern).done(function (list) {
          that.list = $.map(list, function (item) {
            return that.format(item);
          });
        }).done(function () {
          that.loading.addClass('hide').text('');
          $.each(that.list, function (i, item) {
            var li = '<li>' + that.render(item, pattern, highlight) + '</li>';
            if (that.isEqual(target, item, pattern)) {
              result1.push([item, li]);
            } else {
              result2.push([item, li]);
            }

            count += 1;
            if (count >= that.options.size) { // 控制显示条目个数
              return false;
            }
          });
          that.display(result1.concat(result2));
        });
      }
    },

    // 判断搜索条件是否与目标完全相等
    isEqual: function (targets, item, pattern) {
      if ($.isArray(targets)) {
        return $.map(targets, function (target) {
          return item[target] === pattern ? 1 : 0;
        }).join('').indexOf('1') > -1;
      } else if (typeof targets === 'string') {
        return item[targets] === pattern;
      } else {
        return false;
      }
    },

    // 显示匹配结果
    display: function (result) {
      var html = [], cache = [];
      $.each(result, function (i, array) {
        cache.push(array[0]);
        html.push(array[1]);
      });
      this.cache = cache;
      this.result.html(html.join(''));
      if (html.length) {
        this.message.addClass('hide').text('');
        this.result.removeClass('hide')
        .find('li').on('mouseenter', function () {
          $(this).addClass('hover').siblings('.hover').removeClass('hover');
        }).first().addClass('hover');
      } else {
        this.result.addClass('hide');
        this.message.removeClass('hide').text(this.options.empty);
      }
    },

    // 格式化数据为所需格式[{label:'', value: ''}]
    format: function (item) {
      var _format = this.options.format;
      if (typeof _format === 'function') {
        return _format(item);
      }
      return {label: item, value: item, self: item};
    },

    // 渲染<li>
    render: function (item, pattern, highlight) {
      var _render = this.options.render;
      if (typeof _render === 'function') {
        return _render(item, pattern, highlight);
      }
      return highlight(item.label, pattern);
    },

    // 高亮
    highlight: function (target, pattern) {
      var reg = new RegExp('(' + pattern + ')', 'i');
      return target.replace(reg, '<em>$1</em>');
    },

    // 选择一条
    select: function (index) {
      if (this.options.multiple) {
        this.add(index);
      } else {
        this.replace(index);
      }
    },

    // 覆盖，for单选
    replace: function (index) {
      var item = this.cache[index],
        before = this.ex[0] || {},
        _select = this.options.select || function () {};

      if (before.value !== item.value) {
        this.element.val(item.value);
        this.label.text(item.label).removeClass('ac-place');
        this.ex = [item];
        _select(item);

        this.change(item);
      }
      this.hideDrop();
    },

    // 添加一条进入已选cu，for多选
    add: function (index) {
      var item = this.cache[index],
        _select = this.options.select || function () {},
        exist = false;

      // 重复性查找
      $.each(this.ex, function (i, before) {
        if ((before || {}).value === item.value) {
          exist = true;
          return false;
        }
      });

      if (!exist) {
        this.ex.push(item);
        this.searcher.before(this.tagHtml(item));

        // 多选不会给表单赋值，需要手动添加所需格式值
        _select(this.ex);

        this.change(this.ex);
      }

      this.hideDrop();
      this.searcher.val('').focus();
    },

    // 多选插件一项的HTML代码生成
    tagHtml: function (item) {
      var
      index = this.ex.length - 1,
      html = [
        '<div class="tags-label">',
        '  <span class="tag-text">' + item.label + '</span>',
        '  <span class="tag-close" data-index="' + index + '">&times;</span>',
        '</div>'
      ];
      return html.join('');
    },

    // 从已选中删除一条，for多选
    remove: function (label) {
      var index = label.data('index');
      label.parent().remove();
      this.searcher.focus();

      delete this.ex[index];
      while(this.ex.length > 0 && !this.ex[this.ex.length - 1]) {
        this.ex.pop();
      }
      (this.options.select || function () {})(this.ex);
      this.change(this.ex);
    },

    // 清空已选
    clear: function () {
      this.ex = [];
      if (this.options.multiple) {
        this.searcher.siblings('.tags-label').remove();
        this.change(this.ex);
      } else {
        this.label.text(this.options.placeholder).addClass('ac-place');
        this.element.val('');
        this.element.removeData('autocomplete');
        this.change();
      }
      return this;
    },

    // 值变化时(when select or clear)
    change: function (cu) {
      (this.options.change || function () {})(cu);
    },

    // 冻结，只读模式
    freeze: function () {
      this.parent.addClass('freeze');
      this.searcher.attr('readonly', 'readonly');
      (this.options.freeze || function () {})();
      return this;
    },

    // 解冻，编辑模式
    unfreeze: function () {
      this.parent.removeClass('freeze');
      this.searcher.removeAttr('readonly');
      (this.options.unfreeze || function () {})();
      return this;
    },

    // 获取插件已选值
    get: function () {
      if (this.options.multiple) {
        return $.map(this.ex, function (item) {
          return {
            label: item.label,
            value: item.value
          };
        });
      } else {
        var item = this.ex[0] || {};
        return {
          label: item.label || '',
          value: item.value || ''
        };
      }
    },

    // 重新给插件赋值
    set: function (param) {
      var html = [];
      if ($.isArray(param) && this.options.multiple) {
        $.each(param, function (index, item) {
          html[html.length] = '' +
          '<div class="tags-label">' +
          '<span class="tag-text">' + item.label + '</span>' +
          '<span class="tag-close" data-index="' + index + '">&times;</span>' +
          '</div>';
        });
        this.searcher.siblings('.tags-label').remove()
          .end().before(html.join(''));

        this.ex = param;
      } else {
        this.label.text(param.label).removeClass('ac-place');
        this.element.val(param.value);
        this.ex = [{label: param.label, value: param.value}];
      }
      return this;
    },

    hide: function () {
      this.parent.addClass('hide');
      return this;
    },

    show: function () {
      this.parent.removeClass('hide');
      return this;
    },

    placeholder: function (ph) {
      this.options.placeholder = ph;
      if (this.label.hasClass('ac-place')) {
        this.label.text(ph);
      }
      return this;
    },

    // 空方法，防止外部调用不存在方法报错
    noop: function () {}
  };

  $.fn.autocomplete = function () {
    var params = _slice.call(arguments, 0),
        options = params[0],
        data = this.data(namespace),
        command = typeof options === 'string' ? options : null;

    if (!data) {
      if (typeof options === 'string') {
        options = config;
      } else {
        options = $.extend(true, {}, config, options || {});
      }
      this.data(namespace, (data = new Autocomplete(this, options)));
    }
    return data[command || 'noop'].apply(data, params.slice(1));
  };

  $(document)
    .on('click.autocomplete-api', function () {
      Autocomplete.prototype.hideDrop();
    })
    .on('click.autocomplete-api', '.autocomplete', function (e) {
      e.stopPropagation();
    });

})(this);
