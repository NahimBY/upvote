<script setup lang="ts">
import AdminLayout from '../../layouts/AdminLayout.vue'
import { Shield, Users, UserCheck, UserX } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import { apiFetch } from '../../utils/apiFetch'

const stats = ref({
  totalUsers: 0,
  admins: 0,
  organizators: 0,
  voters: 0,
  activeUsers: 0,
  inactiveUsers: 0,
  recentUsers: [] as any[],
})

const loading = ref(true)

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  organizator: 'Organizador',
  voter: 'Votante',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-violet-100 text-violet-800',
  organizator: 'bg-emerald-100 text-emerald-800',
  voter: 'bg-sky-100 text-sky-800',
}

const fetchStats = async () => {
  try {
    const res = await apiFetch('/api/admin/stats')
    if (res.ok) {
      const result = await res.json()
      stats.value = result.data
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

onMounted(fetchStats)
</script>

<template>
  <AdminLayout>
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Panel de Administración</h1>
        <p class="mt-1 text-sm text-slate-500">
          Resumen general de usuarios y roles en la plataforma.
        </p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div class="p-3 rounded-xl bg-violet-50 text-violet-600">
              <Users class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <p class="text-3xl font-bold text-slate-900 tracking-tight">{{ loading ? '...' : stats.totalUsers }}</p>
            <p class="text-sm font-medium text-slate-500 mt-1">Total de Usuarios</p>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div class="p-3 rounded-xl bg-violet-50 text-violet-600">
              <Shield class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <p class="text-3xl font-bold text-slate-900 tracking-tight">{{ loading ? '...' : stats.admins }}</p>
            <p class="text-sm font-medium text-slate-500 mt-1">Administradores</p>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div class="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <p class="text-3xl font-bold text-slate-900 tracking-tight">{{ loading ? '...' : stats.organizators }}</p>
            <p class="text-sm font-medium text-slate-500 mt-1">Organizadores</p>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div class="p-3 rounded-xl bg-sky-50 text-sky-600">
              <Users class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <p class="text-3xl font-bold text-slate-900 tracking-tight">{{ loading ? '...' : stats.voters }}</p>
            <p class="text-sm font-medium text-slate-500 mt-1">Votantes</p>
          </div>
        </div>
      </div>

      <!-- Role Distribution + Recent Users -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Distribution -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 class="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4 mb-4">
            Distribución por Rol
          </h3>
          <div v-if="loading" class="text-sm text-slate-400">Cargando...</div>
          <div v-else class="space-y-4">
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="font-medium text-slate-700">Administradores</span>
                <span class="text-slate-500">{{ stats.admins }}</span>
              </div>
              <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-violet-500 rounded-full transition-all"
                  :style="{ width: stats.totalUsers ? `${(stats.admins / stats.totalUsers) * 100}%` : '0%' }"
                ></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="font-medium text-slate-700">Organizadores</span>
                <span class="text-slate-500">{{ stats.organizators }}</span>
              </div>
              <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-emerald-500 rounded-full transition-all"
                  :style="{ width: stats.totalUsers ? `${(stats.organizators / stats.totalUsers) * 100}%` : '0%' }"
                ></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="font-medium text-slate-700">Votantes</span>
                <span class="text-slate-500">{{ stats.voters }}</span>
              </div>
              <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-sky-500 rounded-full transition-all"
                  :style="{ width: stats.totalUsers ? `${(stats.voters / stats.totalUsers) * 100}%` : '0%' }"
                ></div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100 flex justify-between text-sm">
              <span class="text-slate-500">Activos</span>
              <span class="font-medium text-emerald-600">{{ stats.activeUsers }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Inactivos</span>
              <span class="font-medium text-rose-600">{{ stats.inactiveUsers }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Users -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
          <h3 class="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4 mb-4">
            Usuarios Recientes
          </h3>
          <div v-if="loading" class="text-sm text-slate-400">Cargando...</div>
          <div v-else-if="stats.recentUsers.length === 0" class="text-sm text-slate-400 text-center py-8">
            No hay usuarios registrados.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-slate-500 border-b border-slate-100">
                  <th class="pb-3 font-medium">Usuario</th>
                  <th class="pb-3 font-medium">Email</th>
                  <th class="pb-3 font-medium">Rol</th>
                  <th class="pb-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="user in stats.recentUsers"
                  :key="user.keycloakId"
                  class="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td class="py-3">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                        {{ (user.firstName?.[0] || '').toUpperCase() }}{{ (user.lastName?.[0] || '').toUpperCase() }}
                      </div>
                      <div>
                        <p class="font-medium text-slate-900">{{ user.firstName }} {{ user.lastName }}</p>
                        <p class="text-xs text-slate-400">@{{ user.username }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 text-slate-600">{{ user.email }}</td>
                  <td class="py-3">
                    <span
                      class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-600'"
                    >
                      {{ ROLE_LABELS[user.role] || user.role }}
                    </span>
                  </td>
                  <td class="py-3 text-slate-500">{{ formatDate(user.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
