import { createRouter, createWebHistory } from 'vue-router'
import ColorTest from '@/components/ColorTest.vue'
import ResultsView from '@/components/Results.vue'
import NotFound from '@/components/NotFound.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: ColorTest
  },
  {
    path: '/result/:id',
    name: 'Results',
    component: ResultsView,
    props: (route) => ({
      id: route.params.id
    })
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  console.log('Navigating to:', to.path, 'with params:', to.params)
  next()
})

router.afterEach((to) => {
  console.log('Navigation completed:', to.path)
})

export default router
