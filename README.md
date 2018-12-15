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
    watch:['id'],// watch a data or prop to reload data
    init () {//a function to init the data
      return ''
    },
    fetch () {// a function to fetch data from remote,must return a promise object
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('hello world')
        }, 1000)
      })
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
  // all promise object will be resolved by Promise.all()
},
data () {
  return {
    id: 0
  }
}
```
##Description
一个用来异步加载数据的vue插件，模仿了nuxt.js的aysncData。
init和fetch这两个选项是必填的，fetch函数返回的必须是一个Promise对象。watch选项可以watch一个或多个data、prop或computed，其实就是利用了$watch()。
请求数据的时机是activated和mounted这两个生命周期钩子。
asyncData和data一样支持mixin。
所有的asyncData都被Promise.all处理，有一个失败就导致所有的asyncData不会被更新，一般一个页面也就一个asyncData。
##TODO
请求失败的异常处理还没做，问题不大。
##rollup
已经用rollup对src目录下的代码进行了打包，并用babel转译了一下。但是Promise等polyfill没有做处理，polyfill都是在项目中处理的。
##源码构建
```bash
npm run build
```