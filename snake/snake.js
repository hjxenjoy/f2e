(function () {

  var WIDTH = 12;
  var HEIGHT = 12;

  var DOT_W = 6;
  var DOT_H = 6;

  var BOX = document.getElementById('map');
  var COUNTS = document.getElementById('counts');

  var X = 30;
  var Y = 50;

  var DIRECT_TOP = -1;
  var DIRECT_RIGHT = 2;
  var DIRECT_BOTTOM = 1;
  var DIRECT_LEFT = -2;

  var DELAY = 100;

  var SNAKE_POINTS = [ [0, 2], [1, 2], [2, 2], [3, 2], [4, 2] ];
  var INIT_SNAKE_LENGTH = SNAKE_POINTS.length;

  var dot_matrix =
    [
        [
            [0,0,1,1,1,0,0],
            [0,1,1,0,1,1,0],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [0,1,1,0,1,1,0],
            [0,0,1,1,1,0,0]
        ],//0
        [
            [0,0,0,1,1,0,0],
            [0,1,1,1,1,0,0],
            [0,0,0,1,1,0,0],
            [0,0,0,1,1,0,0],
            [0,0,0,1,1,0,0],
            [0,0,0,1,1,0,0],
            [0,0,0,1,1,0,0],
            [0,0,0,1,1,0,0],
            [0,0,0,1,1,0,0],
            [1,1,1,1,1,1,1]
        ],//1
        [
            [0,1,1,1,1,1,0],
            [1,1,0,0,0,1,1],
            [0,0,0,0,0,1,1],
            [0,0,0,0,1,1,0],
            [0,0,0,1,1,0,0],
            [0,0,1,1,0,0,0],
            [0,1,1,0,0,0,0],
            [1,1,0,0,0,0,0],
            [1,1,0,0,0,1,1],
            [1,1,1,1,1,1,1]
        ],//2
        [
            [1,1,1,1,1,1,1],
            [0,0,0,0,0,1,1],
            [0,0,0,0,1,1,0],
            [0,0,0,1,1,0,0],
            [0,0,1,1,1,0,0],
            [0,0,0,0,1,1,0],
            [0,0,0,0,0,1,1],
            [0,0,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [0,1,1,1,1,1,0]
        ],//3
        [
            [0,0,0,0,1,1,0],
            [0,0,0,1,1,1,0],
            [0,0,1,1,1,1,0],
            [0,1,1,0,1,1,0],
            [1,1,0,0,1,1,0],
            [1,1,1,1,1,1,1],
            [0,0,0,0,1,1,0],
            [0,0,0,0,1,1,0],
            [0,0,0,0,1,1,0],
            [0,0,0,1,1,1,1]
        ],//4
        [
            [1,1,1,1,1,1,1],
            [1,1,0,0,0,0,0],
            [1,1,0,0,0,0,0],
            [1,1,1,1,1,1,0],
            [0,0,0,0,0,1,1],
            [0,0,0,0,0,1,1],
            [0,0,0,0,0,1,1],
            [0,0,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [0,1,1,1,1,1,0]
        ],//5
        [
            [0,0,0,0,1,1,0],
            [0,0,1,1,0,0,0],
            [0,1,1,0,0,0,0],
            [1,1,0,0,0,0,0],
            [1,1,0,1,1,1,0],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [0,1,1,1,1,1,0]
        ],//6
        [
            [1,1,1,1,1,1,1],
            [1,1,0,0,0,1,1],
            [0,0,0,0,1,1,0],
            [0,0,0,0,1,1,0],
            [0,0,0,1,1,0,0],
            [0,0,0,1,1,0,0],
            [0,0,1,1,0,0,0],
            [0,0,1,1,0,0,0],
            [0,0,1,1,0,0,0],
            [0,0,1,1,0,0,0]
        ],//7
        [
            [0,1,1,1,1,1,0],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [0,1,1,1,1,1,0],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [0,1,1,1,1,1,0]
        ],//8
        [
            [0,1,1,1,1,1,0],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [1,1,0,0,0,1,1],
            [0,1,1,1,0,1,1],
            [0,0,0,0,0,1,1],
            [0,0,0,0,0,1,1],
            [0,0,0,0,1,1,0],
            [0,0,0,1,1,0,0],
            [0,1,1,0,0,0,0]
        ]//9
    ];

  /**
   * 初始化画布
   */
  function init() {

    BOX.style.cssText = "width:" + Y * WIDTH + 'px;height:' + X * HEIGHT + 'px;';

  }

  /**
   * 动画绘制
   */
  function draw(snake) {

    BOX.innerHTML = '';

    var i = 0, length = snake.points.length;
    var bean = snake.target;
    
    var html = [];
    
    for (; i < length; i++) {

      (function (point) {

        var ele = '<i style="top:' 
          + point[0] * HEIGHT + 'px;left:' 
          + point[1] * WIDTH + 'px;"></i>';

        html.push(ele);

      })(snake.points[i]);
    }

    html.push('<i style="top:' 
          + bean[0] * HEIGHT + 'px;left:' 
          + bean[1] * WIDTH + 'px;"></i>');

    BOX.innerHTML = html.join('');
    COUNTS.innerHTML = count(length - INIT_SNAKE_LENGTH);

  }

  function count(counts) {

    var numbers = [counts];

    if (counts > 9) {
      numbers = ('' + counts).match(/\d/g);
    }

    var html = [];

    while(numbers.length) {
      html = html.concat(drawNumber(numbers.shift()));
    }

    return html.join('');

  }

  function drawNumber(number) {
    var target = dot_matrix[number];
    var result = ['<div class="number">'];

    for (var x = 0; x < target.length; x++) {

      (function (line, x) {

        for (var y = 0; y < line.length; y++) {

          (function (isDot, x, y) {
            if (isDot) {
              result.push('<i class="dot" style="top:' + x * DOT_H  + 'px;left:' + y * DOT_W + 'px;"></i>');
            }

          })(line[y] === 1, x, y);

        }

      })(target[x], x);
    }

    result.push('</div>');

    return result;
  }

  /**
   * 生成一个有效的豆子
   */
  function birth(snake) {
    // 随机一个坐标
    var point = [];
    while(!point.length || snake.contains(point)) {
      point = [
        randomCenter(X),
        randomCenter(Y)
      ];
    }
    return point;
  }

  function randomCenter(max) {
    var number = 0;

    while(number === 0 || number === (max - 1)) {
      number = Math.floor(Math.random() * max);
    }

    return number;
  }

  function eq(p1, p2) {
    return p1[0] === p2[0] && p1[1] === p2[1];
  }

  // 蛇对象
  function Snake(points) {
    this.points = points;
    
    this.direct = DIRECT_BOTTOM;

    this.target = birth(this);
  }

  Snake.prototype = {

    constructor: Snake,

    head: function () {
      return this.points[this.points.length - 1];
    },

    // 判断一个点是否在蛇本体上
    contains: function (point) {
      var i = 0, length = this.points.length;
      var result = false;
      for (; i < length; i++) {
        if (eq(this.points[i], point)) {
          result = true;
          break;
        }
      }
      return result;
    },

    // 吃豆子
    eat: function () {
      this.points.push([this.target[0], this.target[1]]);
      this.move();

      this.target = birth(this);
    },

    // 动
    run: function () {

      this.points.shift();
      return this.move();

    },

    // 移动到下一个坐标
    move: function () {

      var next = false;
      
      switch(this.direct) {
        case DIRECT_BOTTOM:
          next = this.bottom();
          break;
        case DIRECT_RIGHT:
          next = this.right();
          break;
        case DIRECT_TOP:
          next = this.top();
          break;
        case DIRECT_LEFT:
          next = this.left();
          break;
      }

      if (next) {
        // 遇到目标
        if (eq(next, this.target)) {
          this.eat();
        } else {
          this.points.push(next);
        }
        return this;
      }
      return false;

    },

    // 向上移动时下一个目标
    top: function () {
      var head = this.head();
      var target = [];

      target = [head[0] - 1, head[1]];

      if (target[0] === -1 || this.contains(target)) {
        return false;
      }
      return target;
    },

    // 向右移动
    right: function () {

      var head = this.head();
      var target = [];

      target = [head[0], head[1] + 1];

      if (target[1] === Y || this.contains(target)) {
        return false;
      }
      return target;

    },

    // 向下移动
    bottom: function () {
      var head = this.head();
      var target = [];

      target = [head[0] + 1, head[1]];

      if (target[0] === X || this.contains(target)) {
        return false;
      }
      return target;

    },

    // 向左移动
    left: function () {
      var head = this.head();
      var target = [];

      target = [head[0], head[1] - 1];

      if (target[1] === -1 || this.contains(target)) {
        return false;
      }
      return target;
    }


  };

  function circle(snake) {
    draw(snake);
    
    if (snake.run()) {
      window.setTimeout(function () {
        circle(snake);
      }, DELAY);
    }

  }

  // 初始化画布
  init();

  var snake = new Snake(SNAKE_POINTS);

  circle(snake);

  var m = {'37': DIRECT_LEFT, '38': DIRECT_TOP, '39': DIRECT_RIGHT, '40': DIRECT_BOTTOM};

  window.onkeydown = function (event) {
    var nextDirect = m[event.keyCode] || 0;
    // 出现反方向和位置键位操作时
    if (nextDirect && snake.direct + nextDirect !== 0) {
      snake.direct = nextDirect;
    }
  };


})();
