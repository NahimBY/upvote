<script setup lang="ts">
import AdminLayout from '../../layouts/AdminLayout.vue'
import {
  Users,
  Shield,
  UserCheck,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  EyeOff,
} from 'lucide-vue-next'
import { ref, computed, watch, onMounted } from 'vue'
import { apiFetch } from '../../utils/apiFetch'

interface User {
  keycloakId: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  createdAt: string
}

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

const tabs = [
  { key: '', label: 'Todos', icon: Users },
  { key: 'admin', label: 'Admins', icon: Shield },
  { key: 'organizator', label: 'Organizadores', icon: UserCheck },
  { key: 'voter', label: 'Votantes', icon: Users },
]

const activeTab = ref('')
const searchQuery = ref('')
const users = ref<User[]>([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)

// Create user modal
const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref('')
const createForm = ref({
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  role: 'organizator' as 'admin' | 'organizator',
})
const showPassword = ref(false)

// Role change
const changingRole = ref<string | null>(null)

const fetchUsers = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', page.value.toString())
    params.set('limit', '15')
    if (activeTab.value) params.set('role', activeTab.value)
    if (searchQuery.value.trim()) params.set('search', searchQuery.value.trim())

    const res = await apiFetch(`/api/admin/users?${params.toString()}`)
    if (res.ok) {
      const result = await res.json()
      users.value = result.data.users
      totalPages.value = result.data.totalPages
      total.value = result.data.total
    }
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loading.value = false
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    fetchUsers()
  }, 300)
})

watch(activeTab, () => {
  page.value = 1
  fetchUsers()
})

const handleCreateUser = async () => {
  createError.value = ''
  creating.value = true
  try {
    const res = await apiFetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm.value),
    })
    const result = await res.json()
    if (!res.ok) {
      createError.value = result.message || 'Error al crear usuario'
      return
    }
    showCreateModal.value = false
    createForm.value = { email: '', firstName: '', lastName: '', password: '', role: 'organizator' }
    fetchUsers()
  } catch (error) {
    createError.value = 'Error de conexión'
  } finally {
    creating.value = false
  }
}

const handleRoleChange = async (user: User, newRole: string) => {
  if (changingRole.value) return
  changingRole.value = user.keycloakId
  try {
    const res = await apiFetch(`/api/admin/users/${user.keycloakId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) {
      user.role = newRole
    } else {
      const result = await res.json()
      alert(result.message || 'Error al cambiar rol')
    }
  } catch (error) {
    alert('Error de conexión')
  } finally {
    changingRole.value = null
  }
}

const handleToggleActive = async (user: User) => {
  try {
    const res = await apiFetch(`/api/admin/users/${user.keycloakId}/active`, {
      method: 'PATCH',
    })
    if (res.ok) {
      user.isActive = !user.isActive
    } else {
      const result = await res.json()
      alert(result.message || 'Error al cambiar estado')
    }
  } catch (error) {
    alert('Error de conexión')
  }
}

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

onMounted(fetchUsers)
</script>

<template>
  <AdminLayout>
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Usuarios</h1>
          <p class="mt-1 text-sm text-slate-500">
            Administra los usuarios, roles y permisos de la plataforma.
          </p>
        </div>
        <div class="mt-4 md:mt-0">
          <button
            class="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors shadow-sm"
            @click="showCreateModal = true"
          >
            <Plus class="w-4 h-4 mr-2" />
            Crear Usuario
          </button>
        </div>
      </div>

      <!-- Tabs + Search -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <!-- Tabs -->
          <div class="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              :class="activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
              @click="activeTab = tab.key"
            >
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </button>
          </div>

          <!-- Search -->
          <div class="relative flex-1 max-w-xs ml-auto">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar usuario..."
              class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-slate-500 border-b border-slate-100">
                <th class="px-6 py-3 font-medium">Usuario</th>
                <th class="px-6 py-3 font-medium">Email</th>
                <th class="px-6 py-3 font-medium">Rol</th>
                <th class="px-6 py-3 font-medium">Estado</th>
                <th class="px-6 py-3 font-medium">Registro</th>
                <th class="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6" class="px-6 py-12 text-center text-slate-400">Cargando usuarios...</td>
              </tr>
              <tr v-else-if="users.length === 0">
                <td colspan="6" class="px-6 py-12 text-center text-slate-400">No se encontraron usuarios.</td>
              </tr>
              <tr
                v-for="user in users"
                :key="user.keycloakId"
                class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs"
                      :class="user.isActive ? 'bg-slate-200 text-slate-600' : 'bg-rose-100 text-rose-500'"
                    >
                      {{ (user.firstName?.[0] || '').toUpperCase() }}{{ (user.lastName?.[0] || '').toUpperCase() }}
                    </div>
                    <div>
                      <p class="font-medium text-slate-900">{{ user.firstName }} {{ user.lastName }}</p>
                      <p class="text-xs text-slate-400">@{{ user.username }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-slate-600">{{ user.email }}</td>
                <td class="px-6 py-4">
                  <select
                    v-if="user.role !== 'voter'"
                    :value="user.role"
                    :disabled="changingRole === user.keycloakId"
                    class="text-xs font-medium px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
                    :class="ROLE_COLORS[user.role]"
                    @change="handleRoleChange(user, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="admin">Administrador</option>
                    <option value="organizator">Organizador</option>
                  </select>
                  <span
                    v-else
                    class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="ROLE_COLORS[user.role]"
                  >
                    {{ ROLE_LABELS[user.role] }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
                  >
                    {{ user.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-slate-500">{{ formatDate(user.createdAt) }}</td>
                <td class="px-6 py-4 text-right">
                  <button
                    class="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    :class="user.isActive ? 'text-slate-400 hover:text-rose-600' : 'text-slate-400 hover:text-emerald-600'"
                    :title="user.isActive ? 'Desactivar' : 'Activar'"
                    @click="handleToggleActive(user)"
                  >
                    <EyeOff v-if="user.isActive" class="w-4 h-4" />
                    <Eye v-else class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <p class="text-sm text-slate-500">
            {{ total }} usuario{{ total !== 1 ? 's' : '' }} en total
          </p>
          <div class="flex items-center gap-2">
            <button
              :disabled="page <= 1"
              class="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              @click="page--; fetchUsers()"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <span class="text-sm text-slate-600 font-medium px-2">{{ page }} / {{ totalPages || 1 }}</span>
            <button
              :disabled="page >= totalPages"
              class="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              @click="page++; fetchUsers()"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create User Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" @click="showCreateModal = false"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 z-10">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-slate-900">Crear Usuario</h2>
            <button
              class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              @click="showCreateModal = false"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="handleCreateUser" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  v-model="createForm.firstName"
                  type="text"
                  required
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
                <input
                  v-model="createForm.lastName"
                  type="text"
                  required
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                v-model="createForm.email"
                type="email"
                required
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div class="relative">
                <input
                  v-model="createForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  minlength="6"
                  class="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  @click="showPassword = !showPassword"
                >
                  <Eye v-if="!showPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Rol</label>
              <select
                v-model="createForm.role"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="organizator">Organizador</option>
                <option value="admin">Administrador</option>
              </select>
              <p class="mt-1 text-xs text-slate-400">Los votantes se registran desde la app.</p>
            </div>

            <div v-if="createError" class="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
              {{ createError }}
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                class="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                @click="showCreateModal = false"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="creating"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {{ creating ? 'Creando...' : 'Crear Usuario' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>
