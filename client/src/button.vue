// Vue.component('button-counter', {
//   data: function () {
//     return {
//       count: 0
//     }
//   },
//   template: '<button v-on:click="count++">You clicked me {{ count }} times.</button>'
// })

<template>
    <button ref="mainButton" v-on:click="count++">You clicked me {{ count }} times.</button>
</template>

<script>
export default {
    data: () => {
        return {
            count: 0
        }
    },
    name: 'myButton'
}
</script>

<style>

</style>