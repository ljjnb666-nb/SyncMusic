import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home.vue'
import RoomView from '../views/Room.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/room/:roomId', name: 'room', component: RoomView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
