(function(prototype) {
  prototype.getContext = (function(_super) {
    return function(type) {
      var backingStore, ratio,
        context = _super.call(this, type);

      if (type === '2d') {

        backingStore = context.backingStorePixelRatio ||
          context.webkitBackingStorePixelRatio ||
          context.mozBackingStorePixelRatio ||
          context.msBackingStorePixelRatio ||
          context.oBackingStorePixelRatio ||
          context.backingStorePixelRatio || 1;

        ratio = (window.devicePixelRatio || 1) / backingStore;

        if (ratio > 1) {
          this.style.height = this.height + 'px';
          this.style.width = this.width + 'px';
          this.width *= ratio;
          this.height *= ratio;
        }
      }

      return context;
    };
  })(prototype.getContext);
})(HTMLCanvasElement.prototype);

(function() {

  var WIDTH = 12;
  var HEIGHT = 12;

  var X = 30;
  var Y = 50;

  var interval;

  var DIRECT_TOP = -1;
  var DIRECT_RIGHT = 2;
  var DIRECT_BOTTOM = 1;
  var DIRECT_LEFT = -2;

  var DELAY = 100;

  var SNAKE_POINTS = [
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2]
  ];
  var INIT_SNAKE_LENGTH = SNAKE_POINTS.length;

  var dot_matrix = [
    [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 0, 1, 1, 0],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [0, 1, 1, 0, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0]
    ], //0
    [
      [0, 0, 0, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 1, 1]
    ], //1
    [
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0, 0],
      [0, 1, 1, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ], //2
    [
      [1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [0, 1, 1, 1, 1, 1, 0]
    ], //3
    [
      [0, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 0],
      [0, 1, 1, 0, 1, 1, 0],
      [1, 1, 0, 0, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 1, 1, 1, 1]
    ], //4
    [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [0, 1, 1, 1, 1, 1, 0]
    ], //5
    [
      [0, 0, 0, 0, 1, 1, 0],
      [0, 0, 1, 1, 0, 0, 0],
      [0, 1, 1, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 0],
      [1, 1, 0, 1, 1, 1, 0],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [0, 1, 1, 1, 1, 1, 0]
    ], //6
    [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 0, 0, 0]
    ], //7
    [
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [0, 1, 1, 1, 1, 1, 0]
    ], //8
    [
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1],
      [0, 1, 1, 1, 0, 1, 1],
      [0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [0, 1, 1, 0, 0, 0, 0]
    ] //9
  ];

  var canvas = document.getElementById('canvas');

  canvas.width = Y * WIDTH;
  canvas.height = X * HEIGHT + 200;

  var ctx = canvas.getContext('2d');
  // window.ctx = ctx;

  function draw(snake) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.fillStyle = '#666';
    ctx.rect(0, X * HEIGHT, Y * WIDTH, 200);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = '#f90';
    ctx.font = '20px Microsoft Yahei';
    ctx.fillText('当前分数', 30, X * HEIGHT + 30);

    var i = 0,
      length = snake.points.length;
    var bean = snake.target;

    // var html = [];

    for (; i < length; i++) {

      (function(point) {
        fillGrid(point[1] * WIDTH, point[0] * HEIGHT);

      })(snake.points[i]);
    }
    fillGrid(bean[1] * WIDTH, bean[0] * HEIGHT);

    count(length - INIT_SNAKE_LENGTH);
  }

  function fillGrid(x, y) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'transparent';
    ctx.fillStyle = '#000';
    ctx.rect(x, y, 11, 11);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#666';
    ctx.rect(x + 3, y + 3, 5, 5);
    ctx.stroke();
    ctx.closePath();
  }

  function count(counts) {

    var numbers = [counts];

    if (counts > 9) {
      numbers = ('' + counts).match(/\d/g);
    }
    var i = 0;
    while (numbers.length) {
      drawNumber(numbers.shift(), i++);
    }
  }

  function drawNumber(number, index) {
    var target = dot_matrix[number];
    for (var x = 0; x < target.length; x++) {

      (function(line, x) {

        for (var y = 0; y < line.length; y++) {

          (function(isDot, x, y) {
            if (isDot) {

              ctx.beginPath();
              ctx.fillStyle = '#999';
              ctx.arc(30 + index * 8 * 12 + y * 12 - 6, X * HEIGHT + x * 12 + 60, 6, 0, 2 * Math.PI);
              ctx.fill();
              ctx.closePath();
            }

          })(line[y] === 1, x, y);

        }

      })(target[x], x);
    }


  }

  /**
   * 生成一个有效的豆子
   */
  function birth(snake) {
    // 随机一个坐标
    var point = [];
    while (!point.length || snake.contains(point)) {
      point = [
        randomCenter(X),
        randomCenter(Y)
      ];
    }
    return point;
  }

  function randomCenter(max) {
    var number = 0;

    while (number === 0 || number === (max - 1)) {
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

    head: function() {
      return this.points[this.points.length - 1];
    },

    // 判断一个点是否在蛇本体上
    contains: function(point) {
      var i = 0,
        length = this.points.length;
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
    eat: function() {
      this.points.push([this.target[0], this.target[1]]);
      this.move();

      this.target = birth(this);
    },

    // 动
    run: function() {

      this.points.shift();
      return this.move();

    },

    // 移动到下一个坐标
    move: function() {

      var next = false;

      switch (this.direct) {
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
    top: function() {
      var head = this.head();
      var target = [];

      target = [head[0] - 1, head[1]];

      if (target[0] === -1 || this.contains(target)) {
        return false;
      }
      return target;
    },

    // 向右移动
    right: function() {

      var head = this.head();
      var target = [];

      target = [head[0], head[1] + 1];

      if (target[1] === Y || this.contains(target)) {
        return false;
      }
      return target;

    },

    // 向下移动
    bottom: function() {
      var head = this.head();
      var target = [];

      target = [head[0] + 1, head[1]];

      if (target[0] === X || this.contains(target)) {
        return false;
      }
      return target;

    },

    // 向左移动
    left: function() {
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
      interval = window.setTimeout(function() {
        circle(snake);
      }, DELAY);
    }

  }

  var snake = new Snake(SNAKE_POINTS.concat());

  draw(snake);

  var m = {
    '37': DIRECT_LEFT,
    '38': DIRECT_TOP,
    '39': DIRECT_RIGHT,
    '40': DIRECT_BOTTOM
  };

  window.onkeydown = function(event) {
    var nextDirect = m[event.keyCode] || 0;
    // 出现反方向和位置键位操作时
    if (nextDirect && snake.direct + nextDirect !== 0) {
      snake.direct = nextDirect;
    }

    if (event.keyCode === 32) { // space
      if (interval) {
        window.clearInterval(interval);
        interval = 0;
        // BOX.className = 'pending';
      } else {
        // BOX.className = '';

        window.setTimeout(function() {
          circle(snake);
        }, 500);

      }

    }

    if (event.keyCode === 82) { // R
      snake = new Snake(SNAKE_POINTS.concat());
      draw(snake);

      window.clearInterval(interval);
      interval = 0;
      // BOX.className = 'pending';
    }

  };

})();
