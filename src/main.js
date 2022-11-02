import 'bootstrap/dist/css/bootstrap.css'
// import "@/assets/css/main.min.css";
import 'bootstrap/dist/js/bootstrap.js'

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
