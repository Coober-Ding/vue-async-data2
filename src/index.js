import {isDef, isFunction} from './util.js'
import Vue from 'vue'
function addToQuene (vm, varName) {
  let quene = vm._asyncDataCtrl.quene
  if (quene.indexOf(varName) === -1) {
    quene.push(varName)
  }

  if (!vm._asyncDataCtrl.hasWaitQue) {
    //在下一个tick开始发起队列内的异步请求
    vm.$nextTick(() => {
      let queneCpy = quene.slice(0)
      quene.length = 0
      vm._asyncDataCtrl.hasWaitQue = false
      queneCpy.forEach((varName) => {
        let option = vm.$options.asyncData[varName]
        let promise =  option.fetch.call(vm)
        return promise.then((resp) => {
          // merge to data when success
          vm[varName] = resp
        }, (resp) => {
          // call error hook or log
          if (isFunction(option.error)) {
            option.error.call(vm, resp)
          } else {
            window.console.warn(`you got a error when fecth asyncData[${varName}] from remote`)
          }
        })
      })
    })
    vm._asyncDataCtrl.hasWaitQue = true
  }
}

function fetchVar (vm, varName) {
  addToQuene(vm, varName)
}

function initVar (vm, name, initFunc) {
  if (!isDef(vm[name])) {
    vm.$set(vm, name, initFunc())
  } else {
    vm[name] = initFunc()
  }
}

function fetchData (vm, options) {
  Object.keys(options)
  .forEach((varName) => {
    fetchVar(vm, varName)
  })
}

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
// 因为$set的限制，所以要预先添加根数据
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
// 初始化数据，添加watch
function initAsyncData (vm, options) {
  if (!validityOptions(options)) {
    throw new Error('async_data.err.options_volidate_fail')
  }
  // 添加控制器
  vm._asyncDataCtrl = {
    hasWaitQue: false,
    quene: []
  }
  // 添加$fetch，用来强制刷新数据
  vm.$fetch = function (varName) {
    fetchVar(this, varName)
  }
  
  let varNames = Object.keys(options)
  varNames.forEach((varName) => {
    let option = options[varName]
    // 初始化数据
    if (isFunction(option.init)) {
      initVar(vm, varName, option.init)
    }
    // 添加watch
    if (isDef(option.watch)) {
      option.watch.forEach((v) => {
        vm.$watch(v, () => {
          fetchVar(vm, varName)
        })
      })
    }
  })
}

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
      initAsyncData(this, options)
    }
  },
  
  activated () {
    if (isDef(this._asyncDataCtrl)) {
      let options = this.$options.asyncData
      fetchData(this, options)
    }
  },
  mounted () {
    if (isDef(this._asyncDataCtrl)) {
      let options = this.$options.asyncData
      fetchData(this, options)
    }
  }
}
// 自定义asyncData的合并策略
const strategies = Vue.config.optionMergeStrategies
strategies.asyncData = strategies.methods

export default AsyncDataMixin