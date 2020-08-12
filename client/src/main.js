import Vue from 'vue'
// import App from './App.vue'

Vue.config.productionTip = false



// new Vue({
//   render: h => h(App),
// }).$mount('#app')

import myButton from './button.vue'


new Vue({
  render: h => h(myButton)
}).$mount('#app')


// console.log(vs)


