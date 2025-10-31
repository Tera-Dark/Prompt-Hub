import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useAuth } from '@/composables/useAuth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('@/views/auth/AuthCallbackView.vue'),
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        redirect: { name: 'AdminDashboard' },
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/AdminDashboardView.vue'),
      },
      {
        path: 'prompts',
        name: 'AdminPrompts',
        component: () => import('@/views/admin/AdminPromptsListView.vue'),
      },
      {
        path: 'prompts/new',
        name: 'AdminPromptNew',
        component: () => import('@/views/admin/AdminPromptCreateView.vue'),
      },
      {
        path: 'prompts/:id/edit',
        name: 'AdminPromptEdit',
        component: () => import('@/views/admin/AdminPromptEditView.vue'),
        props: true,
      },
      {
        path: 'review',
        name: 'AdminReview',
        component: () => import('@/views/admin/AdminReviewView.vue'),
      },
      {
        path: 'data',
        name: 'AdminData',
        component: () => import('@/views/admin/AdminDataToolsView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

const auth = useAuth()

router.beforeEach((to) => {
  if (!auth.isReady.value) {
    auth.refreshFromStorage()
  }

  if (to.meta.requiresAuth) {
    if (!auth.isAuthed.value) {
      auth.setAttemptedRoute(to.fullPath)
      return true
    }

    if (!auth.hasRepoWriteAccess.value && to.name !== 'AdminDashboard') {
      return { name: 'AdminDashboard' }
    }
  }

  return true
})

export default router
