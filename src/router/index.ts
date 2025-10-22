import { createRouter, createWebHistory } from 'vue-router'
import CardsView from '@/views/CardsView.vue'
import CodemirrorEditor from '@/views/CodemirrorEditor.vue'
import HomePage from '@/views/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: `/`,
      name: `home`,
      component: HomePage,
    },
    {
      path: `/editor`,
      name: `editor`,
      component: CodemirrorEditor,
    },
    {
      path: `/notes`,
      name: `notes`,
      component: CardsView,
    },
    // 404 重定向到首页
    {
      path: `/:pathMatch(.*)*`,
      redirect: `/`,
    },
  ],
})

export default router
