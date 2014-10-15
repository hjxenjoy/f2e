/**
 * 基于jQuery的表单验证插件
 * jquery.validate.js
 * @base jquery-1.8.3
 * @author hjxenjoy@foxmail.com
 */
;(function(global){
  'use strict';

  var $ = global.jQuery,
      namespace = 'validate-api',
      eventns = '.validate-event-listen',
      _slice = [].slice,
      _replace = String.prototype.replace,
      jsoner = function (str) {
        return (new Function('return ' + str))() || {};
      },
      config = {
        refresh: false,
        showError: null,
        closeError: null,
        debug: true,
        zIndex: 700,
        mark: null
      },
      methods = {};

  var Message = {
    must: '必填',
    require: ['请选择一项', '请勾选'],
    multiple: ['请选择$1项', '请至少选择$1项', '请最多选择$2项', '请选择$1到$2项'],
    count: ['字数须为$1', '字数至少为$1', '字数最多为$1', '字数须为$1-$2'],
    ip: '请输入格式正确的IP地址',
    id: '请输入格式正确的身份证号',
    tel: '请输入格式正确的座机号码',
    mobile: '请输入格式正确的手机号码',
    email: '请输入格式正确的邮箱地址',
    intgt0: '必须为大于0的整数',
    intgte0: '必须为非负整数',
    int: '必须为整数(正整数、负整数和0)',
    number: '请输入格式正确的数',
    gt: '必须大于',
    gte: '必须大于等于',
    lt: '必须小于',
    lte: '必须小于等于',
    section: '必须大于等于$1小于等于$2',
    numtimes: '必须是$1的整数倍',
    dotnum: '小数点后保留$1位'
  },
  blurNeed = 'must count ip id tel mobile url email'
    + ' intgt0 intgte0 int gt gte lt lte number'
    + ' dotnum section numtimes',
  keyupNeed = 'count intgt0 intgte0 int number dotnum',
  changeNeed = 'require multiple';

  // /^((?:(?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))\.){3}
  // (?:25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d))))$/
  var regs = {
    ip: new RegExp('^((?:(?:25[0-5]|2[0-4]\\d|((1\\d{2})|([1-9]?\\d)))\\.){3}'
      + '(?:25[0-5]|2[0-4]\\d|((1\\d{2})|([1-9]?\\d))))$'),
    id: /^[1-9]([0-9]{14}|[0-9]{16})([0-9]|X)$/,
    tel: /^((\d{3,4}\-?)|(\(\d{3,4}\)))?\d{7,8}$/,
    mobile: /^(\+\d{2})?1\d{10}$/,
    email: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
    intgt0: /^[1-9]\d*$/,
    intgte0: /^\d+$/,
    int: /^\-?\d+$/
  };

  /**
   * 迭代器，仅供插件内部使用
   * @param defer $.Deferred()
   * @param iterator 迭代方法
   * @param elements 迭代元素
   * @param jump 迭代环节失败时，是否跳过进行下一次迭代next()
   * @param proxy 迭代方法调用对象
   */
  function Process(defer, iterator, elements, jump, proxy) {
    this.defer = defer;
    this.iterator = iterator;
    this.elements = elements;
    this.jump = jump;
    this.proxy = proxy;
    // 其他参数全部作为迭代方法的参数
    this.params = _slice.call(arguments, 5);
  }
  Process.prototype = {
    constructor: Process,
    length: null,
    step: null,
    state: null,
    message: null,
    next: function () {
      var that = this,
          param = [this.elements[this.step]];
      if (this.params.length) {
        param = param.concat(this.params);
      }
      this.iterator.apply(this.proxy, param)
        .done(function (success) {
          if ($.isFunction(that.itemSuccess)) {
            that.itemSuccess.apply(that, param.concat(success));
          }
          that.step += 1;
          if (that.step === that.length) {
            if (that.state === 'failure') {
              that.defer.reject(that.message);
            } else {
              that.state = 'success';
              that.defer.resolve(success);
            }
          } else {
            that.next();
          }
        })
        .fail(function (error) {
          if ($.isFunction(that.itemFailure)) {
            that.itemFailure.apply(that, param.concat(error));
          }
          that.state = 'failure';
          if (that.jump) {
            that.message = error;
            that.step += 1;
            if (that.step === that.length) {
              that.defer.reject(error);
            } else {
              that.next();
            }
          } else {
            that.defer.reject(error);
          }
        });
    },
    init: function () {
      this.length = this.elements.length;
      this.step = 0;
      this.state = 'pending';
      this.next();
    }
  };

  /**
   * 表单验证方法
   * @param $form 注册插件的表单jQuery对象
   * @param options
   */
  function Validate($form, options) {
    this.form = $form;
    this.options = options;
    this.carryList = {};
    this.init();
  }
  Validate.prototype = {
    constructor: Validate,
    // 外部业务逻辑验证方法集合
    outer: [],
    count: 0,

    // 待验证元素集合
    carryList: {},

    // 元素验证信息提示器
    messager: {
      wrap: null,
      body: null,
      show: function(carry, error) {
        this.body.html(error);
        this.wrap.removeClass('hide');
        var pos = carry.flag.offset();
        // 防止中间过程的重绘造成的位移
        this.wrap.css({
          'top': (pos.top - 40) + 'px',
          'left': (pos.left - 20) + 'px'
        });
      },
      hide: function () {
        this.body.empty();
        this.wrap.addClass('hide');
      }
    },

    init: function () {
      this.search();

      var errorBox = [
        '<div class="validate-error hide">',
        '  <h4></h4>',
        '  <div class="validate-caret">',
        '    <div class="validate-caret-top"></div>',
        '    <div class="validate-caret-bottom"></div>',
        '  </div>',
        '</div>'
      ],
      $body = $('body'),
      boxesId = 'validateBoxes';

      $body.append(errorBox.join(''));
      this.messager.wrap = $body.find('.validate-error');
      this.messager.body = this.messager.wrap.find('h4');

      this.messager.wrap.css('z-index', this.options.zIndex);

      // 标示框(一个提示元素输入有误的标志)集合
      boxesId += _replace.call(($.fn.jquery + Math.random()), /\D/g, '');
      $body.append('<div id="' + boxesId + '"></div>');
      this.boxes = $('#' + boxesId);

      // debug模式立即进入事件监听模式
      if (this.options.debug) {
        this.listen();
      }

    },
    // 监听验证元素事件
    listen: function () {
      var that = this;
      $.each(this.carryList, function (i, carry) {
        that.on(carry);
      });
    },

    // 添加一条待验证元素
    add: function ($ele) {
      if (!$.isEmptyObject(this.getRuler($ele))) {
        this.pack($ele);
      }
    },
    // 封装待验证元素进去验证集合载体
    pack: function ($ele) {
      var index = $ele.data('carry-index'),
          ruler = this.getRuler($ele),
          array = this.rulerToArray(ruler),
          $label = this.form.find('[for="' + $ele[0].name + '"]'),
          carry = this.carryList[index];

      if (carry) {
        carry.ruler = ruler;
        carry.array = array;
        carry.label = $label;
      } else {
        carry = {
          index: this.count,
          element: $ele,
          label: $label,
          ruler: ruler,
          array: array
        };
        this.carryList[this.count] = carry;
        $ele.data('carry-index', this.count);
        this.count += 1;
      }
      this.mark(carry);

      // 无验证规则时，移除
      if ($.isEmptyObject(ruler)) {
        return this.remove($ele);
      }
      return this.on(carry);
    },

    // 必填必选元素添加*标志，否则删除
    mark: function (carry) {
      var ruler = carry.ruler;
      if ($.isFunction(this.options.mark)) {
        this.options.mark(carry.element, carry.label, carry.ruler);
      } else {
        if (ruler.must === 1 || ruler.require === 1) {
          this.addMark(carry);
        } else {
          this.removeMark(carry);
        }
      }
      return this;
    },
    addMark: function (carry) {
      var ruler = carry.ruler, $mark;
      if ((ruler.must || ruler.require) && !carry.mark) {
        $mark = $('<i class="validate-mark">*</i>');
        carry.label.append($mark);
        carry.mark = $mark;
      }
      return this;
    },
    removeMark: function (carry) {
      var $mark = carry.mark;
      if ($mark) {
        $mark.remove();
        delete carry.mark;
      }
      return this;
    },

    // 验证失败提示
    showError: function (carry, error) {
      var that = this;
      // 显示标示框
      if (!carry.flag) {
        this.boxes.append('<div class="validate-box"></div>');
        carry.flag = this.boxes.find('.validate-box').last();
        carry.flag.css('z-index', this.options.zIndex + 1);
      } else {
        carry.flag.removeClass('hide');
      }

      carry.label.on('mouseenter.validate-error', function() {
        that.messager.show(carry, error);
      });
      carry.flag.on('mouseenter.validate-error', function() {
        that.messager.show(carry, error);
      });
      carry.label.on('mouseleave.validate-error', function(e) {
        if (!$(e.relatedTarget).hasClass('validate-error')) {
          that.messager.hide(carry);
        }
      });
      carry.flag.on('mouseleave.validate-error', function(e) {
        if (!$(e.relatedTarget).hasClass('validate-error')) {
          that.messager.hide(carry);
        }
      });

      // 每次显示都需要重新定位一次，因为表单元素内容变化会造成位移
      var pos,
        dom = carry.element[0],
        tag = dom.tagName,
        type = dom.type;

      // 检测元素是否有label标签，有则在label文字左侧添加提示标记
      // 无则给元素本身左侧添加，radio和checkbox则在第一个左侧添加
      if (carry.label) {
        pos = carry.label.offset();
      } else {
        if (/^input$/i.test(tag) && /^(radio)|(checkbox)$/i.test(type)) {
          pos = this.form.find('input[name="' + dom.name + '"]')
                  .first().parent('label').offset();
        } else {
          pos = carry.element.offset();
        }
      }

      carry.flag.css({
        'top': pos.top + 'px',
        'left': (pos.left - 10) + 'px'
      });

      return this;
    },
    closeError: function (carry) {
      if (carry.flag) {
        carry.flag.addClass('hide');
        this.messager.hide(carry);
      }
      carry.label.off('mouseenter.validate-error');
      carry.label.off('mouseleave.validate-error');
    },
    on: function (carry) {
      var that = this;
      $.each(carry.array, function (i, ruler) {
        var ele = carry.element, reg;
        if (!ele) {
          return true;
        }
        reg = new RegExp('\\b' + ruler['method'] + '\\b');

        if (reg.test(blurNeed)) {
          ele.off('blur' + eventns).on('blur' + eventns, function () {
            that.once(carry);
          });
        }
        if (reg.test(keyupNeed)) {
          ele.off('keyup' + eventns).on('keyup' + eventns, function () {
            that.once(carry);
          });
        }
        if (reg.test(changeNeed)) {
          that.form.find('[name="' + ele[0].name + '"]')
            .off('change' + eventns).on('change' + eventns, function () {
            that.once(carry);
          });
        }
      });
      return this;
    },
    // 验证单个元素并处理
    once: function (carry) {
      var that = this;
      if (carry.jquery) {
        carry = this.carryList[carry.data('carry-index')];
      }
      this.one(carry)
        .done(function (success) {
          that.one_success(carry, success);
        })
        .fail(function (error) {
          that.one_failure(carry, error);
        });
    },
    off: function (carry) {
      var ele = carry.element;
      if (!ele) {
        return this;
      }
      ele.off('blur' + eventns)
         .off('keyup' + eventns);
      if (/\bradio\b|\bcheckbox\b/i.test(ele[0].type)) {
        this.form.find('[name="' + ele[0].name + '"]').off('change' + eventns);
      }
      return this;
    },

    // 移除一个待验证元素
    remove: function ($ele) {
      var index = $ele.data('carry-index'),
          carry = this.carryList[index];
      if (carry) {
        this.closeError(carry);
        this.off(carry);
        delete this.carryList[index];
      }
      return this;
    },

    // 清除表单验证(必填标记，错误标记，错误信息)
    clear: function () {
      var that = this;

      $.each(this.carryList, function (index, carry) {
        that.ruler(carry.element, null);
      });

      this.boxes.remove();
      this.messager.wrap.remove();
    },

    // 外部请求执行验证命令
    run: function () {
      var defer = $.Deferred(),
          queue = [], that = this, pro;

      // 是否重新遍历一次表单生成一套新的待验证元素集合
      if (this.options.refresh) {
        this.search();
      }

      $.each(this.carryList, function (index, carry) {
        queue.push(carry);
      });

      queue = queue.concat(this.outer);

      if (queue.length === 0) {
        defer.resolve();
        return defer.promise();
      }

      // 待验证元素集合+外部业务验证 ==> 迭代元素
      pro = new Process(defer, this.one, queue, true, this);
      pro.itemSuccess = function (element, success) {
        that.one_success(element, success);
      };
      pro.itemFailure = function (element, error) {
        that.one_failure(element, error);
      };
      pro.init();

      if (!this.options.debug) {
        this.listen();
      }

      return defer.promise();
    },

    // 验证单个元素和外部业务规则
    one: function (element) {
      var defer = $.Deferred(), array;
      if (!element) {
        defer.resolve();
      } else {
        if (typeof element === 'function') {
          // 外部业务规则验证
          element(defer);
        } else {
          // 外部验证单个元素
          if (element.jquery) {
            element = this.carryList[element.data('carry-index')];
          }
          array = element.array;
          new Process(defer, this.enter, array, false, this, element).init();
        }
      }
      return defer.promise();
    },

    // 单个元素验证成功后回调
    one_success: function (element, success) {
      if (element && typeof element !== 'function') {
        this.closeError(element, success);
      }
    },

    // 单个元素验证失败后回调
    one_failure: function (element, error) {
      if (typeof element !== 'function') {
        this.showError(element, error);
      }
    },

    // 验证元素的一条规则
    enter: function (ruler, carry) {
      var defer = $.Deferred();
      if (ruler && methods[ruler.method]) {
        methods[ruler.method].fire(carry.element, ruler.args, defer, this.form);
      } else {
        defer.resolve();
      }
      return defer.promise();
    },

    // 获取指定元素的验证规则 or 更新验证规则
    ruler: function () {
      var params = _slice.call(arguments, 0),
          length = params.length;
      if (length === 1) {
        return this.getRuler(params[0]);
      } else {
        return this.setRuler(params);
      }
    },

    // 验证规则JSON转为Map数组
    rulerToArray: function (ruler) {
      var array = [];
      $.each(ruler, function (key, value) {
        array.push({
          method: key,
          args: value
        });
      });
      return array;
    },

    getRuler: function ($ele) {
      var ruler = $ele.data('ruler') || {};
      if (typeof ruler === 'string') {
        ruler = jsoner($ele.data('ruler'));
        $ele.data('ruler', ruler);
        return ruler;
      }
      return ruler;
    },

    setRuler: function (params) {
      var $ele = params[0],
          ruler = this.getRuler($ele),
          key, value, json;

      if (!params[1] || $.isEmptyObject(params[1])) {
        $ele.removeData('ruler');
        $ele.removeAttr('data-ruler');
        this.pack($ele);
        return this;
      }

      if (params.length > 2) {
        key = params[1];
        value = params[2];
        ruler[key] = value;
        $ele.data('ruler', ruler);
      } else {
        json = params[1];
        if (typeof json === 'string') {
          if (!/^\{.+\}/.test(json)) {
            return ruler[json];
          }
          json = jsoner(json);
        }
        $ele.data('ruler', json);
      }
      return this.pack($ele);
    },

    // 查询表单所有待验证元素
    search: function () {
      var that = this;
      this.form.find('[data-ruler]').each(function () {
        that.add($(this));
      });
    },

    // 添加一条外部业务逻辑验证方法
    out: function (check) {
      this.outer.push(check);
    },

    noop: function () {}
  };

  $.fn.validate = function () {
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
      this.data(namespace, (data = new Validate(this, options)));
    }

    return data[command || 'noop'].apply(data, params.slice(1));
  };

  // 扩展验证方法，已存在方法不许修改
  $.fn.validate.extend = function (fns) {
    if (!$.isArray(fns)) {
      fns = [fns];
    }

    $.each(fns, function (i, fn) {
      // 增加只读属性，防止外部元素修改
      if (!methods[fn['name']] || !methods[fn['name'].readonly]) {
        methods[fn['name']] = fn['fn'];
      }
    });
  };

  /* ===========================
   * 以下为插件自配的一系列验证规则
   * =========================== */

  // 必填
  methods.must = {
    readonly: true,
    error: Message.must,
    fire: function ($ele, args, defer) {
      if (args === 1) {
        if ($ele.val()) {
          defer.resolve()
        } else {
          defer.reject(this.error);
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 必选
  methods.require = {
    readonly: true,
    error: Message.require,
    fire: function ($ele, args, defer, form) {
      var dom = $ele[0],
        tag = dom.tagName,
        type = dom.type;
      if (args === 1) {
        if (/^select$/i.test(tag)) {
          if ($ele.val()) {
            defer.resolve();
          } else {
            defer.reject(this.error[0]);
          }
        } else if (/^input$/i.test(tag) && /^(radio)|(checkbox)$/i.test(type)) {
          if (form.find('[name="' + dom.name + '"]:checked').length) {
            defer.resolve();
          } else {
            defer.reject(this.error[1]);
          }
        } else {
          defer.resolve();
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 多选
  methods.multiple = {
    readonly: true,
    error: Message.multiple,
    fire: function ($ele, args, defer, form) {
      var left, right, isSelect, isCheckbox, length = 0,
        dom = $ele[0], tag = dom.tagName, type = dom.type;

      // 非数组，数组长度不为2，数组元素全为0，不做校验
      if ($.isArray(args) && args.length === 2 && args.join('') !== '00') {
        left = args[0];
        right = args[1];
        isSelect = /^select$/i.test(tag);
        isCheckbox = /^input$/i.test(tag) && /^checkbox$/i.test(type);

        if (isSelect) {
          $ele.find('option').each(function () {
            if (this.selected) {
              length += 1;
            }
          });
        } else if (isCheckbox) {
          length = form.find('[name="' + dom.name + '"]:checked').length;
        } else {
          defer.resolve();
          return;
        }

        // 只有最大值
        if (left <= 0) {
          if (length <= right) {
            defer.resolve();
          } else {
            defer.reject((right + '').replace(/(\d+)/,this.error[2]));
          }
        } else if (right <= 0) {  // 只有最小值
          if (length >= left) {
            defer.resolve();
          } else {
            defer.reject((left + '').replace(/(\d+)/, this.error[1]));
          }
        } else if (left === right) {
          if (length === left) {
            defer.resolve();
          } else {
            defer.reject((left + '').replace(/(\d+)/, this.error[0]));
          }
        } else {
          if (length >= left && length <= right) {
            defer.resolve();
          } else {
            defer.reject(args.join(',').replace(/(\d+)\,(\d+)/, this.error[3]));
          }
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 字数
  methods.count = {
    readonly: true,
    error: Message.count,
    fire: function ($ele, args, defer) {
      var left, right, length = 0, value = $ele.val();

      // 非数组，数组长度不为2，数组元素全为0，不做校验
      if (value && $.isArray(args)
        && args.length === 2 && args.join('') !== '00') {
        left = args[0];
        right = args[1];
        length = value.length;

        // 只有最大值
        if (left <= 0) {
          if (length <= right) {
            defer.resolve();
          } else {
            defer.reject((right + '').replace(/(\d+)/,this.error[2]));
          }
        } else if (right <= 0) {  // 只有最小值
          if (length >= left) {
            defer.resolve();
          } else {
            defer.reject((left + '').replace(/(\d+)/, this.error[1]));
          }
        } else if (left === right) {
          if (length === left) {
            defer.resolve();
          } else {
            defer.reject((left + '').replace(/(\d+)/, this.error[0]));
          }
        } else {
          if (length >= left && length <= right) {
            defer.resolve();
          } else {
            defer.reject(args.join(',').replace(/(\d+)\,(\d+)/, this.error[3]));
          }
        }
      } else {
        defer.resolve();
      }
    }
  };

  // IP地址
  methods.ip = {
    readonly: true,
    error: Message.ip,
    regexp: regs.ip,
    fire: function ($ele, args, defer) {
      var value = $ele.val();
      if (args === 1 && value) {
        if (this.regexp.test(value)) {
          defer.resolve();
        } else {
          defer.reject(this.error);
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 身份证
  methods.id = {
    readonly: true,
    error: Message.id,
    regexp: regs.id,
    fire: function ($ele, args, defer) {
      var value = $ele.val();
      if (args === 1 && value) {
        if (this.regexp.test(value)) {
          defer.resolve();
        } else {
          defer.reject(this.error);
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 固话
  methods.tel = {
    readonly: true,
    error: Message.tel,
    regexp: regs.tel,
    fire: function ($ele, args, defer) {
      var value = $ele.val();
      if (args === 1 && value) {
        if (this.regexp.test(value)) {
          defer.resolve();
        } else {
          defer.reject(this.error);
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 移动电话
  methods.mobile = {
    readonly: true,
    error: Message.mobile,
    regexp: regs.mobile,
    fire: function ($ele, args, defer) {
      var value = $ele.val();
      if (args === 1 && value) {
        if (this.regexp.test(value)) {
          defer.resolve();
        } else {
          defer.reject(this.error);
        }
      } else {
        defer.resolve();
      }
    }
  };

  // EMAIL
  methods.email = {
    readonly: true,
    error: Message.email,
    regexp: regs.email,
    fire: function ($ele, args, defer) {
      var value = $ele.val();
      if (args === 1 && value) {
        if (this.regexp.test(value)) {
          defer.resolve();
        } else {
          defer.reject(this.error);
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 大于0的整数
  methods.intgt0 = {
    readonly: true,
    error: Message.intgt0,
    regexp: regs.intgt0,
    fire: function ($ele, args, defer) {
      var value = $ele.val();
      if (args === 1 && value) {
        if (this.regexp.test(value)) {
          defer.resolve();
        } else {
          defer.reject(this.error);
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 大于等于0的整数
  methods.intgte0 = {
    readonly: true,
    error: Message.intgte0,
    regexp: regs.intgte0,
    fire: function ($ele, args, defer) {
      var value = $ele.val();
      if (args === 1 && value) {
        if (this.regexp.test(value)) {
          defer.resolve();
        } else {
          defer.reject(this.error);
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 整数
  methods.int = {
    readonly: true,
    error: Message.int,
    regexp: regs.int,
    fire: function ($ele, args, defer) {
      var value = $ele.val();
      if (args === 1 && value) {
        if (this.regexp.test(value)) {
          defer.resolve();
        } else {
          defer.reject(this.error);
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 数
  methods.number = {
    readonly: true,
    error: Message.number,
    fire: function ($ele, args, defer) {
      var value = $ele.val();
      if (args === 1 && value) {
        if ($.isNumeric(value)) {
          defer.resolve();
        } else {
          defer.reject(this.error);
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 大于
  methods.gt = {
    readonly: true,
    error: Message.gt,
    fire: function ($ele, args, defer) {
      var value = $ele.val();
      if (value) {
        if ($.isNumeric(value) && value > args) {
          defer.resolve();
        } else {
          defer.reject(this.error + args);
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 大于等于
  methods.gte = {
    readonly: true,
    error: Message.gte,
    fire: function ($ele, args, defer) {
      var value = $ele.val();
      if (value) {
        if ($.isNumeric(value) && value >= args) {
          defer.resolve();
        } else {
          defer.reject(this.error + args);
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 小于
  methods.lt = {
    readonly: true,
    error: Message.lt,
    fire: function ($ele, args, defer) {
      var value = $ele.val();
      if (value) {
        if ($.isNumeric(value) && value < args) {
          defer.resolve();
        } else {
          defer.reject(this.error + args);
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 小于等于
  methods.lte = {
    readonly: true,
    error: Message.lte,
    fire: function ($ele, args, defer) {
      var value = $ele.val();
      if (value) {
        if ($.isNumeric(value) && value <= args) {
          defer.resolve();
        } else {
          defer.reject(this.error + args);
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 数值区间
  methods.section = {
    readonly: true,
    error: Message.section,
    fire: function ($ele, args, defer) {
      var value = $ele.val(), l, r;
      // 非数组，数组长度不为2，不做校验
      if (value && $.isArray(args) && args.length === 2) {
        l = args[0];
        r = args[1];
        if ($.isNumeric(value) && value >= l && value <= r) {
          defer.resolve();
        } else {
          defer.reject(this.error.replace('$1', l).replace('$2', r));
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 整数倍
  methods.numtimes = {
    readonly: true,
    error: Message.numtimes,
    fire: function ($ele, args, defer) {
      var value = $ele.val(), array = [];
      if (value) {
        if ($.isArray(args)) {
          array = $.map(args, function (n) {
            if (n === 0) {
              return 0;
            }
            return (value % n === 0) ? 1 : 0;
          });
          if (array.join('').split('0').join('').length) {
            defer.resolve();
          } else {
            defer.reject(this.error.replace('$1', args.join(',')));
          }
        } else {
          if (args === 0) {
            defer.resolve();
          } else {
            if (value % args === 0) {
              defer.resolve();
            } else {
              defer.reject(this.error.replace('$1', args));
            }
          }
        }
      } else {
        defer.resolve();
      }
    }
  };

  // 小数点后位数
  methods.dotnum = {
    readonly: true,
    error: Message.dotnum,
    fire: function ($ele, args, defer) {
      var value = $ele.val(), reg;
      if (value) {
        reg = new RegExp('\\.\\d\{' + args + '\}$');
        if ($.isNumeric(value) && reg.test(value)) {
          defer.resolve();
        } else {
          defer.reject(this.error.replace('$1', args));
        }
      } else {
        defer.resolve();
      }
    }
  };

})(this);
