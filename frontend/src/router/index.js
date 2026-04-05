import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home.vue'
import RoomView from '../views/Room.vue'
import FavoritesView from '../views/Favorites.vue'
import HistoryView from '../views/History.vue'
import PlaylistView from '../views/Playlist.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/search', name: 'search', component: () => import('../views/Search.vue') },
  { path: '/favorites', name: 'favorites', component: FavoritesView },
  { path: '/history', name: 'history', component: HistoryView },
  { path: '/playlist', name: 'playlist', component: PlaylistView },
  { path: '/downloads', name: 'downloads', component: () => import('../views/Downloads.vue') },
  { path: '/room/:roomId', name: 'room', component: RoomView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
