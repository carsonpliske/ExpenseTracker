import { createRouter, createWebHistory } from 'vue-router'
import MainApp from '../components/MainApp.vue'
import QuickAdd from '../components/QuickAdd.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: MainApp
  },
  {
    path: '/quick-add',
    name: 'QuickAdd',
    component: QuickAdd
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router