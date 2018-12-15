import {isDef, isFunction} from './util.js'
import Vue from 'vue'
function addToQuene (vm, varName) {
  let quene = vm._asyncDataCtrl.quene
  quene.push(varName)

  if (!vm._asyncDataCtrl.hasWaitQue) {
    //在下一个tick开始发起队列内的异步请求
    vm.$nextTick(() => {
      let queneCpy = quene.slice(0)
      quene.length = 0
      vm._asyncDataCtrl.hasWaitQue = false
      //等待已结束 开始执行
      vm.asyncDataLoading = true
      Promise.all(queneCpy.map((varName) => {
        let ps =  vm.$options.asyncData[varName].fetch.call(vm)
        return ps
      })).then((values) => {
        vm.asyncDataLoading = false
        for (var i = 0;i < queneCpy.length;i++) {
          let name = queneCpy[i]
          let value = values[i]
          vm[name] = value
        }
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

function clearData (vm, options) {
  let varNames = Object.keys(options)
  varNames.forEach((varName) => {
    let option = options[varName]
    initVar(vm, varName, option.init)
  })
  vm._asyncDataCtrl.hasClear = true
}

function fetchData (vm, options) {
  Object.keys(options)
  .filter((varName) => {
    return vm._asyncDataCtrl.quene.indexOf(varName) === -1
  }).forEach((varName) => {
    addToQuene(vm, varName)
  })
}

function validityOptions (options) {
  let result = true
  Object.keys(options).forEach((key) => {
    let option = options[key]
    if (!isDef(option) || !isFunction(option.fetch)) {
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
  data () {
    return {
      asyncDataLoading: false
    }
  },
  beforeCreate () {
    let options = this.$options.asyncData
    preSetAsyncData(this, options)
  },
  created () {
    let options = this.$options.asyncData
    if (isDef(options)) {
      initAsyncData(this, options)
    }
  },
  
  activated () {
    let options = this.$options.asyncData
    if (isDef(options)) {
      clearData(this, options)
      fetchData(this, options)
    }
  },
  mounted () {
    let options = this.$options.asyncData
    if (isDef(options)) {
      fetchData(this, options)
    }
  }
}
// 自定义asyncData的合并策略
const strategies = Vue.config.optionMergeStrategies
strategies.asyncData = strategies.methods

export default AsyncDataMixin