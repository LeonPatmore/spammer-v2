import Vue from 'vue';
// import App from './App.vue'

Vue.config.productionTip = false;

import myButton from './button.vue';

new Vue({
    render: h => h(myButton),
}).$mount('#app');
