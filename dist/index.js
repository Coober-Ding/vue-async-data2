!function(t,n){"object"==typeof exports&&"undefined"!=typeof module?module.exports=n(require("vue")):"function"==typeof define&&define.amd?define(["vue"],n):t.AsyncDataMixin=n(t.Vue)}(this,function(t){"use strict";function c(t){return null!==t&&"function"==typeof t}function r(t){return null!=t}function s(e,t){var n=e._asyncDataCtrl.quene;n.push(t),e._asyncDataCtrl.hasWaitQue||(e.$nextTick(function(){var t=n.slice(0);n.length=0,e._asyncDataCtrl.hasWaitQue=!1,t.forEach(function(n){var a=e.$options.asyncData[n];return a.fetch.call(e).then(function(t){e[n]=t},function(t){c(a.error)?a.error.call(e,t):window.console.warn("you got a error when fecth asyncData[".concat(n,"] from remote"))})})}),e._asyncDataCtrl.hasWaitQue=!0)}function u(t,n,a){r(t[n])?t[n]=a():t.$set(t,n,a())}function e(n,t){Object.keys(t).filter(function(t){return-1==n._asyncDataCtrl.quene.indexOf(t)}).forEach(function(t){s(n,t)})}function n(a,e){if(i=!0,Object.keys(o=e).forEach(function(t){var n=o[t];r(n)&&c(n.fetch)&&c(n.init)||(i=!1)}),!i)throw Error("async_data.err.options_volidate_fail");var o,i;a._asyncDataCtrl={hasWaitQue:!1,quene:[]},Object.keys(e).forEach(function(n){var t=e[n];c(t.init)&&u(a,n,t.init),r(t.watch)&&t.watch.forEach(function(t){a.$watch(t,function(){s(a,n)})})})}var a={beforeCreate:function(){var t,n,a,e;n=Object.keys((t=this).$options.asyncData),a=t.$options.data,e={},t.$options.data=function(){return n.forEach(function(t){e[t]=null}),Object.assign(a(),e)}},created:function(){var t=this.$options.asyncData;r(t)&&n(this,t)},activated:function(){var n,a,t=this.$options.asyncData;r(t)&&(n=this,Object.keys(a=t).forEach(function(t){u(n,t,a[t].init)}),n._asyncDataCtrl.hasClear=!0,e(this,t))},mounted:function(){var t=this.$options.asyncData;r(t)&&e(this,t)}},o=(t=t&&t.hasOwnProperty("default")?t.default:t).config.optionMergeStrategies;return o.asyncData=o.methods,a});
