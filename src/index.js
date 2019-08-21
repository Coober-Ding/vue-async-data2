import {isDef, isFunction} from './util.js'
import Vue from 'vue'

// 队列控制器
class AsyncController {
  constructor (vm, options) {
    this.vm = vm
    this.options = options
    this._asyncDataCtrl = {
      hasWaitQue: false,
      suspend: false,
      queue: []
    }
  }
  init () {
    let vm = this.vm
    let options = this.options
    let varNames = Object.keys(options)
    varNames.forEach((varName) => {
      let option = options[varName]
      // 初始化数据
      if (isFunction(option.init)) {
        this.initVar(varName, option.init)
      }
      // 添加watch
      if (isDef(option.watch)) {
        option.watch.forEach((v) => {
          vm.$watch(v, () => {
            this.fetchVar(varName)
          }, {
            deep: true
          })
        })
      }
    })
  }

  initVar (name, initFunc) {
    let vm = this.vm
    if (!isDef(vm[name])) {
      vm.$set(vm, name, initFunc())
    } else {
      vm[name] = initFunc()
    }
  }

  addToQueue (varName) {
    let queue = this._asyncDataCtrl.queue

    if (queue.indexOf(varName) === -1) {
      queue.push(varName)
    }
    if (this._asyncDataCtrl.suspend) {
      return
    }
    this.addDelayTask()
  }
  executeQueue () {
    let vm = this.vm
    let options = this.options
    let queue = this._asyncDataCtrl.queue
    if (queue.length == 0) {
      return
    }
    // copy一下队列， 屏蔽在后面的执行过程中触发addToQueue(如果可能的话)引起的队列增长
    let queueCpy = queue.slice(0)
    queue.length = 0
    queueCpy.forEach((varName) => {
      let option = options[varName]
      let promise =  option.fetch.call(vm)
      // 如果返回值为null
      if (promise == null) {
        return
      }
      // 如果返回值不是Promise
      if (Object.getPrototypeOf(promise) !== Promise.prototype) {
        window.console.warn(`the return value of fetch function is not a Promise project:varName=[${varName}]`)
        return
      }
      let errorHandler = option.error
      promise.then((resp) => {
        // merge to data when success
        vm[varName] = resp
      }, (resp) => {
        // call error hook or log
        if (isFunction(errorHandler)) {
          errorHandler.call(vm, resp)
        } else {
          window.console.warn(`you got a error when fecth asyncData[${varName}] from remote`)
        }
      })
    })
  }

  addDelayTask () {
    // 在nextTick刷新数据
    if (!this._asyncDataCtrl.hasWaitQue) {
      //添加一个延时任务 在下一个tick开始发起队列内的异步请求
      let vm = this.vm
      vm.$nextTick(() => {
        this._asyncDataCtrl.hasWaitQue = false
        if (!this._asyncDataCtrl.suspend) {
          this.executeQueue()
        }
      })
      this._asyncDataCtrl.hasWaitQue = true
    }
  }

  fetchVar (varName) {
    this.addToQueue(varName)
  }

  fetchData () {
    let options = this.options
    Object.keys(options)
    .forEach((varName) => {
      this.fetchVar(varName)
    })
  }
  fetch (varName) {
    this.fetchVar(varName)
  }
  suspend () {
    this._asyncDataCtrl.suspend = true
  }
  resume () {
    this._asyncDataCtrl.suspend = false
    this.addDelayTask()
  }
  clean () {
    this._asyncDataCtrl.queue.length = 0;
  }
}
// 因为$set的限制，所以要改造$option.data 预先添加根数据
function preSetAsyncData (vm, options) {
  let varNames = Object.keys(options)
  let _dataOption = vm.$options.data
  let _preSetAsyncData = {}
  vm.$options.data = function proxyOption () {
    varNames.forEach((varName) => {
      _preSetAsyncData[varName] = null
    })
    return Object.assign(_dataOption(), _preSetAsyncData)
  }
}
// 验证option
function validityOptions (options) {
  let result = true
  Object.keys(options).forEach((key) => {
    let option = options[key]
    if (!isDef(option) || !isFunction(option.fetch) || !isFunction(option.init)) {
      result = false
    }
  })
  return result
}
// 构造
function createAsyncData (vm, options) {
  if (!validityOptions(options)) {
    throw new Error('async_data.err.options_volidate_fail')
  }
  // 添加队列控制
  var async = new AsyncController(vm, options)
  return async
}

// mixin
var AsyncDataMixin = {
  beforeCreate () {
    let options = this.$options.asyncData
    if (isDef(options) && Object.keys(options).length > 0) {
      preSetAsyncData(this, options)
    }
  },
  created () {
    let options = this.$options.asyncData
    if (isDef(options) && Object.keys(options).length > 0) {
      this.$async = createAsyncData(this, options)
      this.$async.init()
    }
  },
  
  activated () {
    if (isDef(this.$async)) {
      this.$async.fetchData()
    }
  },
  mounted () {
    if (isDef(this.$async)) {
      this.$async.fetchData()
    }
  }
}
// 自定义asyncData的合并策略
const strategies = Vue.config.optionMergeStrategies
strategies.asyncData = strategies.methods

export default AsyncDataMixin