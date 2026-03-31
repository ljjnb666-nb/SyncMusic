import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

import Home from './views/Home.vue'
import Login from './views/Login.vue'
import Playlist from './views/Playlist.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    { path: '/playlist', component: Playlist }
  ]
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
