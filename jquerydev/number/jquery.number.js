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

  if (!$._hjx) {
    $._hjx = {};
  }
  $._hjx.number = false;

  $._hjx.setNumbers = function () {
    $._hjx.number = true;
  };
  $._hjx.clearNumbers = function () {
    $._hjx.number = false;
  };
  $._hjx.getNumbers = function () {
    return $._hjx.number;
  };

  var _slice = Array.prototype.slice;

  var setPosition = function (target, dropdown, zIndex) {
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
    if (zIndex) {
      csser.zIndex = zIndex;
    }
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

  function Numbers(element, options) {
    this.element = element;
    this.options = options;
    this.init();
  }

  Numbers.ui = {
    refresh: function () {
      var value = this.target.element.val();
      if (/\./.test(value) || this.target.options.type === 1) {
        this.btns['dot'].removeClass('useful');
      } else if (this.target.options.type === 2) {
        this.btns['dot'].addClass('useful');
      }
    },
    open: function () {
      this.refresh();
      setPosition(this.target.element, this.wrap, this.target.options.zIndex);
      this.wrap.addClass('active');
      this.target.element.addClass('number-active');
    },
    close: function () {
      if (!Numbers.ui.wrap) {
        return this;
      }
      this.wrap.removeClass('active');
      this.target.element.removeClass('number-active');

      // 去除结尾的小数点
      var value = this.target.element.val();
      if (/\.$/.test(value)) {
        value = value.replace(/\.$/, '');
      }

      if ($.isFunction(this.target.options.format)) {
        value = this.target.options.format(value || this.target.options.defaultValue);
      }

      this.target.element.val(value);
    },
    change: function (target) {
      this.target = target;
    },

    valid: function (sufix) {
      var maxLength = this.target.options.length;
      var max = this.target.options.max;
      var value = this.target.element.val();

      // 超过最大长度限制
      if (this.target.options.type === 1 && maxLength !== null && value.length >= maxLength) {
        return false;
      }
      // 超过最大数值限制
      if (max !== null && (value + sufix ) - max > 0) {
        return false;
      }

      return true;
    },

    addNumber: function (value, $btn) {
      if (!this.valid(value)) {
        return this;
      }
      var old_value = this.target.element.val();
      if (value === 'dot') {
        value = '.';
        if (!old_value) {
          old_value = '0';
        }
      }
      this.target.element.val(old_value + value);
      this.refresh();
    },

    delNumber: function () {
      var value = this.target.element.val();
      this.target.element.val(value.replace(/.$/, ''));
      this.refresh();
    }
  };

  /**
   * 生成数字界面
   */
  Numbers.init = function (target) {
    if (Numbers.ui.wrap) {
      return this;
    }

    var htmls = [
      '<div class="number-ui" id="number_hujx_ui">',
      '  <ul>',
      '    <li class="useful" data-number="1">1</li>',
      '    <li class="useful" data-number="2">2</li>',
      '    <li class="useful" data-number="3">3</li>',
      '    <li class="useful" data-number="4">4</li>',
      '    <li class="useful" data-number="5">5</li>',
      '    <li class="useful" data-number="6">6</li>',
      '    <li class="useful" data-number="7">7</li>',
      '    <li class="useful" data-number="8">8</li>',
      '    <li class="useful" data-number="9">9</li>',
      '    <li class="useful" data-number="dot">.</li>',
      '    <li class="useful" data-number="0">0</li>',
      '    <li class="useful" data-number="del">del</li>',
      '  </ul>',
      '</div>'
    ];

    $('body').append(htmls.join(''));

    Numbers.ui.wrap = $('#number_hujx_ui');
    Numbers.ui.target = target;
    Numbers.ui.dot = $('#number_ele_dot');

    var maps = {};
    Numbers.ui.wrap.find('li').each(function () {
      var $this = $(this);
      maps[$this.data('number')] = $this;
    });
    Numbers.ui.btns = maps;

    Numbers.ui.wrap.on('click.change-number-value', 'li.useful', function (e) {
      var $this = $(this);
      var value = $this.data('number');
      if (value === 'del') {
        Numbers.ui.delNumber();
      } else {
        Numbers.ui.addNumber(value, $this);
      }
      e.stopPropagation();
    });

    return Numbers;
  };

  Numbers.prototype = {
    constructor: Numbers,
    author: 'hujx',

    init: function () {
      var that = this;
      this.constructor.init(this);

      this.element.on('click.toggle-number-ui', function () {
        if (that.element.hasClass('number-active')) {
          Numbers.ui.close();
        } else {
          Numbers.ui.close();
          Numbers.ui.change(that);
          Numbers.ui.open();
        }
        $._hjx.setNumbers();
      });
    },
    noop: function () {
      return this;
    }
  };

  var setting = {
    max           : null,   // 最大可以输入
    length        : null,   // 最大长度，type为1时有效
    type          : 1,      // 数据类型 1: 整数 2: 小数
    zIndex        : null,
    dotLength     : null,   // 小数点后位数，type为2时有效
    defaultValue  : '0',    // 默认值
    format: null            // 格式化方法
  };

  $.fn.number = function () {
    var params = _slice.call(arguments, 0);
    var options = params[0];
    var data = this.data('number-api');
    var command = typeof options === 'string' ? options : 'noop';

    if (!data) {
      if (typeof options === 'string') {
        options = setting;
      } else {
        options = $.extend(true, {}, setting, options || {});
      }
      this.data('number-api', (data = new Numbers(this, options)));
    }

    return data[command].apply(data, params.slice(1));
  };

  $(document).on('click.number-api', function () {
    if (!$._hjx.getNumbers()) {
      Numbers.ui.close();
    }
    $._hjx.clearNumbers();
  });

});