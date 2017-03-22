(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.dragSlider = factory();
  }
})(this, function () {

  var toString = Object.prototype.toString;
  var slice = Array.prototype.slice;

  var $ = function (selector, context) {
    return (context || document).querySelector(selector);
  };

  var $$ = function (selector, context) {
    return slice.call((context || document).querySelectorAll(selector));
  };

  var isArray = function (target) {
    return toString.call(target) === '[object Array]';
  };

  var each = function (array, callback) {
    if (!isArray(array)) {
      return array;
    }
    var i = 0;
    var len = array.length;

    var ite;

    for (; i < len; i++) {
      ite = callback.call(array[i], array[i], i);
      if (ite === false) {
        break;
      }
    }
    return array;
  };

  var map = function (array, callback) {
    var result = [];

    each(array, function (item, index) {
      result.push(callback.call(this, item, index));
    });

    return result;
  };

  var mixin = function (target, source) {
    var result = {};
    target = target || {};
    source = source || {};

    for (var key in source) {
      if (target[key] === undefined) {
        result[key] = source[key];
      } else {
        result[key] = target[key];
      }
    }
    return result;
  };

  var removeClass = function (ele, classList) {
    if (isArray(ele)) {
      each(ele, function () {
        removeClass(this, classList);
      });
    } else {
      ele.classList.remove(classList);
    }
  };

  var addClass = function (ele, classList) {
    if (isArray(ele)) {
      each(ele, function () {
        addClass(this, classList);
      });
    } else {
      ele.classList.add(classList);
    }
  };

  var on = function (ele, eventName, callback) {
    if (isArray(ele)) {
      each(ele, function () {
        on(this, eventName, callback);
      });
    } else {
      ele.addEventListener(eventName, callback);
    }
  };

  var defaults = {
    el: '.drag-slider',
    box: '.drag-content',
    item: '.drag-item',
    min: 60,
    max: 70,
    padding: 10,
    change: function () {}
  };

  var dragSlider = function (options) {
    this.opts = mixin(options, defaults);
    this.init();
  };

  dragSlider.prototype.init = function () {
    this.el = $(this.opts.el);
    this.box = $(this.opts.box, this.el);
    this.list = $$(this.opts.item, this.box);
    this.minWidth = this.opts.min + this.opts.padding;

    this.x = 0;
    this.eventStartX = 0;

    this.current = 0;
    this.moving = false;
    this.movingStartIndex = this.current;

    this.boxWidth = this.box.scrollWidth;
    this.elWidth = this.el.offsetWidth;
    this.listen();

    this.change(0, true);
    this.fix();
  };

  dragSlider.prototype.listen = function () {
    var self = this;
    on(this.el, 'touchstart', this.start.bind(this));
    on(document, 'touchmove', this.sliding.bind(this));
    on(document, 'touchend', this.stop.bind(this));

    each(this.list, function (item, index) {
      on(this, 'click', function () {
        self.change(index, true);
        self.fix();
      });
    });
  };

  dragSlider.prototype.start = function (event) {
    this.moving = true;
    // 开始移动时当前激活的项目索引
    this.movingStartIndex = this.current;
    // 开始移动时盒子的初始translateX
    this.movingStartX = this.x;
    // 开始移动时点按的坐标
    this.eventStartX = event.changedTouches[0].clientX;
  };

  dragSlider.prototype.sliding = function (event) {
    if (!this.moving) {
      return false;
    }

    var delta = event.changedTouches[0].clientX - this.eventStartX;
    this.x = Math.min(Math.max(this.movingStartX + delta * 1.5, this.elWidth - this.boxWidth - 20), 0);
    this.translate();

    var index = Math.min(Math.max(this.movingStartIndex - Math.round(delta / (this.opts.min / 2)), 0), this.list.length - 1);
    this.change(index);
  };

  dragSlider.prototype.stop = function () {
    if (this.moving) {
      this.moving = false;
      if (this.movingStartIndex !== this.current) {
        this.change(this.current, true);
      }
      this.fix();
    }
  };

  dragSlider.prototype.translate = function () {
    this.box.style.transform = 'translate3d(' + this.x + 'px, 0, 0)';
  };

  dragSlider.prototype.change = function (index, changed) {
    removeClass(this.list[this.current], 'active');
    addClass(this.list[index], 'active');
    this.current = index;

    if (changed) {
      this.opts.change(this.current);
    }
  };

  dragSlider.prototype.fix = function () {
    var delta1 = this.elWidth - this.current * this.minWidth - this.x;

    // 右侧不足
    if (delta1 <= this.opts.max) {
      this.x = this.elWidth - this.current * this.minWidth - this.opts.max;
      this.translate();
    }

    var delta2 = this.current * this.minWidth + this.x;
    // 左侧不足
    if (delta2 < 0 && delta2 >= -1 * this.opts.max) {
      this.x = this.current * -1 * this.minWidth;
      this.translate();
    }
  };

  return dragSlider;
});
