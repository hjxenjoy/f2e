// 基本组件
(function(window) {
  window.$ = function(id) {
    return document.getElementById(id);
  };

  window.$$ = function(selector, context) {
    return (context || document).querySelectorAll(selector);
  };

  window.on = function(element, eventName, callback) {
    element.addEventListener(eventName, callback);
  };

})(window);

// 基本常亮
(function(window) {

  window.DRAW = {
    defaultRadius: 5,
    radius: 5,
    color: '#000'
  };

})(window);

// 画图功能
(function(window) {

  var canvas = $('canvas');
  var context = canvas.getContext('2d');

  var moving = false;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 50;

  context.lineWidth = DRAW.radius * 2;

  window.context = context;
  window.canvas = canvas;

  on(canvas, 'mousedown', startDraw);
  on(canvas, 'mousemove', drawPoint);
  on(canvas, 'mouseup', stopDraw);

  startX = 0;
  startY = 0;
  lastX = 0;
  lastY = 0;

  function startDraw(event) {
    moving = true;
    startX = event.offsetX;
    startY = event.offsetY;

  }

  function drawPoint(event) {
    if (moving) {
      context.beginPath();
      // console.log(lastX, lastY);
      context.clearRect(startX, startY, lastX, lastY);
      context.lineWidth = DRAW.radius;
      context.strokeStyle = DRAW.color;
      context.rect(startX, startY, lastX = event.offsetX - startX, lastY = event.offsetY - startY);
      context.stroke();
      context.closePath();
    }

  }

  function stopDraw() {
    if (moving) {
      moving = false;
    }

  }


})(window);

// 工具栏事件绑定和初始化
(function(window) {
  var radiusRange = $('radiusRange');
  var rangeNumber = $('rangeNumber');
  var colorSelect = $('colorSelect');

  var colorArray = ['#000', '#999', '#f00', '#0f0', '#00f', '#fff', '#ff0', '#0ff', '#f0f'];

  var rangeMoving = false;
  on(radiusRange, 'mousedown', function() {
    rangeMoving = true;
  });
  on(radiusRange, 'mousemove', function() {
    changeRadius(this.value);
  });
  on(radiusRange, 'mouseup', function() {
    rangeMoving = false;
  });
  on(radiusRange, 'change', function() {
    changeRadius(this.value);
  });

  var colorList = document.createDocumentFragment();
  var firstColor;
  for (var i = 0, len = colorArray.length; i < len; i++) {

    (function(color, index) {
      var colorBtn = document.createElement('div');
      colorBtn.className = 'color-btn';
      colorBtn.setAttribute('data-color', color);
      colorBtn.style.backgroundColor = color;

      on(colorBtn, 'click', switchColor);

      if (index === 0) {
        firstColor = colorBtn;
        colorBtn.className = 'color-btn active';
      }

      colorList.appendChild(colorBtn);

    })(colorArray[i], i);

  }

  colorSelect.appendChild(colorList);
  switchColor({
    target: firstColor
  });

  radiusRange.value = DRAW.defaultRadius;
  changeRadius(DRAW.defaultRadius);

  on($('restartBtn'), 'click', function() {
    canvas.width = canvas.width;
  });

  function switchColor(e) {
    var target = e.target;
    var color = target.getAttribute('data-color');

    DRAW.color = color;

    $$('.active', colorSelect)[0].className = 'color-btn';

    target.className = 'color-btn active';
  }

  function changeRadius(radius) {
    rangeNumber.innerHTML = radius;
    window.DRAW.radius = radius;
    window.context.lineWidth = radius * 2;
  }

})(window);
