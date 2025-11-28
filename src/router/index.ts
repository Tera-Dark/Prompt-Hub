import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { useAuth } from '@/composables/useAuth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('@/views/auth/AuthCallbackView.vue'),
  },
  {
    path: '/admin',
    component: DashboardLayout,
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
      {
        path: 'profile',
        name: 'AdminProfile',
        component: () => import('@/views/admin/AdminProfileView.vue'),
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/admin/AdminSettingsView.vue'),
      },
      {
        path: 'ai-settings',
        name: 'AdminAISettings',
        component: () => import('@/views/admin/AdminAISettingsView.vue'),
      },
    ],
  },
  {
    path: '/prompts/new',
    name: 'PromptNew',
    component: () => import('@/views/admin/AdminPromptCreateView.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'UserDashboard',
        component: () => import('@/views/user/UserDashboardView.vue'),
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
      return { name: 'Login' }
    }

    // Check if trying to access admin routes without write access
    if (to.path.startsWith('/admin') && !auth.hasRepoWriteAccess.value) {
      // Regular users should be redirected to UserDashboard
      return { name: 'UserDashboard' }
    }
  }

  // Redirect logged in users from login page based on their role
  if (to.name === 'Login' && auth.isAuthed.value) {
    if (auth.hasRepoWriteAccess.value) {
      return { name: 'AdminDashboard' }
    } else {
      return { name: 'UserDashboard' }
    }
  }

  return true
})

export default router
