(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('vue')) :
  typeof define === 'function' && define.amd ? define(['vue'], factory) :
  (global.AsyncDataMixin = factory(global.Vue));
}(this, (function (Vue) { 'use strict';

  Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function isFunction(func) {
    return func !== null && typeof func === 'function';
  }
  function isDef(v) {
    return v !== undefined && v !== null;
  }

  var AsyncController =
  /*#__PURE__*/
  function () {
    function AsyncController(vm, options) {
      _classCallCheck(this, AsyncController);

      this.vm = vm;
      this.options = options;
      this._asyncDataCtrl = {
        hasWaitQue: false,
        suspend: false,
        queue: []
      };
    }

    _createClass(AsyncController, [{
      key: "init",
      value: function init() {
        var _this = this;

        var vm = this.vm;
        var options = this.options;
        var varNames = Object.keys(options);
        varNames.forEach(function (varName) {
          var option = options[varName]; // 初始化数据

          if (isFunction(option.init)) {
            _this.initVar(varName, option.init);
          } // 添加watch


          if (isDef(option.watch)) {
            option.watch.forEach(function (v) {
              vm.$watch(v, function () {
                _this.fetchVar(varName);
              }, {
                deep: true
              });
            });
          }
        });
      }
    }, {
      key: "initVar",
      value: function initVar(name, initFunc) {
        var vm = this.vm;

        if (!isDef(vm[name])) {
          vm.$set(vm, name, initFunc());
        } else {
          vm[name] = initFunc();
        }
      }
    }, {
      key: "addToQueue",
      value: function addToQueue(varName) {
        var queue = this._asyncDataCtrl.queue;

        if (queue.indexOf(varName) === -1) {
          queue.push(varName);
        }

        if (this._asyncDataCtrl.suspend) {
          return;
        }

        this.addDelayTask();
      }
    }, {
      key: "executeQueue",
      value: function executeQueue() {
        var vm = this.vm;
        var options = this.options;
        var queue = this._asyncDataCtrl.queue;

        if (queue.length == 0) {
          return;
        } // copy一下队列， 屏蔽在后面的执行过程中触发addToQueue(如果可能的话)引起的队列增长


        var queueCpy = queue.slice(0);
        queue.length = 0;
        queueCpy.forEach(function (varName) {
          var option = options[varName];
          var promise = option.fetch.call(vm); // 如果返回值为null

          if (promise == null) {
            return;
          } // 如果返回值不是Promise


          if (Object.getPrototypeOf(promise) !== Promise.prototype) {
            window.console.warn("the return value of fetch function is not a Promise project:varName=[".concat(varName, "]"));
            return;
          }

          var errorHandler = option.error;
          promise.then(function (resp) {
            // merge to data when success
            vm[varName] = resp;
          }, function (resp) {
            // call error hook or log
            if (isFunction(errorHandler)) {
              errorHandler.call(vm, resp);
            } else {
              window.console.warn("you got a error when fecth asyncData[".concat(varName, "] from remote"));
            }
          });
        });
      }
    }, {
      key: "addDelayTask",
      value: function addDelayTask() {
        var _this2 = this;

        // 在nextTick刷新数据
        if (!this._asyncDataCtrl.hasWaitQue) {
          //添加一个延时任务 在下一个tick开始发起队列内的异步请求
          var vm = this.vm;
          vm.$nextTick(function () {
            _this2._asyncDataCtrl.hasWaitQue = false;

            if (!_this2._asyncDataCtrl.suspend) {
              _this2.executeQueue();
            }
          });
          this._asyncDataCtrl.hasWaitQue = true;
        }
      }
    }, {
      key: "fetchVar",
      value: function fetchVar(varName) {
        this.addToQueue(varName);
      }
    }, {
      key: "fetchData",
      value: function fetchData() {
        var _this3 = this;

        var options = this.options;
        Object.keys(options).forEach(function (varName) {
          _this3.fetchVar(varName);
        });
      }
    }, {
      key: "fetch",
      value: function fetch(varName) {
        if (varName == null) {
          return this.fetchData();
        }

        this.fetchVar(varName);
      }
    }, {
      key: "suspend",
      value: function suspend() {
        this._asyncDataCtrl.suspend = true;
      }
    }, {
      key: "resume",
      value: function resume() {
        this._asyncDataCtrl.suspend = false;
        this.addDelayTask();
      }
    }, {
      key: "clean",
      value: function clean() {
        this._asyncDataCtrl.queue.length = 0;
      }
    }]);

    return AsyncController;
  }(); // 因为$set的限制，所以要改造$option.data 预先添加根数据


  function preSetAsyncData(vm, options) {
    var varNames = Object.keys(options);
    var _dataOption = vm.$options.data;
    var _preSetAsyncData = {};

    vm.$options.data = function proxyOption() {
      varNames.forEach(function (varName) {
        _preSetAsyncData[varName] = null;
      });
      return Object.assign(_dataOption.call(this), _preSetAsyncData);
    };
  } // 验证option


  function validityOptions(options) {
    var result = true;
    Object.keys(options).forEach(function (key) {
      var option = options[key];

      if (!isDef(option) || !isFunction(option.fetch) || !isFunction(option.init)) {
        result = false;
      }
    });
    return result;
  } // 构造


  function createAsyncData(vm, options) {
    if (!validityOptions(options)) {
      throw new Error('async_data.err.options_volidate_fail');
    } // 添加队列控制


    var async = new AsyncController(vm, options);
    return async;
  } // mixin


  var AsyncDataMixin = {
    beforeCreate: function beforeCreate() {
      var options = this.$options.asyncData;

      if (isDef(options) && Object.keys(options).length > 0) {
        preSetAsyncData(this, options);
      }
    },
    created: function created() {
      var options = this.$options.asyncData;

      if (isDef(options) && Object.keys(options).length > 0) {
        this.$async = createAsyncData(this, options);
        this.$async.init();
      }
    },
    activated: function activated() {
      if (isDef(this.$async)) {
        this.$async.fetchData();
      }
    },
    mounted: function mounted() {
      if (isDef(this.$async)) {
        this.$async.fetchData();
      }
    }
  }; // 自定义asyncData的合并策略

  var strategies = Vue.config.optionMergeStrategies;
  strategies.asyncData = strategies.methods;

  return AsyncDataMixin;

})));
