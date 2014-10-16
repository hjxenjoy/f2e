/**
 * 基于jQuery的日期插件
 * jquery.calendar.js
 * @base jquery-1.8.3.js
 * @author hjxenjoy@foxmail.com
 * @date 2014-09-09
 */
;(function (global, undefined) {
  'use strict';

  var $ = global.jQuery,
    namespace = 'calendar-api',
    _slice = Array.prototype.slice,
    _match = String.prototype.match,
    _toString = Object.prototype.toString,
    _setYear = Date.prototype.setFullYear,
    _setHours = Date.prototype.setHours;

  var config = {
      style: '',          // 主题类型
      separator: '-',     // 分隔符
      size: 3,            // 赋值格式(年，月，日，时，分，秒，毫秒)的前几位
      active: false,      // 是否自动打开
      closable: true,     // 是否能关闭日期视窗
      // 可触发事件日期，可设置为区间，闭合区间 [undefined, new Date]
      enable: [undefined, undefined],
      zIndex: 798,
      date: null,         // 默认初始化视窗日期，文本框调用时无效
      weekStart: 0,       // 星期起始
      weekText: '日 一 二 三 四 五 六',
      monthText: '一月 二月 三月 四月 五月 六月 七月 八月 九月 十月 十一月 十二月',
      time: false,        // 时间编辑视窗
      todayBtn: false,        // 今天按钮
      todayText: '今天',
      clearBtn: false,        // 清除按钮,
      clearText: '清除',
      sureText: '确定',

      // 清除按钮方法
      clear: null,  // function () {}
      // 生成月视图之后，对每日做特殊处理
      after: null,  // function (year, month, dateList) {}
      // 日期点击
      dateClick: null, // function (date, $date) {},
      // 日期鼠标悬停
      dateMouseover: null, // function (date) {},
      // 日期鼠标离开
      dateMouseleave: null //function (date) {}
    };
  var viewMode = {
    'month': 'VIEW_MODE_MONTH',
    'year': 'VIEW_MODE_YEAR',
    'ten': 'VIEW_MODE_TEN',
    'century': 'VIEW_MODE_CENTURY'
  };

  /**
   * 生成随机字符串
   * @param prefix 在随机字符串前面添加指定前缀
   */
  function random(prefix) {
    var r =  Math.random().toString(36).substr(2);
    return (typeof prefix === 'string' ? prefix : '') + r;
  }

  /**
   * 判断所传参数是否为Date类型
   */
  function isDate(date) {
    return _toString.call(date) === '[object Date]';
  }

  /**
   * 比较两天
   */
  function compareDate(date1, date2) {
    var d1 = date1, d2 = date2;
    if (isDate(date1)) {
      d1 = date2Str(date1, '', 3);
    }
    if (isDate(date2)) {
      d2 = date2Str(date2, '', 3);
    }
    return d1 - d2;
  }
  /**
   * 判断是否为今天
   */
  function isToday(date) {
    if (!isDate(date)) {
      return false;
    }
    return compareDate(date, new Date) === 0;
  }

  /**
   * 字符串转日期格式
   */
  function str2Date(str) {
    var date = new Date();
    if (!str) {
      return date;
    }
    var arr = _match.call(str, /\d+/g).concat([0,0,0,0,0,0,0]);

    if (arr[0].length > 4) {  // 无分隔符日期格式
      arr = [
        arr[0].substr(0, 4),
        arr[0].substr(4, 2),
        arr[0].substr(6, 2)
      ].concat(arr.slice(1));
    }
    if (arr[1] > 0) {
      arr[1] = arr[1] - 1;
    }
    _setYear.apply(date, arr.slice(0, 3));  // 年 月 日
    _setHours.apply(date, arr.slice(3, 7)); // 时 分 秒 毫秒
    return date;
  }

  /**
   * 把一位数字格式化成前缀为0的字符串
   */
  function lenNum(num) {
    num = num + '';
    return num.length === 2 ? num : '0' + num;
  }

  /**
   * 日期转字符串
   * @param date
   * @param separator 年月日之间的分隔符
   * @param size 截取多少计算单位，默认为3
   */
  function date2Str(date, separator, size) {
    date = isDate(date) ? date : new Date();
    separator = separator == undefined ? '-' : separator;
    size = size == undefined ? 3 : size;
    if (size < 0 || size > 7) {
      size = 3;
    }
    var arr = [
      date.getFullYear(),
      separator + lenNum(date.getMonth() + 1),
      separator + lenNum(date.getDate()),
      ' ' + lenNum(date.getHours()),
      ':' + lenNum(date.getMinutes()),
      ':' + lenNum(date.getSeconds()),
      '.' + date.getMilliseconds()
    ];
    return arr.slice(0, size).join('');
  }

//  /**
//   * 判断闰年
//   */
//  function isLeapYear(year) {
//    var d = new Date();
//    d.setFullYear(year, 1, 29);
//    return d.getDate() === 29;
//  }

  /**
   * 判断dom元素是否为input:text
   */
  function isText(element) {
    return (element && element.nodeName &&
      element.nodeName.toUpperCase() === 'INPUT' &&
      element.type.toUpperCase() === 'TEXT');
  }

  /**
   * 计算当前年所在的10年范围
   */
  function tenScope(year) {
    var s = Math.floor(year/10);
    return s + '0' + '-' + s + '9';
  }

  /**
   * 计算当前年所在的100年范围
   */
  function centuryScope(year) {
    var s = Math.floor(year/100);
    return s + '00' + '-' + s + '99';
  }

  /**
   * 日期封装类
   */
  function Calendar(date) {
    this.init(date);
  }
  Calendar.prototype = {
    constructor: Calendar,
    init: function (date) {
      this.d = isDate(date) ? new Date(date) : str2Date(date);
      this.year = this.d.getFullYear() + '';
      this.month = lenNum(this.d.getMonth() + 1);
      this.date = lenNum(this.d.getDate());
    },
    toStr: function (separator, size) {
      return date2Str(this.d, separator, size);
    },
    // 该月有多少天
    count: function () {
      var d = new Date(this.year, this.month, 0);
      return d.getDate();
    },
    // 第一天是星期几
    firstDay: function () {
      var d = new Date(this.year, this.month - 1, 1);
      d.setDate(1);
      return d.getDay();
    },
//    // 最后一天是星期几
//    lastDay: function () {
//      var d = new Date(this.year, this.month - 1);
//      d.setDate(this.count());
//      return d.getDay();
//    },
    // 上个同级 new Date(0,1,1)代表1900年，第一个参数小于100时，实际为(+=1900)
    prev: function (mode) {
      if (!mode) {
        mode = viewMode.month;
      }
      var d = null;
      switch(mode) {
      case viewMode.month:
        d = new Date(this.year, this.month - 1, 0);
        break;
      case viewMode.year:
        d = new Date(this.year - 1, 0, 1);
        d.setFullYear(this.year - 1);
        break;
      case viewMode.ten:
        d = new Date(this.year - 10, 0, 1);
        d.setFullYear(this.year - 10);
        break;
      case viewMode.century:
        d = new Date(this.year - 100, 0, 1);
        d.setFullYear(this.year - 100);
        break;
      }
      return new Calendar(d);
    },
    // 下个同级
    next: function (mode) {
      if (!mode) {
        mode = viewMode.month;
      }
      var d = null;
      switch(mode) {
      case viewMode.month:
        d = new Date(this.year, this.month, 1);
        break;
      case viewMode.year:
        d = new Date(this.year - -1, 0, 1);
        break;
      case viewMode.ten:
        d = new Date(this.year - -10, 0, 1);
        break;
      case viewMode.century:
        d = new Date(this.year - -100, 0, 1);
        break;
      }
      return new Calendar(d);
    }
  };

  /**
   * 日期视图
   */
  function CalendarView(element, options) {
    this.element = element;
    this.$element = $(element);
    this.options = options;
    this.init();
  }
  CalendarView.prototype = {
    constructor: CalendarView,
    isText: true,
    init: function () {
      // 判断触发元素是否为input:text
      // 是：日历插入body根元素
      // 否：日历插入触发元素内

      this.isText = isText(this.element);
      // 初始化视图月份
      if (this.isText && this.element.value) {
        this.calendar = new Calendar(this.element.value);
      } else {
        this.calendar = new Calendar(this.options.date || new Date());
      }

      // 最小,最大日期
      this.minDate = this.options.enable[0];
      this.maxDate = this.options.enable[1];

      this.wrap();
    },

    // 生成html
    wrap: function () {
      var id = random('calendar'),
      h = [
        '<div class="calendar" id="' + id + '">',
        ' <div class="calendar-top"></div>',
        ' <div class="calendar-body"></div>',
        ' <div class="calendar-foot"></div>',
        '</div>'
      ];

      if (this.isText) {
        $('body').append(h.join(''));
      } else {
        this.$element.append(h.join(''));
      }

      this.$wrap = $('#' + id);
      this.$top = this.$wrap.find('.calendar-top');
      this.$body = this.$wrap.find('.calendar-body');
      this.$foot = this.$wrap.find('.calendar-foot');

      if (this.options.closable) {
        this.$wrap.addClass('calendar-closable');
      }

      if (this.options.style) {
        this.$wrap.addClass('calendar-theme-' + this.options.style);
      }

      if (this.options.todayBtn) {
        this.addToday();
      }

      if (this.options.clearBtn) {
        this.addClear();
      }

      if (this.options.time) {
        this.addTime();
      }

      // 自动打开，添加打开状态样式
      if (this.options.active) {
        this.open();
      }
      this.listen();
    },

    addTime: function () {
      var html = [
        '<div class="calendar-time">',
        ' <input type="text" class="calendar-hour" maxlength="2" value="00"/>',
        ' <span>:</span>',
        ' <input type="text" class="calendar-minute" maxlength="2" value="00" />',
        ' <span>:</span>',
        ' <input type="text" class="calendar-second" maxlength="2" value="00" />',
        '</div>'
      ];
      this.$foot.append(html.join(''));

      var code = {'8': true, '37': true, '39': true};
      for (var i = 38; i < 58; i++) {
        code[i] = true;
      }
      this.$foot.find('input:text')
        .on('keydown.h', function (e) {
          if (!code[e.keyCode]) {
            e.preventDefault();
          }
        })
        .on('input.h propertychange.h', function () {
          if (this.value && (!/^\d+$/.test(this.value) || this.value > 59)) {
            this.value = '';
          }
        })
        .on('blur.h', function () {
          this.value = lenNum(this.value || '0');
        });

      this.$foot.find('.calendar-hour')
        .on('input.hj propertychange.hj', function () {
          if (this.value > 23) {
            this.value = '';
          }
        });

    },

    addToday: function () {
      var html = '<span class="calendar-btn calendar-today">' + this.options.todayText + '</span>';
      this.$foot.append(html);
    },

    addClear: function () {
      var html = '<span class="calendar-btn calendar-clear">' + this.options.clearText + '</span>';
      this.$foot.append(html);
    },

    listen: function () {
      var that = this;

      if (this.isText) {
        this.$element.on('click.toggle-calendar', function (e) {
          closeCalendar();
          that.$wrap.hasClass('open') ? that.close() : that.open();
          e.stopPropagation();
        });
      }

      this.$wrap.on('click.stop-close-calendar', function (e) {
        e.stopPropagation();
      });

      this.$top
        .on('click.show-prev', '.calendar-left', function () {
          that.viewCalendar = that.viewCalendar.prev(that.viewMode);
          that.change();
        })
        .on('click.show-next', '.calendar-right', function () {
          that.viewCalendar = that.viewCalendar.next(that.viewMode);
          that.change();
        })
        .on('click.show-parent', '.calendar-text', function () {
          that.parent();
        });

      this.$body
        .on('click.show-month', '.calendar-cell-month', function () {
          that.viewMode = viewMode.month;
          var date = new Date(that.viewCalendar.year, $(this).data('month'), 1);
          that.viewCalendar = new Calendar(date);
          that.change();
        })
        .on('click.show-year', '.calendar-cell-year', function () {
          that.viewMode = viewMode.year;
          var date = new Date($(this).data('year'), 0, 1);
          that.viewCalendar = new Calendar(date);
          that.change();
        })
        .on('click.show-ten', '.calendar-cell-ten', function () {
          that.viewMode = viewMode.ten;
          var date = new Date($(this).data('ten'), 0, 1);
          that.viewCalendar = new Calendar(date);
          that.change();
        })
        .on('click.date-click', '.calendar-cell-day', function () {
          var $this = $(this),
            date = str2Date($this.data('date'));
          that.dateClick(date, $this);
        });

      if ($.isFunction(this.options.dateMouseover)) {
        this.$body.on('mouseover.date-mouseover', '.calendar-cell-day', function () {
          var $this = $(this),
            date = str2Date($this.data('date'));
          that.options.dateMouseover(date, $this);
        });
      }

      if ($.isFunction(this.options.dateMouseleave)) {
        this.$body.on('mouseleave.date-mouseleave', '.calendar-cell-day', function () {
          var $this = $(this),
            date = str2Date($this.data('date'));
          that.options.dateMouseleave(date, $this);
        });
      }

      this.$foot
        .on('click.select-today', '.calendar-today', function () {
          that.set(new Date).close();
        })
        .on('click.clear-calendar', '.calendar-clear', function () {
          that.clear().close();
        });
    },

    // 切换视图
    change: function () {
      switch(this.viewMode) {
      case viewMode.month:
        this.month();
        break;
      case viewMode.year:
        this.year();
        break;
      case viewMode.ten:
        this.tenYears();
        break;
      case viewMode.century:
        this.century();
        break;
      }
    },

    // 切换到父视图
    parent: function () {
      switch(this.viewMode) {
      case viewMode.month:
        this.viewMode = viewMode.year;
        this.change();
        break;
      case viewMode.year:
        this.viewMode = viewMode.ten;
        this.change();
        break;
      case viewMode.ten:
        this.viewMode = viewMode.century;
        this.change();
        break;
      case viewMode.century:
        break;
      }
    },

    /**
     * 生成顶部 | <   2013-09   > |
     */
    top: function () {
      var viewText = this.viewCalendar.toStr('-', 2);
      switch(this.viewMode) {
      case viewMode.month:
        break;
      case viewMode.year:
        viewText = this.viewCalendar.year;
        break;
      case viewMode.ten:
        viewText = tenScope(this.viewCalendar.year);
        break;
      case viewMode.century:
        viewText = centuryScope(this.viewCalendar.year);
        break;
      }

      var h = [
        '<span class="calendar-left">',
        '<span></span><em></em>',
        '</span>',
        '<div class="calendar-text">' + viewText + '</div>',
        '<span class="calendar-right">',
        '<span></span><em></em>',
        '</span>'
      ];
      this.$top.html(h.join(''));
    },

    // 生成指定月的日期视图
    month: function () {
      this.viewMode = viewMode.month;
      this.top();

      var that = this,html = [];
      html[0] = '<ul class="calendar-week">' + this.week().join('') + '</ul>';
      html[1] = '<ul class="calendar-month">';

      var count = this.viewCalendar.count(),
        firstDay = this.viewCalendar.firstDay(),
        year_month = this.viewCalendar.toStr('', 2),
        // 根据星期起始日和当月第一天的星期，得出计算上一月显示天数的数组
        array = (function () {
          var w = [1,2,3,4,5,6,7,1,2,3,4,5,6,7];
          return (w.slice(6 - that.options.weekStart).slice(0, 7));
        })();
      // 计算上一月显示天数
      var prevMonth = this.viewCalendar.prev(),
        prevLeft = array[firstDay],
        prevCount = prevMonth.count();
      for (var i = prevCount - prevLeft + 1; i <= prevCount; i++) {
        html.push('<li class="calendar-cell-ignore">' + i + '</li>');
      }

      // 当月日期
      for (i = 1; i <= count; i++) {
        html.push(this.day(year_month, i));
      }

      // 计算下一月显示天数
      var len = 42 - count - prevLeft;
      for (i = 1; i <= len; i++) {
        html.push('<li class="calendar-cell-ignore">' + i + '</li>');
      }

      html.push('</ul>');

      this.$body.html(html.join(''));

      this.after();
    },

    day: function (year_month, date) {
      var d1 = year_month + lenNum(date),
        day_cls = 'calendar-cell-day';
      if (this.minDate && compareDate(d1, this.minDate) < 0) {
        day_cls = 'calendar-cell-ignore';
      }
      if (this.maxDate && compareDate(d1, this.maxDate) > 0) {
        day_cls = 'calendar-cell-ignore';
      }
      return '<li class="' + day_cls + '" data-date="' + d1 + '">' + date + '</li>';
    },

    /**
     * 生成月份视图之后的修饰操作
     */
    after: function () {
      var _after = this.options.after || function() {},
        date = this.viewCalendar.d,
        dateList = null,
        year = this.viewCalendar.year,
        month = this.viewCalendar.month,
        that = this;

      if ($.isFunction(this.options.after)) {
        dateList = [];
      }
      this.$body.find('[data-date]').each(function (i) {
        var $this = $(this);
        date.setDate(i + 1);
        if (dateList) {
          dateList.push({
            date: new Date(date),
            target: $this
          });
        }

        if (isToday(date)) {
          $this.addClass('calendar-cell-today');
        }

        if (that.calendar && that.isText &&
           compareDate(date, that.calendar.d) === 0) {
          $this.addClass('calendar-cell-selected');
        }

      });
      _after(year, month, dateList);
    },

    /**
     * 生成星期列表
     */
    week: function () {
      return $.map(this.options.weekText.split(/\s+/), function (day) {
        return '<li>' + day + '</li>';
      });
    },

    // 生成年的月份视图
    year: function () {
      this.top();
      var c = 'calendar-cell-month',
        h = $.map(this.options.monthText.split(/\s+/), function (m, i) {
        return '<div class="' + c + '" data-month="' + i + '">' + m + '</div>';
      });
      this.$body.html(h.join(''));
    },

    /**
     * 生成10年的视图
     */
    tenYears: function () {
      var decade = Math.floor(this.viewCalendar.year/10);
      this.top();
      var startYear = ('' + decade + 0) - 1,
        h = [], i = 0, len = 12, c, d;
      for (; i < len; i++) {
        c = 'calendar-cell-year';
        d = startYear + i;
        if (i === 0 || i === 11) {
          c += ' calendar-cell-ignore';
        }
        h.push('<div class="' + c + '" data-year="' + d + '">' + d + '</div>');
      }

      this.$body.html(h.join(''));
    },

    /**
     * 生成100年的世纪视图
     */
    century: function () {
      var cen = Math.floor(this.viewCalendar.year/100);
      this.top();
      var startYear = ('' + cen + '00') - 10,
        h = [], i = 0, len = 12, c, s, ten;
      for (; i < len; i++) {
        c = 'calendar-cell-ten';
        if (i === 0 || i === 11) {
          c += ' calendar-cell-ignore';
        }
        s = (startYear + i * 10);
        ten = '<p>' + s + '-</p><p>' +
          (s + 9) + '</p>';
        h.push('<div class="' + c + '" data-ten="' + s + '">' + ten + '</div>');
      }
      this.$body.html(h.join(''));
    },

    // 每日点击事件
    dateClick: function (date, $date) {
      var fn = this.options.dateClick;

      if (this.isText) {
        this.set(date);
        this.close();
      }

      if (typeof fn === 'function') {
        fn(date, $date);
      }
    },

    // 计算指定日期和enable之间的差距
    getErrors: function (date) {
      var min = 0, max = 0;
      if (isDate(this.minDate)) {
        min = compareDate(date, this.minDate);
      }
      if (isDate(this.maxDate)) {
        max = compareDate(this.maxDate, date);
      }
      return [min, max];
    },

    enable: function (deep, start, end) {
      // 日期为undefined时，是否覆盖配置参数中的值
      if ($.type(deep) !== 'boolean' ) {
        end = start;
        start = deep;
        deep = false;
      }
      if (deep) {
        this.minDate = start;
        this.maxDate = end;
      } else {
        if (isDate(start)) {
          this.minDate = start;
        }
        if (isDate(end)) {
          this.maxDate = end;
        }
      }

      if (this.calendar &&
          this.getErrors(this.calendar.d).join('').indexOf('-') > -1) {
        this.clear();
      }

      if (!this.$wrap.hasClass('open')) {
        return this;
      }

      var viewDate = this.viewCalendar.d,
        viewErrors = this.getErrors(viewDate);

      // 视图日期比最小日期早
      if (viewErrors[0] < 0) {
        this.viewCalendar = new Calendar(this.minDate);
      }
      // 视图日期比最大日期晚
      if (viewErrors[1] < 0) {
        this.viewCalendar = new Calendar(this.maxDate);
      }

      if (this.viewMode === viewMode.month) {
        this.month();
      }
      return this;
    },

    clear: function () {
      this.calendar = null;

      if (this.isText) {
        this.element.value = '';
      }

      if (this.$wrap.hasClass('open')) {
        this.$body.find('.calendar-cell-selected')
                  .removeClass('calendar-cell-selected');
      }

      (this.options.clear || function () {})();

      return this;
    },

    set: function (date) {
      if (!date) {
        return this;
      }
      if (!isDate(date)) {
        date = str2Date(date);
      }
      if (this.options.time) {
        date.setHours(this.$foot.find('.calendar-hour').val());
        date.setMinutes(this.$foot.find('.calendar-minute').val());
        date.setSeconds(this.$foot.find('.calendar-second').val());
      }

      this.calendar = new Calendar(date);
      var scls = 'calendar-cell-selected';
      // 文本框触发
      if (this.isText) {
        this.element.value = date2Str(date, this.options.separator, this.options.size);
      }

      // 当前日期如果是显示状态，添加选择样式
      if (this.$wrap.hasClass('open')) {
        var d = this.viewCalendar.d,
          that = this;
        this.$body.find('.' + scls).removeClass(scls);
        this.$body.find('[data-date]').each(function (i) {
          d.setDate(i + 1);
          if (compareDate(d, that.calendar.d) === 0) {
            $(this).addClass(scls);
          }
        });
      }
      return this;
    },

    open: function () {
      var currentDate = null;
      if (!this.calendar) {
        currentDate = new Date();
      } else {
        currentDate = this.calendar.d;
      }
      // 当前视图月份默认为插件指定或文本值
      this.viewCalendar = new Calendar(currentDate);
      this.viewMode = viewMode.month;

      var errors = this.getErrors(currentDate),
        moreThanMin = errors[0] > -1,
        lessThanMax = errors[1] > -1;

      this.$wrap.addClass('open');
      if (this.isText) {
        this.setPosition();
      }
      if (this.options.time) {
        this.$foot.find('.calendar-hour').val(lenNum(currentDate.getHours()));
        this.$foot.find('.calendar-minute').val(lenNum(currentDate.getMinutes()));
        this.$foot.find('.calendar-second').val(lenNum(currentDate.getSeconds()));
      }

      // 当前视图早于最小日期
      if (!moreThanMin) {
        this.viewCalendar = new Calendar(this.minDate);
      }
      // 当前视图晚于最大日期
      if (!lessThanMax) {
        this.viewCalendar = new Calendar(this.maxDate);
      }
      this.month();
      return this;
    },

    setPosition: function () {
      var pos = this.$element.offset(),
        height = this.$element.outerHeight();
      this.$wrap.css({
        'position': 'absolute',
        'top': (pos.top + height + 1) + 'px',
        'left': pos.left + 'px',
        'zIndex': this.options.zIndex
      });
    },

    close: function () {
      this.$wrap.removeClass('open');
      return this;
    },

    noop: function () {
      return this;
    }
  };

  $.fn.calendar = function () {
    var params = _slice.call(arguments, 0),
        options = params[0],
        data = this.data(namespace),
        isCommand = typeof options === 'string',
        command = 'noop';

    if (isCommand) {
      command = options;
      options = {};
    }
    if (!data) {
      options = $.extend({}, config, options || {});
      data = new CalendarView(this[0], options);
      this.data(namespace, data);
    }
    if (isCommand) {
      return data[command].apply(data, params.slice(1));
    }
    return data;
  };

  function CalendarPair(start, end, option) {
    this.element = {
      start: start,
      end: end
    };
    this.options = $.extend({}, config ,option);
    // 起始和结束日期是否可以为同一天
    this.touchable = option.touchable;
    if (option.touchable == undefined) {
      this.touchable = true;
    }
    this.init();
  }
  CalendarPair.prototype = {
    constructor: CalendarPair,
    init: function () {
      var that = this;
      // 生成双日历插件外部
      var id = random('calendarPair'),
        h = [
          '<div class="calendar-pair" id="' + id + '">',
          ' <div class="calendar-start"></div>',
          ' <div class="calendar-end"></div>',
          ' <div class="calendar-btn calendar-sure">',
            this.options.sureText +
          '</div>',
          '</div>'
        ];

      $('body').append(h.join(''));

      var parent = $('#' + id),
        sd = this.element.start.val(),
        ed = this.element.end.val(),
        enable = this.options.enable,
        // 日历触发对象
        start = parent.find('.calendar-start'),
        end = parent.find('.calendar-end'),

        scope = this.options.scope,

        // 初始化日期
        startDate = sd ? str2Date(sd) : undefined,
        endDate = ed ? str2Date(ed) : undefined,

        // 起始日期插件参数
        startOption = $.extend({}, this.options, {
          date: startDate,
          active: true,
          closable: false,
          clear: function () {
            that.element.start.val('');
            // 重置结束日期的最小值
            end.calendar('enable', true, enable[0], enable[1]).set(that.element.end.val());
          },
          dateClick: function (date) {
            that.element.start.val(date2Str(date, that.options.separator, that.options.size));
            start.calendar('set', date);

            var maxDate = enable[1];
            if ($.isFunction(scope)) {
              maxDate = scope(new Date(date))[1];
            }
            if (!that.touchable) {
              date.setDate(date.getDate() + 1)
            }
            end.calendar('enable', date, maxDate).set(that.element.end.val());
          }
        }),
        // 结束日期插件参数
        endOption = $.extend({}, this.options, {
          date: endDate,
          active: true,
          closable: false,
          clear: function () {
            that.element.end.val('');
            // 重置开始日期的最大值
            start.calendar('enable', true, enable[0], enable[1]).set(that.element.start.val());
          },
          dateClick: function (date) {
            that.element.end.val(date2Str(date, that.options.separator, that.options.size));
            end.calendar('set', date);

            var minDate = enable[0];
            if ($.isFunction(scope)) {
              minDate = scope(new Date(date))[0];
            }
            if (!that.touchable) {
              date.setDate(date.getDate() - 1);
            }
            start.calendar('enable', minDate, date).set(that.element.start.val());
          }
        });

      if (sd) {
        endOption.enable[0] = str2Date(sd);
      }
      if (ed) {
        startOption.enable[1] = str2Date(ed);
      }

      // 插件调用
      start.calendar(startOption);
      end.calendar(endOption);

      // 添加清除按钮
      var cb = '<div class="calendar-btn calendar-clear">'
        + this.options.clearText + '</div>';
      start.append(cb);
      end.append(cb);

      // 事件监听
      parent.on('click.stop-close-calendar', function (e) {
        e.stopPropagation();
      });

      parent.find('.calendar-sure')
        .on('click.close-calendar-pair', function () {
          parent.removeClass('open');
        });

      this.element.start.on('click.toggle-calendar-pair', function (e) {
        closeCalendar();
        if (parent.hasClass('open')) {
          parent.removeClass('open');
        } else {
          parent.addClass('open');
          that.setPosition(parent, $(this));
        }
        e.stopPropagation();
      });

      this.element.end.on('click.toggle-calendar-pair', function (e) {
        closeCalendar();
        if (parent.hasClass('open')) {
          parent.removeClass('open');
        } else {
          parent.addClass('open');
          that.setPosition(parent, $(this));
        }
        e.stopPropagation();
      });

      start.find('.calendar-clear')
        .on('click.calendar-clear', function () {
          start.calendar('clear');
        });
      end.find('.calendar-clear')
        .on('click.calendar-clear', function () {
          end.calendar('clear');
        });
    },
    setPosition: function ($obj, $element) {
      var pos = $element.offset(),
        height = $element.outerHeight();
      $obj.css({
        'top': (pos.top + height + 1) + 'px',
        'left': pos.left + 'px',
        'zIndex': this.options.zIndex
      });
    }
  };

  $.calendarPair = function (option) {
    return new CalendarPair(option.start, option.end, option);
  };

  function closeCalendar() {
    // 关闭closable=true的日历
    $('.calendar-closable.open').removeClass('open');
    // 关闭双日历
    $('.calendar-pair').removeClass('open');
  }

  $(document)
    .on('click.calendar-api', function () {
      closeCalendar();
    });
})(this);
