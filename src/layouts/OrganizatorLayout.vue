<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  Menu,
  X,
  LogOut,
  CheckCircle2,
  ChartBar,
} from 'lucide-vue-next'

const isMobileMenuOpen = ref(false)
const route = useRoute()
const router = useRouter()

const navigation = [
  { name: 'Dashboard', href: '/organizator', icon: LayoutDashboard },
  { name: 'Salas de Votación', href: '/organizator/rooms', icon: Building2 },
  { name: 'Estadísticas', href: '/organizator/statistics', icon: ChartBar },
  { name: 'Configuración', href: '/organizator/settings', icon: Settings },
]

const userName = ref('Usuario')

onMounted(() => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1]
      if (!payloadBase64) throw new Error('Invalid token format')
      
      const payloadDecoded = decodeURIComponent(atob(payloadBase64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(payloadDecoded);
      userName.value = payload.name || payload.given_name || payload.preferred_username || 'Usuario';
    } catch (error) {
      console.error('Error al decodificar el token', error);
      userName.value = 'Usuario';
    }
  }
});

const handleLogout = () => {
  localStorage.removeItem('accessToken')
  router.push('/login')
}
</script>

<template>
  <div class="h-screen bg-slate-50 flex overflow-hidden font-sans">
    <!-- Mobile sidebar backdrop -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-40 bg-slate-900/80 w-full h-full backdrop-blur-sm lg:hidden transition-opacity"
      @click="isMobileMenuOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        'fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:w-72 flex-col h-full shadow-xl',
      ]"
    >
      <div
        class="flex items-center justify-between h-16 px-6 bg-slate-950 border-b border-slate-800"
      >
        <div class="flex items-center space-x-2">
          <span
            class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-900 shadow-md"
          >
            <CheckCircle2 class="w-5 h-5" stroke-width="3" />
          </span>
          <span class="text-xl font-bold text-white tracking-tight"
            >UpVote <span class="text-emerald-400">Organizator</span></span
          >
        </div>
        <button
          @click="isMobileMenuOpen = false"
          class="lg:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 focus:outline-none"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto w-full">
        <RouterLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          @click="isMobileMenuOpen = false"
          class="flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors group w-full"
          :class="[
            route.path === item.href || (item.href !== '/organizator' && route.path.startsWith(item.href))
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white',
          ]"
        >
          <component
            :is="item.icon"
            class="w-5 h-5 mr-3 flex-shrink-0 transition-colors"
            :class="
              route.path === item.href ||
              (item.href !== '/organizator' && route.path.startsWith(item.href))
                ? 'text-emerald-200'
                : 'text-slate-400 group-hover:text-white'
            "
          />
          {{ item.name }}
        </RouterLink>
      </nav>

      <div class="p-4 border-t border-slate-800 shrink-0">
        <button
          class="flex items-center w-full px-3 py-2.5 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-red-400 transition-colors"
          @click="handleLogout"
        >
          <LogOut class="w-5 h-5 mr-3 text-slate-400 group-hover:text-red-400 transition-colors" />
          Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
      <!-- Mobile Header -->
      <header
        class="lg:hidden shrink-0 flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 shadow-sm z-30"
      >
        <button
          @click="isMobileMenuOpen = true"
          class="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-md transition-colors"
        >
          <Menu class="w-6 h-6" />
        </button>
        <div class="flex items-center space-x-2">
          <CheckSquare class="w-6 h-6 text-emerald-600" />
          <span class="text-lg font-bold text-slate-900 tracking-tight">UpVote</span>
        </div>
        <div
          class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shadow-sm ring-2 ring-emerald-50"
        >
          A
        </div>
      </header>

      <!-- Desktop Header (Optional, useful for breadcrumbs or user profile) -->
      <header
        class="hidden lg:flex shrink-0 items-center justify-between h-16 px-8 bg-white border-b border-slate-200 z-30"
      >
        <div class="flex items-center text-sm text-slate-500 font-medium">
          <!-- Optional breadcrumbs could go here -->
          <!-- Gestión Organizativa -->
        </div>
        <div class="flex items-center space-x-4">
          <div class="text-sm font-medium text-slate-700">{{ userName }}</div>
          <div
            class="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-4 ring-emerald-50 cursor-pointer hover:bg-emerald-700 transition-colors"
          >
            {{ userName.charAt(0).toUpperCase() }}
          </div>
        </div>
      </header>

      <!-- Main Slot Area -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 lg:p-8 w-full">
        <slot />
      </main>
    </div>
  </div>
</template>
