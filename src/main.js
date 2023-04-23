import 'bootstrap/dist/css/bootstrap.css'
import bootstrap from 'bootstrap/dist/js/bootstrap.js'

import '@fortawesome/fontawesome-free/css/all.min.css'
import '@fortawesome/fontawesome-free/js/all.min.js'

import 'bootstrap-icons/font/bootstrap-icons.css'

import App from './App.vue'
import { createApp } from 'vue'
const app = createApp(App)

import { createPinia } from 'pinia'
app.use(createPinia())

import router from './router'
app.use(router)

app.mount('#app')

app.directive('tooltip', (el, binding) => {
  const tooltip = new bootstrap.Tooltip(el, {
    title: binding.value,
    placement: binding.arg,
    trigger: 'hover',
    delay: { show: 300, hide: 150 },
  })
  el.addEventListener('click', () => {
    tooltip.hide()
  })
})
