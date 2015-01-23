//  
//                                  _oo8oo_
//                                 o8888888o
//                                 88" . "88
//                                 (| -_- |)
//                                 0\  =  /0
//                               ___/'==='\___
//                             .' \\|     |// '.
//                            / \\|||  :  |||// \
//                           / _||||| -:- |||||_ \
//                          |   | \\\  -  /// |   |
//                          | \_|  ''\---/''  |_/ |
//                          \  .-\__  '-'  __/-.  /
//                        ___'. .'  /--.--\  '. .'___
//                     ."" '<  '.___\_<|>_/___.'  >' "".
//                    | | :  `- \`.:`\ _ /`:.`/ -`  : | |
//                    \  \ `-.   \_ __\ /__ _/   .-` /  /
//                =====`-.____`.___ \_____/ ___.`____.-`=====
//                                  `=---=`
//  
//  
//               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 
//                          佛祖保佑         永无bug
//                          
/**
 * Copyright (c) 2014 hjxenjoy
 */
;(function(factory) {

  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else {
    factory(jQuery);
  }

})(function($) {
  'use strict';

  var inac = false;

  var namespace = 'autocomplete-api';
  var times = 500;
  var acSet = [];
  var _slice = Array.prototype.slice;
  var random = function (prefix) {
    var r =  Math.random().toString(36).substr(2);
    return (typeof prefix === 'string' ? prefix : '') + r;
  };

  /**
   * 删除指定索引位置元素
   * @param array
   * @param index
   * @returns {Array}
   */
  var arrRemove = function (array, index) {
    var suf = array.splice(index + 1);
    array.pop();
    return array.concat(suf);
  };

  var panel = function (item) {
    var html = [
      '<div class="tags-label">',
      item.label,
      '  <span class="tag-close">&times;</span>',
      '</div>'
    ];

    return html.join('');
  };

  var setPosition = function (target, dropdown) {
    var pos = target.offset();
    var height = target.outerHeight();
    var width = target.outerWidth();
    var $w = $(window);
    var wh = $w.outerHeight();
    var ww = $w.outerWidth();

    // 元素距离浏览器顶部的相对距离
    var relativeTop = pos.top - $w.scrollTop();
    var isTopSide = true;
    var csser = {};
    // target higher than half page
    if ( relativeTop < wh / 2) {
      csser.top = (pos.top + height + 1) + 'px';
      csser.bottom = 'auto';
      // target on right side
      if (pos.left > ww /2) {
        csser.right = (ww - width - pos.left) + 'px';
        csser.left = 'auto';
      } else {
        csser.right = 'auto';
        csser.left = pos.left + 'px';
      }
    } else { // target lower than half page
      isTopSide = false;
      csser.top = 'auto';
      csser.bottom = (wh - pos.top + 1) + 'px';
      // target on right side
      if (pos.left > ww /2) {
        csser.right = (ww - width - pos.left) + 'px';
        csser.left = 'auto';
      } else {
        csser.right = 'auto';
        csser.left = pos.left + 'px';
      }
    }
    dropdown.css(csser);

    return isTopSide;
  };

  var setting = {
    multiple    : false,             // 是否多选
    source      : null,              // 数据源 or 查询数据源方法
    minlength   : 0,                 // 最少输入查询关键字长度激活查询
    zIndex      : null,
    placeholder : '请选择',
    prompt      : '请输入关键字查询',
    empty       : '无匹配数据',
    size        : null,              // 自定义一次显示多少条数据
    width       : null,              // 自定义宽度
    dropdown    : {},                // 下拉属性 width, maxHeight

    format      : null,              // 格式化数据为插件识别的JSON格式
    target      : null,              // 是否需要对后台数据进行匹配，进行匹配的key集合
    select      : null,              // 判断数据，是否可以进行赋值 Promise
    render      : null,              // 渲染下拉数据
    clear       : null,              // 清除已选值
    change      : null,              // 当值改变时
    freeze      : null,              // 冻结，插件只读不可编辑
    unfreeze    : null               // 解冻
  };

  function Autocomplete(element, options) {
    this.element = element;
    this.options = options;
    this.init();
  }

  Autocomplete.prototype = {
    constructor: Autocomplete,
    author: 'hujx',

    init: function () {
      var that = this;
      var source = this.options.source;
      var format = this.options.format || that.format;

      // change之前的所选item
      this.ex = null;

      // 静态本地数据源
      this.isStatic = typeof source !== 'function';
      // 静态数据源，查询匹配由插件完成
      if (this.isStatic) {
        this.list = $.map(source, function (item) {
          return format(item);
        });
      }

      if (this.options.multiple) {
        this.createTags();
        this.listenTags();
      } else {
        this.createDoms();
        this.listen();
      }
    },

    // 创建插件构成
    createDoms: function () {
      var ran = random();
      var view_id = 'autocomplete_' + ran;
      var dropdown_id = 'ac_dropdown_' + ran;

      var view_html = [
        '<div class="autocomplete-view" id="' + view_id + '">',
        '  <input type="text"  class="ac-search" autocomplete="false" />',
        '  <div class="ac-label ac-place">' + this.options.placeholder + '</div>',
        '  <div class="ac-delete">&times;</div>',
        '  <div class="ac-caret"></div>',
        '</div>'
      ];

      var dropdown_html = [
        '<div class="autocomplete-dropdown hide" id="' + dropdown_id + '">',
        '  <div class="ac-prompt">',
        '    <div class="ac-prompt-text">' + this.options.prompt + '</div>',
        '    <div class="ac-loading"></div>',
        '  </div>',
        '  <div class="ac-result"></div>',
        '</div>'
      ];

      this.element.after(view_html.join(''));
      $('body').append(dropdown_html.join(''));

      this.viewer = $('#' + view_id);
      this.dropdowner = $('#' + dropdown_id);
      this.searcher = this.viewer.find('.ac-search');
      this.labeler = this.viewer.find('.ac-label');
      this.resulter = this.dropdowner.find('.ac-result');
      this.prompter = this.dropdowner.find('.ac-prompt');

      var defaultLabel = this.element.data('autocomplete');
      var defaultValue = this.element.val();
      if (defaultValue) {
        this.viewer.addClass('ac-has-value');
        this.labeler.html(defaultLabel || defaultValue).removeClass('ac-place');
        this.ex = {label: defaultLabel || defaultValue, value: defaultValue};
      }

      var width = this.options.width;
      if (width > 0) {
        this.viewer.css('width', (width - 2) + 'px');
        this.searcher.css('width', (width - 40) + 'px');
      }

      var dropdown = this.options.dropdown;
      if (dropdown.width > 0) {
        this.dropdowner.css('width', (dropdown.width - 2) + 'px');
      }
      if (dropdown.maxHeight > 0) {
        this.resulter.css('maxHeight', (dropdown.maxHeight) + 'px');
      }
    },

    listen: function () {
      var that = this;
      this.viewer
        .on('click.show-dropdown', '.ac-label', function () {
          if (!that.isFreeze) {
            that.startEdit();
          }
        })
        .on('click.toggle-dropdpwn', '.ac-caret', function () {
          if (that.viewer.hasClass('ac-edit-view')) {
            that.closeEdit();
          } else {
            that.startEdit();
          }
        })
        .on('click.clear-autocomplete', '.ac-delete', function () {
          that.clear();
        });

      this.searcher
        .on('keypress.autocomplete-api', function (e) {
          // 阻止ENTER表单自动提交
          if (e.keyCode === 13) {
            var item = that.resulter.find('li.active');
            if (item.length > 0) {
              that.select(that.cache[item.index()]).done(function (item) {
                that.change(item).closeEdit();
              });
            } else {
              that.closeEdit();
            }
            e.preventDefault();
          }
        })
        .on('keydown.autocomplete-api', function (e) {
          if (that.cache.length) {
            if (e.keyCode === 38) {  // key up
              that.up();
              e.preventDefault();
            } else if (e.keyCode === 40) {  // key down
              that.down();
              e.preventDefault();
            }
          }
        });

      this.resulter
        .on('click.select-item', 'li', function () {
          that.select(that.cache[$(this).index()]).done(function (item) {
            that.change(item).closeEdit();
          });
        });
    },

    createTags: function () {
      var ran = random();
      var view_id = 'autocomplete_' + ran;
      var dropdown_id = 'ac_dropdown_' + ran;

      var view_html = [
        '<div class="autocomplete-view ac-tags" id="' + view_id + '">',
        '  <div class="tags-cart"></div>',
        '  <input type="text" class="tags-search" autocomplete="false"/>',
        '</div>'
      ];

      var dropdown_html = [
        '<div class="autocomplete-dropdown hide" id="' + dropdown_id + '">',
        '  <div class="ac-prompt">',
        '    <div class="ac-prompt-text">' + this.options.prompt + '</div>',
        '    <div class="ac-loading"></div>',
        '  </div>',
        '  <div class="ac-result"></div>',
        '</div>'
      ];

      this.element.after(view_html.join(''));
      $('body').append(dropdown_html.join(''));

      // 对象缓存
      this.viewer = $('#' + view_id);
      this.dropdowner = $('#' + dropdown_id);
      this.tagcart = this.viewer.find('.tags-cart');
      this.searcher = this.viewer.find('.tags-search');
      this.resulter = this.dropdowner.find('.ac-result');
      this.prompter = this.dropdowner.find('.ac-prompt');

      var width = this.options.width;
      if (width > 0) {
        this.viewer.css('width', (width - 2) + 'px');
      }

      var dropdown = this.options.dropdown;
      if (dropdown.width > 0) {
        this.dropdowner.css('width', (dropdown.width - 2) + 'px');
      }
      if (dropdown.maxHeight > 0) {
        this.resulter.css('maxHeight', (dropdown.maxHeight) + 'px');
      }

      this.ex = [];
    },

    listenTags: function () {
      var that = this;
      this.searcher
        .on('focus.autocomplete-api', function () {
          if (!that.isFreeze) {
            that.startEdit();
          }
        })
        .on('keypress.autocomplete-api', function (e) {
          // 阻止ENTER表单自动提交
          if (e.keyCode === 13) {
            var item = that.resulter.find('li.active');
            if (item.length > 0) {
              that.select(that.cache[item.index()]).done(function (item) {
                that.change(item).closeEdit();
              });
            } else {
              that.closeEdit();
            }
            e.preventDefault();
          }
        })
        .on('keydown.autocomplete-api', function (e) {
          if (that.cache.length) {
            if (e.keyCode === 38) {  // key up
              that.up();
              e.preventDefault();
            } else if (e.keyCode === 40) {  // key down
              that.down();
              e.preventDefault();
            }
          }
        });

      this.tagcart.on('click.close-tags', '.tag-close', function () {
        var parent = $(this).closest('.tags-label');
        that.ex = arrRemove(that.ex, parent.index());
        parent.remove();
        that.change();
      });

      this.resulter
        .on('click.select-item', 'li', function () {
          that.select(that.cache[$(this).index()]).done(function (item) {
            that.change(item).closeEdit();
          });
        });
    },

    up: function () {
      var current = this.resulter.find('li.active');
      var top = this.resulter.scrollTop();
      var prev = current.prev();
      current.removeClass('active');
      if (prev.length === 0) {
        prev = this.resulter.find('li').last();
        this.resulter.scrollTop(this.resulter.outerHeight());
      } else {
        this.resulter.scrollTop(top - current.outerHeight());
      }
      prev.addClass('active');
    },
    down: function () {
      var current = this.resulter.find('li.active');
      var top = this.resulter.scrollTop();
      var next = current.next();
      current.removeClass('active');
      if (next.length === 0) {
        next = this.resulter.find('li').first();
        this.resulter.scrollTop(0);
      } else {
        this.resulter.scrollTop(top + current.outerHeight());
      }
      next.addClass('active');
    },

    startEdit: function () {
      $.each(acSet, function (i, data) {
        data.closeEdit();
      });
      var that = this;

      if (!that.options.multiple) {
        this.viewer.addClass('ac-edit-view');
      }
      this.searcher.val(this.ex ? this.ex.label : '').select();
      this.dropdowner.removeClass('hide');
      this.isTopSide = setPosition(this.viewer, this.dropdowner);

      if (this.options.minlength === 0) {
        this.match('');
      }

      this.searchKey = this.searcher.val();
      this.interval = window.setInterval(function () {
        if (that.searchKey !== that.searcher.val() && that.searchKey.length >= that.options.minlength) {
          that.searchKey = that.searcher.val();
          that.match();
        }
      }, times);
    },

    match: function () {
      var result1 = [];
      var result2 = [];
      var highlight = this.highlight;
      var target = this.options.target;
      var pattern = this.searchKey;
      var count = 0;
      var size = this.options.size;
      var format = this.options.format || this.format;
      var that = this;

      // clear data before
      this.cache = [];
      this.resulter.empty();

      if (this.isStatic) {
        $.each(this.list, function (i, item) {
          var li = '';
          if (!pattern || item.label.indexOf(pattern) > -1) {
            li = '<li>' + that.render(item, pattern, highlight) + '</li>';
            if (that.isEqual(target || ['label'], item, pattern)) {
              result1.push([item, li]);
            } else {
              result2.push([item, li]);
            }
            count += 1;
            if (size && count >= size) {
              return false;
            }
          }
        });
        this.display(result1.concat(result2));
      } else {
        this.dropdowner.addClass('ac-is-loading');
        this.search(pattern).done(function (list) {
          that.list = $.map(list, function (item) {
            return format(item);
          });
        }).done(function () {
          that.dropdowner.removeClass('ac-is-loading');
          $.each(that.list, function (i, item) {
            var li = '<li>' + that.render(item, pattern, highlight) + '</li>';
            if (target) {
              if (that.isEqual(target, item, pattern)) {
                result1.push([item, li]);
              } else {
                result2.push([item, li]);
              }
            } else {
              result1.push([item, li]);
            }
            count += 1;
            if (size && count >= size) { // 控制显示条目个数
              return false;
            }
          });
          that.display(result1.concat(result2));
        });
      }
    },

    search: function (pattern) {
      var source = this.options.source;
      var defer = $.Deferred();
      source(pattern, defer.resolve);
      return defer.promise();
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
      result = this.isTopSide ? result : result.reverse();
      var html = [], cache = [];
      $.each(result, function (i, array) {
        cache.push(array[0]);
        html.push(array[1]);
      });
      this.cache = cache;
      if (result.length > 0) {
        this.resulter.html('<ul>' + html.join('') + '</ul>');
      } else {
        this.resulter.html('<div class="ac-empty">' + this.options.empty + '</div>');
      }

      // 是否逆向显示
      if (this.isTopSide) {
        this.resulter.before(this.prompter);
        this.dropdowner.removeClass('ac-result-reverse');
        this.resulter.scrollTop(0);
        this.resulter.find('li')
          .on('mouseenter', function () {
            $(this).addClass('active').siblings('.active').removeClass('active');
          }).first().addClass('active');
      } else {
        this.resulter.after(this.prompter);
        this.dropdowner.addClass('ac-result-reverse');
        this.resulter.scrollTop(this.resulter.find('ul').outerHeight());
        this.resulter.find('li')
          .on('mouseenter', function () {
            $(this).addClass('active').siblings('.active').removeClass('active');
          }).last().addClass('active');
      }
    },

    // 格式化数据为所需格式[{label:'', value: ''}]
    format: function (item) {
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
      if (pattern) {
        var reg = new RegExp('(' + pattern + ')', 'i');
        return target.replace(reg, '<em>$1</em>');
      } else {
        return target;
      }
    },

    closeEdit: function () {
      this.viewer.removeClass('ac-edit-view');
      this.dropdowner.addClass('hide');
      this.searcher.val('');
      this.searchKey = '';
      this.resulter.empty();
      window.clearInterval(this.interval);
    },

    clear: function () {
      if (this.options.multiple) {
        this.ex = [];
        this.tagcart.empty();
      } else {
        this.ex = null;
        this.element.val('');
        this.labeler.html(this.options.placeholder).addClass('ac-place');
        this.viewer.removeClass('ac-has-value');
      }
      (this.options.clear || function () {})();
      return this;
    },
    change: function (item) {
      if (this.options.multiple) {
        if (item) {
          this.ex.push(item);
          this.addPanel(item);
        }
      } else {
        this.ex = item;
        this.element.val(item.value);
        this.labeler.html(item.label).removeClass('ac-place');
        this.viewer.addClass('ac-has-value');
      }
      (this.options.change || function () {})(this.ex);
      return this;
    },
    addPanel: function (item) {
      this.tagcart.append(panel(item));
    },
    select: function (item) {
      var _select = this.options.select;
      var defer = $.Deferred();
      if (this.options.multiple) {
        // 多选模式去重
        var exit = false;
        if (this.ex.length > 0) {
          for (var i = 0, len = this.ex.length; i < len; i++) {
            if (item.value === this.ex[i].value) {
              exit = true;
              break;
            }
          }
        }
        if (exit) {
          defer.reject();
        } else {
          if ($.isFunction(_select)) {
            _select(item, defer);
          } else {
            defer.resolve(item);
          }
        }
      } else {
        if ($.isFunction(_select)) {
          _select(item, defer);
        } else {
          defer.resolve(item);
        }
      }
      return defer.promise();
    },

    // 冻结，只读模式
    freeze: function () {
      this.viewer.addClass('freeze');
      this.isFreeze = true;
      this.searcher.attr('readonly', 'readonly');
      (this.options.freeze || function () {})();
      return this;
    },

    // 解冻，编辑模式
    unfreeze: function () {
      this.viewer.removeClass('freeze');
      this.isFreeze = false;
      this.searcher.removeAttr('readonly');
      (this.options.unfreeze || function () {})();
      return this;
    },

    // 获取插件已选值
    get: function () {
      if (this.options.multiple) {
        return this.ex;
      } else {
        var item = this.ex || {};
        return {
          label: item.label || '',
          value: item.value || ''
        };
      }
    },

    // 重新给插件赋值
    set: function (param) {
      if (this.options.multiple) {
        this.ex = [];
        if (param.length > 0) {
          this.ex = param;
          var html = [];
          for (var i = 0, len = param.length; i < len; i++) {
            html.push(panel(param[i]));
          }
          this.tagcart.html(html.join(''));
        }
      } else {
        this.labeler.text(param.label).removeClass('ac-place');
        this.element.val(param.value);
        this.ex = [{label: param.label, value: param.value}];
      }
      return this;
    },

    placeholder: function (ph) {
      this.options.placeholder = ph;
      if (this.labeler.hasClass('ac-place')) {
        this.labeler.html(ph);
      }
      return this;
    },

    noop: function () {
      return this;
    }
  };

  $.fn.autocomplete = function () {
    var params = _slice.call(arguments, 0);
    var options = params[0];
    var data = this.data(namespace);
    var command = typeof options === 'string' ? options : 'noop';

    if (!data) {
      if (typeof options === 'string') {
        options = setting;
      } else {
        options = $.extend(true, {}, setting, options || {});
      }
      this.data(namespace, (data = new Autocomplete(this, options)));
      acSet.push(data);
    }

    return data[command].apply(data, params.slice(1));
  };

  $(document)
    .on('click.autocomplete-api', function () {
      if (!inac) {
        $.each(acSet, function (i, data) {
          data.closeEdit();
        });
      }
      inac = false;
    })
    .on('click.autocomplete-api', '.autocomplete-view', function () {
      inac = true;
    })
    .on('click.autocomplete-api', '.autocomplete-dropdown', function (e) {
      e.stopPropagation();
    });

});