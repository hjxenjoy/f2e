(function () {

  'use strict';

  var dotW = 30;
  var dotH = 30;

  var DiamondSet = [
    [ // 品
      [0,1,0],
      [1,1,1],
      [0,0,0]
    ],
    [ // L
      [1,0,0],
      [1,1,1],
      [0,0,0]
    ],
    [ // nL
      [0,0,1],
      [1,1,1],
      [0,0,0]
    ],
    [
      [1,1,0],
      [0,1,1],
      [0,0,0]
    ],
    [
      [0,1,1],
      [1,1,0],
      [0,0,0]
    ],
    [ // 口
      [1,1],
      [1,1]
    ],
    [ // ----
      [1,1,1,1]
    ],
  ];

  // 方块对象
  function Diamond(type) {
    this.type = type;
    this.matrix = DiamondSet[this.type];
  }

  Diamond.prototype = {

    constructor: Diamond,

    rotate: function (degree) {

      var result = new Array(this.matrix[0].length);

      this.matrix.forEach(function (line, row) {

        line.forEach(function (dot, col) {
          if (!result[col]) {
            result[col] = [];
          }
          result[col].push(dot);
        });

      });

      result.forEach(function (line, index) {
        result[index] = line.reverse();
      });

      this.matrix = result;

      return this;
    },

    html: function () {
      var w = this.matrix[0].length * dotW;
      var h = this.matrix.length * dotH;

      var html = ['<div class="matrix type_' + this.type + '" style="width:' + w + 'px;height:' + h + 'px;">'];

      this.matrix.forEach(function (line, row) {

        line.forEach(function (dot, col) {
          if (dot === 1) {
            html.push('<i style="top:' + row * dotH + 'px;left:' + col * dotW + 'px;"></i>');
          }
        });

      });

      html.push('</div>');

      return html.join('');
    }

  };


  var box = document.getElementById('tetris');

  var item = new Diamond(0);
  box.innerHTML = item.html();
  // box.innerHTML = new Diamond(0).html()
  //  + new Diamond(1).html()
  //  + new Diamond(2).html()
  //  + new Diamond(3).html()
  //  + new Diamond(4).html()
  //  + new Diamond(5).html()
  //  + new Diamond(6).html()
   ;

  document.addEventListener('keydown', function (event) {
    if (event.keyCode === 32) {
      box.innerHTML = item.rotate().html();
    }
  })

})();