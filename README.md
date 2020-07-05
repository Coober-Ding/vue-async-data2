# vue-async-data
## Get Start

### Installation
```bash
npm i --save @zyyz/vue-async-data
```
### example
```java script
import AsyncDataMixin from '@zyyz/vue-async-data'
{
  name: 'app',
  mixins: [AsyncDataMixin],
  asyncData: {
    message: {// data name
      watch:['id'],// 监听某些状态，触发刷新
      init () {// 初始化data
        return ''
      },
      fetch () {// 异步拉取数据，需要返回一个Promise
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve('hello world')
          }, 1000)
        })
      },
      error (response) {
        
      }
    },
    otherSomeData: {
      init () {
        return 1
      },
      fetch () {
        return new Promise((resolve, reject) => {
          ..........
        })
      }
    }
  
  },
  data () {
    return {
      id: 0
    }
  },
  methods: {
    refresh () {// 强制刷新
      this.$async.fetch('message')
      this.$async.fetch('otherSomeData')
    },
    suspend () {
      this.$async.suspend()
    },
    resume () {
      this.$async.resume()
    }
  }
}
```

## Description
一个用来异步加载数据的vue插件，模仿了nuxt.js的aysncData。  
init和fetch这两个选项是必填的，fetch函数返回的必须是一个Promise对象。watch选项可以watch一个或多个data、prop或computed，其实就是利用了$watch()。  
请求数据的时机是activated和mounted这两个生命周期钩子。fetch和error中的this是当前的vm对象，和method一样。  
asyncData和data一样支持mixin。  
## details
延时刷新：  
异步数据的拉取和vue的render机制差不多，其内部存在一个队列。一个异步数据需要被拉取时，它会加入到队列中。队列会在nextTick中被执行，这样就实现了一个delay机制，防止在一个tick中重复刷新。    
队列控制：  
为了精准控制是否刷新，本插件提供了api，以便对队列进行控制。   
this.&#36;async.suspend() 可以将队列挂起，队列不会在nextTick中自动执行，即暂停了自动刷新机制   
this.&#36;async.resume() 结束挂起状态，恢复自动刷新机制，如果当前有挂起的队列，则立即执行队列    
this.&#36;async.clean() 可以清空队列   
强制刷新:   
this.&#36;async.fetch('dataName') 强制将一个异步数据加入到队列当中
## rollup
已经用rollup对src目录下的代码进行了打包，并用babel转译了一下。但是Promise等polyfill没有做处理。

## 源码构建
```bash
npm run build
```