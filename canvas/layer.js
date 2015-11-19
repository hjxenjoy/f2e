var model = {

  /**
   * 可视
   * @type {Boolean}
   */
  visible: true,

  /**
   * 图层节点类型
   * 矩形、圆角矩形、半圆角矩形、菱形、平行四边形、线条（折线/直线）、曲线、文本
   * @type {Number}
   */
  mType: 1,

  /**
   * 描边
   * @type {Object}
   */
  stroke: {
    width: 1,
    color: 'rgba(0, 0, 0, 1)'
  },

  /**
   * 填充
   * @type {Object}
   */
  fill: {
    color: 'rgba(0, 0, 0, 1)',
    // 渐变颜色填充
    gradient: [{
      color: '#000',
      offset: 0 // 渐变颜色的开始百分比
    }, {
      color: '#f00',
      offset: 50,
    }, {
      color: '#fff',
      offset: 100
    }],
    totate: 90, // deg
  },

  /**
   * z轴高度，数值越大，距离用户越近
   * @type {Number}
   */
  z: 1,

  /**
   * 阴影
   * @type {Object}
   */
  shadow: {
    x: 0, // px
    y: 0, // px
    width: 1, // px
    blur: 1, // px
    color: 'rgba(0, 0, 0, 1)'
  },

  /**
   * 坐标位置
   * 矩形、椭圆记录中心点坐标
   * 箭头记录起始坐标
   * @type {Array}
   */
  position: [0, 0],

  /**
   * 文本类型时的文字内容
   * @type {String}
   */
  text: '',

  /**
   * 文字样式
   * @type {Object}
   */
  font: {
    size: 16,
    face: 'arial'
  },

  /**
   * 路径集合
   * @type {Array}
   */
  path: []


};

// 图层实体
function Layer() {

}

Layer.prototype = model;
Layer.prototype.constructor = Layer;

// 图层分组
function Group() {

}

Group.prototype = {
  constructor: Group,

  length: 2,

  '0': new Layer(),

  '1': new Layer()
};
