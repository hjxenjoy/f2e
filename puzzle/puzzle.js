var obj = document.getElementById('puzzle');
var width = 400;
var height = 400;
var columns = 4;
var rows = 4;
var item_height = 100;
var item_width = 100;
var total = 16;
var set = {};
var interval;
var items = [];

init();

listen();

function listen() {
  for (var i = 0; i < items.length; i++) {
    items[i].addEventListener('click', function () {
      var index = this.innerHTML * 1;
      var prop = set[index];
      if (index === total - 1) {
        return false;
      }

      var valid = ',' + getValid().join(',') + ',';
      if (valid.indexOf(',' + prop.index + ',') > -1) {
        transform(index);
      }
    }, false);
  }
}

function transform(number) {
  var current = items[number];
  var black = items[total - 1];
  current.style.top = set[total - 1].top + 'px';
  current.style.left = set[total - 1].left + 'px';

  black.style.top = set[number].top + 'px';
  black.style.left = set[number].left + 'px';

  var prev = set[total - 1];
  set[total - 1] = set[number];
  set[number] = prev;

}

function getValid() {

  var black = set[total - 1];

  var left = Math.floor(black.left / item_width);
  var top = Math.floor(black.top / item_height);

  // console.log('黑块位于第' + (top + 1) + '行第' + (left + 1) + '列');

  var valid = [];

  if (top > 0) {
    valid.push((top - 1) * columns + left);
  }
  if (left > 0) {
    valid.push(top * columns + left - 1);
  }

  if (top + 1 < rows) {
    valid.push((top + 1) * columns +  left);
  }

  if (left + 1 < columns) {
    valid.push(top * columns + left + 1);
  }

  return valid;
}

function init() {
  obj.style.width = (width + columns + 1) + 'px';
  obj.style.height = (height + rows + 1) + 'px';

  var html = [];
  item_width = width / columns;
  item_height = height / rows;

  total = rows * columns;

  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < columns; j++) {
      var top = i * item_height + i + 1;
      var left = j * item_width + j + 1;

      var position = 'width: ' + item_width + 'px;'
        + 'height: ' + item_height + 'px;'
        + 'line-height: ' + item_height + 'px;'
        + 'font-size: ' + Math.floor(Math.min(item_width, item_height) / 2) + 'px;'
        + 'background-position:' + j * - 1 * item_width + 'px ' + i * - 1 * item_height + 'px;'
        + 'top: ' + top + 'px;'
        + 'left: ' + left + 'px;';

      var index = (i * rows + j);

      set[index] = {
        top: top,
        left: left,
        index: index
      };
      index = index < 10 ? '0' + index : index;

      html.push('<div class="item" style="' + position + '">' + index + '</div>');
    }
  }

  obj.innerHTML = html.join('');

  items = document.querySelectorAll('.item');
}

function run1() {
  if (interval) {
    window.clearInterval(interval);
    interval = undefined;
  }
  shuffle(items, rows);
}

var record = [];
function run2() {
  if (interval) {
    window.clearInterval(interval);
    interval = undefined;
  }
  reback();
  record = [];
  console.time('record');
  for (var i = 0; i < 100; i++) {
    var valid = getValid();
    // 从可用对象中随机筛选一个进行交换
    var index = valid[Math.floor(Math.random() * valid.length)];

    for (var j = 0; j < total; j++) {
      if (set[j].index === index) {
        transform(j);
        record.push(j);
        break;
      }
    }
  }

  console.timeEnd('record');
}

function clean() {
  // console.log('开始清理');
  var i = 0;
  while(i < record.length) {
    if (record[i] === record[i + 1]) {
      record.splice(i, 2);
      if (i > 0) {
        i--;
      }
    } else {
       i++;
    }
  }
}

function display() {

  if (!record.length || interval) {
    return;
  }
  clean();
  interval = window.setInterval(function () {
    transform(record.pop());
    if (!record.length) {
      window.clearInterval(interval);
      interval = undefined;
    }
  }, 500);
}


function reback() {
  if (interval) {
    window.clearInterval(interval);
    interval = undefined;
  }
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < columns; j++) {
      (function (item, index, i, j) {
        var top = i * item_height + i + 1;
        var left = j * item_width + j + 1;
        set[index] = {
          top: top,
          left: left,
          index: index
        };
        item.style.top = top + 'px';
        item.style.left = left + 'px';

      })(items[i * rows + j], i * rows + j, i, j);
    }
  }
}

function shuffle(arr, rows) {
  var length = arr.length;

  for (var i = 0; i < length; i++) {
    var index = Math.floor(Math.random() * length);
    var prev = arr[i];
    arr[i] = arr[index];
    arr[index] = prev;

    prev = set[i];
    set[i] = set[index];
    set[index] = prev;

    arr[i].style.top = set[i].top + 'px';
    arr[i].style.left = set[i].left + 'px';

    arr[index].style.top = set[index].top + 'px';
    arr[index].style.left = set[index].left + 'px';
  }

  return arr;
}

function showIndex() {
  obj.classList.contains('show-index') ?
  obj.classList.remove('show-index') :
  obj.classList.add('show-index');
}


function random(number, rows) {
  var arr = [];
  for (var i = 0; i < number; i++) {
    arr.push(i < 10 ? '0' + i : '' + i);
  }

  for (i = 0; i < number; i++) {
    var index = Math.floor(Math.random() * number);

    var prev = arr[i];
    arr[i] = arr[index];
    arr[index] = prev;
  }

  var columns = number / rows;
  for (i = 0; i < rows; i++) {
    var line = [];
    for (var j = 0; j < columns; j++) {
      line.push(arr[i * columns + j]);
    }
    console.log('%c' + line.join(' '), 'font-size: 16px;color:#090;');
  }

  return arr;
}

// random(16, 4);
