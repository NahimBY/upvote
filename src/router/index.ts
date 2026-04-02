import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/auth/LoginView.vue'
import RegisterView from '../views/auth/RegisterView.vue'
import PasswordRecoveryView from '../views/auth/PasswordRecoveryView.vue'
import ResetPasswordView from '../views/auth/ResetPasswordView.vue'

import OrganizatorDashboardView from '../views/organizator/DashboardView.vue'
import ManageRoomsView from '../views/organizator/ManageRoomsView.vue'
import CreateRoomView from '../views/organizator/CreateRoomView.vue'
import EditRoomView from '../views/organizator/EditRoomView.vue'

import DashboardView from '../views/voter/DashboardView.vue'
import VotingRoomView from '../views/voter/VotingRoomView.vue'
import LandingView from '../views/LandingView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView
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
      path: '/organizator',
      name: 'organizator-dashboard',
      component: OrganizatorDashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/organizator/rooms',
      name: 'organizator-rooms',
      component: ManageRoomsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/organizator/rooms/create',
      name: 'organizator-create-room',
      component: CreateRoomView,
      meta: { requiresAuth: true }
    },
    {
      path: '/organizator/rooms/edit/:id',
      name: 'organizator-edit-room',
      component: EditRoomView,
      meta: { requiresAuth: true }
    },
    {
      path: '/election/:id',
      name: 'election',
      component: VotingRoomView,
      meta: { requiresAuth: true }
    },
    {
      path: '/password-recovery',
      name: 'password-recovery',
      component: PasswordRecoveryView,
      meta: { requiresAuth: false }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPasswordView,
      meta: { requiresAuth: false }
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
    if (roles.includes('admin')) return 'admin'
    return roles.includes('organizator') ? 'organizator' : 'voter'
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
  } else if (isAuthenticated && (to.name === 'login' || to.name === 'register')) {
    if (userRole === 'organizator') {
      next({ path: '/organizator' })
    } else {
      next({ path: '/dashboard' })
    }
  } else {
    // Prevent voters from accessing organizator routes and vice-versa
    if (to.path.startsWith('/organizator') && userRole !== 'organizator' && isAuthenticated) {
      next({ path: '/dashboard' })
    } else if (to.path.startsWith('/dashboard') && userRole === 'organizator' && isAuthenticated) {
      next({ path: '/organizator' })
    } else {
      next()
    }
  }
})

export default router
