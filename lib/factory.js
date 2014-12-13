/**
 * Copyright (c) 2014 hjxenjoy - https://github.com/hjxenjoy/f2e
 */
;(function(root, factory) {

  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.DIY = factory(root);
    // factory(root);
  }

})(this, function(global, undefined) {

  var DIY = {};
  DIY.version = '0.0.1';
  return DIY;

  /*
  var $ = global.jQuery;
  $.fn.diy = function () {
    return this.each();
  };
  */
});