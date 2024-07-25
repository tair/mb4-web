import 'bootstrap/dist/css/bootstrap.css'

import '@fortawesome/fontawesome-free/css/all.min.css'
import '@fortawesome/fontawesome-free/js/all.min.js'

import VueTippy from 'vue-tippy'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light.css'

import './assets/global.css'

import App from './App.vue'
import { createApp } from 'vue'
const app = createApp(App)

import { createPinia } from 'pinia'
app.use(createPinia())

import router from './router'
app.use(router)

app.use(VueTippy, {
  defaultProps: {
    placement: 'bottom-end',
    hideOnClick: false,
    arrow: true,
    theme: 'light',
    maxWidth: 500,
  },
})

app.mount('#app')
