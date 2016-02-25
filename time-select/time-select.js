;(function (win) {
  var doc = win.document;

  var U = {
    each: function (arr, callback) {
      var i = 0, len = arr.length;
      for (; i < len; i++) {
        var goon = callback(arr[i], i);
        if (goon === false) {
          break;
        }
      }
    },
    map: function (arr, callback) {
      var result = [];
      this.each(arr, function (item, index) {
        result.push(callback(item, index));
      });
      return result;
    },
    position: function (ele) {
      var x = ele.offsetLeft;
      var y = ele.offsetTop;
      var parent = ele.offsetParent;

      while(parent) {
        x += parent.offsetLeft;
        y += parent.offsetTop;
        parent = parent.offsetParent;
      }

      return {
        x: x,
        y: y
      };
    },

    on: function (target, eventType, callback) {
      target.addEventListener(eventType, callback);
    }
  };

  var cache = {};
  var idList = [];
  var uuid = Math.random().toString().substr(2) - 0;

  var box = doc.createElement('div');
  box.className = 'ts-box';
  doc.body.appendChild(box);

  var activeObj;

  var TimeSelect = function (ele) {
    this.ele = ele;
    this.ele.setAttribute('time-select-uuid', 'ts_' + uuid.toString(16));
    this.init();
  };

  TimeSelect.prototype.init = function () {
    var params = this.ele.getAttribute('data-time-select') || '{}';
    if (!/^{.*}$/.test(params)) {
      params = '{' + params + '}';
    }
    var options = new Function('return ' + params + ';')();
    this.opts = {
      step: options.step || 30,
      begin: options.begin || 8,
      max: options.max || false
    };

    var self = this;

    // 时间点集合
    var timeRange = [];

    // 计算可视区域24个时间点
    var index = 0;
    while(index < 24) {
      var t = addTime(this.opts.begin, this.opts.step * index);
      timeRange.push(t);
      index++;
    }

    var prevRange = this.prev(timeRange);
    var nextRange = this.next(timeRange);

    this.timeRange = [].concat(prevRange, timeRange, nextRange);

    var prevCount = [];
    if (prevRange.length >= 24) {
      prevCount.push(prevRange.length % 24);
      prevCount.push(Math.floor(prevRange.length / 24));
    } else {
      prevCount.push(prevRange.length);
    }
    var nextCount = [];
    if (nextRange.length >= 24) {
      nextCount.push(nextRange.length % 24);
      nextCount.push(Math.floor(nextRange.length / 24));
    } else {
      nextCount.push(nextRange.length);
    }
    this.prevCount = prevCount;
    this.nextCount = nextCount;

    U.on(this.ele, 'click', function (e) {
      e.stopPropagation();
      self.open();
    });
  };

  TimeSelect.prototype.prev = function (timeRange) {
    if (this.opts.begin <= 0) {
      return [];
    }
    var prevRange = [];
    var clock = 0;
    var index = 0;
    var time = '00:00';
    while(time !== timeRange[0]) {
      time = addTime(clock, index * this.opts.step);
      if (time.replace(':', '') - timeRange[0].replace(':', '') >= 0) {
        break;
      }
      prevRange.push(time);
      index++;
    }

    return prevRange;
  };

  TimeSelect.prototype.next = function (timeRange) {
    var lastTime = timeRange[timeRange.length - 1];
    if (lastTime === '24:00') {
      return [];
    }
    var nextRange = [];
    while(lastTime.replace(':', '') <= 2400) {
      lastTime = addTime(lastTime.substr(0, 2) - 0, lastTime.substr(3) - 0 + this.opts.step);
      if (lastTime.replace(':', '') >= 2400) {
        break;
      }
      nextRange.push(lastTime);
    }

    return nextRange;
  };

  TimeSelect.prototype.open = function () {
    if (this.opened) {
      return this;
    }
    activeObj = this;
    this.opened = true;

    var pos = U.position(this.ele);
    var self = this;
    var selected = this.indexOf();
    var selectedPageNo = -1;
    
    var htmls = [];

    var prevHtmls = [];
    var count = 0;
    var i = 0;
    if (this.prevCount[0] > 0) {
      prevHtmls.push('<div class="ts-section">');
      for (i = 0; i < 24 - this.prevCount[0]; i++) {
        (function () {
          prevHtmls.push('<span class="ts-blank"></span>');
        })();
      }
      for (i = 0; i < this.prevCount[0]; i++) {
        (function (time, index) {
          var activeClass = '';
          if (count === selected) {
            activeClass = ' active';
            selectedPageNo = 1;
          }
          prevHtmls.push('<span class="ts-item' + activeClass + '" id="ts_time_item_' + count + '">' + time + '</span>');
          count++;
        })(this.timeRange[i], i);
      }
      prevHtmls.push('</div>');
    }

    if (this.prevCount.length === 2) {
      for (var j = 0; j < this.prevCount[1]; j++) {
        prevHtmls.push('<div class="ts-section">');
        for (var k = 0; k < 24; k++ ) {
          (function (time, index) {
            var activeClass = '';
            if (index === selected) {
              console.log(selected);
              activeClass = ' active';
              selectedPageNo = j + (self.prevCount[0] > 0 ? 2 : 1);
            }
            prevHtmls.push('<span class="ts-item' + activeClass + '" id="ts_time_item_' + index + '">' + time + '</span>');
          })(this.timeRange[j * 24 + k + count], j * 24 + k + count);
        }
        prevHtmls.push('</div>');
      }
      count = j * 24 + count;
    }

    var leftCount = 1 + (this.prevCount[1] || 0) + (this.prevCount[0] > 0 ? 1 : 0);
    var centerHtmls = [];
    centerHtmls.push('<div class="ts-section">');
    for (i = count; i < count + 24; i++) {
      (function (time, index) {
        var activeClass = '';
        if (index === selected) {
          activeClass = ' active'
          selectedPageNo = leftCount;
        }
        centerHtmls.push('<span class="ts-item' + activeClass + '" id="ts_time_item_' + index + '">' + time + '</span>');
      })(this.timeRange[i], i);
    }
    count = i;
    centerHtmls.push('</div>');
    var nextHtmls = [];
    
    if (this.nextCount.length === 2) {
      for (var j = 0; j < this.nextCount[1]; j++) {
        nextHtmls.push('<div class="ts-section">');
        for (var k = 0; k < 24; k++ ) {
          (function (time, index) {
            var activeClass = '';
            if (index === selected) {
              activeClass = ' active';
              selectedPageNo = leftCount + j + 1;
            }
            nextHtmls.push('<span class="ts-item' + activeClass + '" id="ts_time_item_' + index + '">' + time + '</span>');
          })(this.timeRange[k + j * 24 + count], k + j * 24 + count);
        }
        nextHtmls.push('</div>');
      }
      count = j * 24 + count;
    }

    if (this.nextCount[0] > 0) {
      nextHtmls.push('<div class="ts-section">');
      for (i = 0; i < this.nextCount[0]; i++) {
        (function (time, index) {
          var activeClass = '';
          if (index === selected) {
            activeClass = ' active';
            selectedPageNo = leftCount + 1;
          }
          nextHtmls.push('<span class="ts-item' + activeClass + '" id="ts_time_item_' + index + '">' + time + '</span>');
        })(this.timeRange[i + count], i + count);
      }
      for (i = 0; i < 24 - this.nextCount[0]; i++) {
        (function () {
          nextHtmls.push('<span class="ts-blank"></span>');
        })();
      }
      nextHtmls.push('</div>');
    }

    box.innerHTML = [].concat(['<em class="ts-prev valid"></em><em class="ts-next valid"></em>'], prevHtmls, centerHtmls, nextHtmls).join('');
    if (selectedPageNo < 1) {
      selectedPageNo = leftCount;
    }
    console.log('-------- ', selectedPageNo);
    this.sectionlist = box.querySelectorAll('.ts-section');
    this.sectionlist[selectedPageNo - 1].className += ' active';
    
    this.selectedPageNo = selectedPageNo;

    this.prevBtn = box.querySelector('.ts-prev');
    this.nextBtn = box.querySelector('.ts-next');
    this.btnControl();

    var height = this.ele.offsetHeight;
    box.style.cssText = 'display:block;top:' + (pos.y + height) + 'px;left:' + pos.x + 'px';
  };

  TimeSelect.prototype.btnControl = function () {
    if (this.selectedPageNo === 1) {
      this.prevBtn.className = 'ts-prev';
    } else {
      if (this.sectionlist.length > 1) {
        this.prevBtn.className = 'ts-prev valid';
      } else {
        this.prevBtn.className = 'ts-prev';
      }
    }

    if (this.selectedPageNo >= this.sectionlist.length) {
      this.nextBtn.className = 'ts-next';
    } else {
      if (this.sectionlist.length > 1) {
        this.nextBtn.className = 'ts-next valid';
      } else {
        this.nextBtn.className = 'ts-next';
      }
    }
  };

  TimeSelect.prototype.indexOf = function () {
    var value = this.ele.value;
    if (!value) {
      return -1;
    }

    value = U.map(value.split(':'), function (item) {
      return format(item - 0);
    }).join(':');

    var selected = -1;
    U.each(this.timeRange, function (time, index) {
      if (time === value) {
        selected = index;
        return false;
      }
    });
    return selected;
  };

  TimeSelect.prototype.close = function () {
    this.opened = false;
  };

  TimeSelect.close = function () {
    box.innerHTML = '';
    box.style.display = 'none';
    activeObj = null;

    U.each(idList, function (key) {
      cache[key].close();
    });
  };

  function addTime(clock, step) {
    var delta_hour = Math.floor(step / 60);
    var delta_min = step % 60;

    return format(clock + delta_hour) + ':' + format(delta_min);
  }

  function format(num) {
    return num > 9 ? num : '0' + num;
  }

  var _ = function (selector) {
    var elements = doc.querySelectorAll(selector);
    var len = elements.length;
    // var cacheList = { ids: [] };

    U.each(elements, function (ele, index) {
      uuid += 10;
      var ts = new TimeSelect(ele);
      var key = 'ts_' + uuid.toString(16);
      idList.push(key);
      // cacheList.ids.push(key);
      cache[key] = ts;
    });
  };

  win.timeSelect = _;

  U.on(box, 'click', function (e) {
    e = window.event || e;
    var target = e.target;
    e.stopPropagation();
    if (target.tagName === 'SPAN' && target.className.indexOf('ts-item') > -1) {
      var index = target.id.split('_').pop();
      activeObj.ele.value = activeObj.timeRange[index];
      TimeSelect.close();
    } else if (target.tagName === 'EM') {
      if (target.className.indexOf('ts-next') > -1) {
        if (activeObj.sectionlist.length > activeObj.selectedPageNo) {
          activeObj.sectionlist[activeObj.selectedPageNo - 1].className = 'ts-section';
          activeObj.sectionlist[activeObj.selectedPageNo].className = 'ts-section active';
          activeObj.selectedPageNo += 1;
        }
        activeObj.btnControl();
      } else if (target.className.indexOf('ts-prev') > -1) {
        if (activeObj.selectedPageNo > 1) {
          activeObj.sectionlist[activeObj.selectedPageNo - 1].className = 'ts-section';
          activeObj.sectionlist[activeObj.selectedPageNo - 2].className = 'ts-section active';
          activeObj.selectedPageNo -= 1;
        }
        activeObj.btnControl();
      }
    }
  });

  U.on(document, 'click', function (e) {
    TimeSelect.close();
  });

})(window);