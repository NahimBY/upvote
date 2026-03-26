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
      component: DashboardView
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: AdminDashboardView
    },
    {
      path: '/admin/rooms',
      name: 'admin-rooms',
      component: ManageRoomsView
    },
    {
      path: '/admin/rooms/create',
      name: 'admin-create-room',
      component: CreateRoomView
    }
  ],
})

export default router
