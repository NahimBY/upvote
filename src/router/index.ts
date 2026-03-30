import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/auth/LoginView.vue'
import RegisterView from '../views/auth/RegisterView.vue'
import DashboardView from '../views/dashboard/DashboardView.vue'

import AdminDashboardView from '../views/admin/DashboardView.vue'
import ManageRoomsView from '../views/admin/ManageRoomsView.vue'
import CreateRoomView from '../views/admin/CreateRoomView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: AdminDashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/rooms',
      name: 'admin-rooms',
      component: ManageRoomsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/rooms/create',
      name: 'admin-create-room',
      component: CreateRoomView,
      meta: { requiresAuth: true }
    }
  ],
})

function getUserRole(): string | null {
  const token = localStorage.getItem('accessToken')
  if (!token) return null

  try {
    const parts = token.split('.')
    const payloadBase64 = parts[1]
    if (!payloadBase64) return null
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
    const decodedJson = atob(base64)
    const payload = JSON.parse(decodedJson)
    const roles = payload.realm_access?.roles || []
    return roles.includes('admin') ? 'admin' : 'voter'
  } catch (error) {
    console.error('Error al decodificar el token:', error)
    return null
  }
}

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('accessToken')
  const isAuthenticated = !!token
  const userRole = getUserRole()

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' })
  } else if (isAuthenticated && (to.name === 'login' || to.name === 'register' || to.path === '/')) {
    if (userRole === 'admin') {
      next({ path: '/admin' })
    } else {
      next({ path: '/dashboard' })
    }
  } else {
    // Prevent voters from accessing admin routes and vice-versa
    if (to.path.startsWith('/admin') && userRole !== 'admin' && isAuthenticated) {
      next({ path: '/dashboard' })
    } else if (to.path.startsWith('/dashboard') && userRole === 'admin' && isAuthenticated) {
      next({ path: '/admin' })
    } else {
      next()
    }
  }
})

export default router
