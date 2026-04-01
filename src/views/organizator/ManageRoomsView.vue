<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import OrganizatorLayout from '../../layouts/OrganizatorLayout.vue'
import { apiFetch } from '../../utils/apiFetch'
import {
  Search,
  Filter,
  Plus,
  Edit2,
  BarChart2,
  Trash2,
  Building2,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  PlayCircle,
  StopCircle,
  Archive,
} from 'lucide-vue-next'
import DeleteRoomCard from '../../components/organizator/rooms/DeleteRoomCard.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

interface Election {
  _id: string
  title: string
  status: string
  participation?: number
  totalVoters?: number
  [key: string]: any
}

const rooms = ref<Election[]>([])

const fetchElections = async () => {
  try {
    const response = await apiFetch('/api/organizator/elections', {
      cache: 'no-store',
    })
    const parsed = await response.json()
    rooms.value = parsed.data || []
  } catch (error) {
    console.error('Error fetching elections:', error)
  }
}

const showDeleteModal = ref(false)
const roomToDelete = ref('')

const promptDelete = (id: string) => {
  roomToDelete.value = id
  showDeleteModal.value = true
}

const editRoom = (id: string) => {
  router.push(`/organizator/rooms/edit/${id}`)
}

const handleRoomDeleted = (id: string) => {
  rooms.value = rooms.value.filter((r) => r._id !== id)
  showDeleteModal.value = false
  roomToDelete.value = ''
}

fetchElections()

const searchQuery = ref('')
const statusFilter = ref('Todas')

const filteredRooms = computed(() => {
  return rooms.value.filter((room) => {
    const title = room.title || ''
    const matchesSearch = title.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'Todas' || room.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const formatStatus = (status: string) => {
  switch (status) {
    case 'draft':
      return 'Borrador'
    case 'published':
      return 'Publicada'
    case 'open':
      return 'Abierta'
    case 'closed':
      return 'Cerrada'
    case 'archived':
      return 'Archivada'
    default:
      return status
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'closed':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'draft':
      return 'bg-slate-100 text-slate-800 border-slate-200'
    case 'published':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'archived':
      return 'bg-gray-200 text-gray-800 border-gray-300'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

// Gestión de Menú Desplegable con Teleport
const openDropdownId = ref<string | null>(null)
const dropdownStyles = ref({ top: '0px', right: '0px' })

const toggleDropdown = (id: string, event: MouseEvent) => {
  if (openDropdownId.value === id) {
    openDropdownId.value = null
    return
  }

  openDropdownId.value = id
  const btn = event.currentTarget as HTMLElement
  const rect = btn.getBoundingClientRect()

  // Calcular posición FIJA relativa al viewport
  dropdownStyles.value = {
    top: `${rect.bottom + 8}px`,
    right: `${window.innerWidth - rect.right}px`,
  }
}

const closeDropdowns = (e: Event) => {
  const target = e.target as HTMLElement
  if (!target.closest('.action-menu-container')) {
    openDropdownId.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdowns)
  fetchElections()
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns)
})

const updateStatus = async (id: string, newStatus: string) => {
  openDropdownId.value = null // Cierra el menú al accionar
  const room = rooms.value.find((r) => r._id === id)
  if (!room) return

  try {
    const response = await apiFetch(`/api/organizator/elections/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    })
    const parsed = await response.json()
    if (response.ok && parsed.success) {
      room.status = newStatus
      console.log('Estado actualizado:', room)
    } else {
      console.error('API error al cambiar estado:', parsed.message)
      alert('Hubo un error al cambiar el estado de la sala: ' + parsed.message)
    }
  } catch (error) {
    console.error('Error updating status:', error)
  }
}

const refreshElections = async () => {
  await fetchElections()
}
</script>

<template>
  <OrganizatorLayout>
    <div class="max-w-7xl mx-auto space-y-6 pb-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Administrar salas</h1>
          <p class="mt-1 text-sm text-slate-500">
            Gestiona, edita y supervisa las salas de votación de tu organización.
          </p>
        </div>
        <div class="flex gap-2">
          <button
            @click="refreshElections"
            class="inline-flex items-center px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
          >
            <RefreshCw class="w-5 h-5 mr-2 -ml-1" />
            Actualizar
          </button>
          <RouterLink
            to="/organizator/rooms/create"
            class="inline-flex items-center px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
          >
            <Plus class="w-5 h-5 mr-2 -ml-1" />
            Crear Nueva Sala
          </RouterLink>
        </div>
      </div>

      <!-- Filters & Actions Bar -->
      <div
        class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center"
      >
        <!-- Search -->
        <div class="relative flex-1 w-full">
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"
          >
            <Search class="w-5 h-5" />
          </div>
          <input
            v-model="searchQuery"
            type="text"
            class="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-slate-50 hover:bg-white"
            placeholder="Buscar sala por nombre..."
          />
        </div>

        <!-- Filter Dropdown -->
        <div class="sm:w-64 relative w-full">
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"
          >
            <Filter class="w-4 h-4" />
          </div>
          <select
            v-model="statusFilter"
            class="block w-full pl-10 pr-10 py-2.5 text-slate-700 border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg appearance-none border cursor-pointer bg-slate-50 hover:bg-white font-medium transition-colors"
          >
            <option value="Todas">Todos los estados</option>
            <option value="draft">Borradores</option>
            <option value="published">Publicadas</option>
            <option value="open">Abiertas</option>
            <option value="closed">Cerradas</option>
          </select>
        </div>
      </div>
      <!-- Data Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Nombre de la Sala
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Participación
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-100">
              <tr
                v-for="room in filteredRooms"
                :key="room._id"
                class="hover:bg-slate-50/80 transition-colors group"
              >
                <!-- Sala Info -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div
                      class="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-sm group-hover:scale-105 transition-transform"
                    >
                      {{ (room.title || '?').charAt(0) }}
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-semibold text-slate-900">{{ room.title }}</div>
                      <div class="text-xs text-slate-500 mt-0.5">
                        ID: #{{ (room._id || '0000').slice(-4) }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Estado Badge -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border"
                    :class="getStatusColor(room.status)"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full mr-1.5"
                      :class="{
                        'bg-emerald-500': room.status === 'open',
                        'bg-amber-500': room.status === 'closed',
                        'bg-slate-400': ['draft', 'archived'].includes(room.status),
                        'bg-blue-500': room.status === 'published',
                      }"
                    ></span>
                    {{ formatStatus(room.status) }}
                  </span>
                </td>

                <!-- Participacion Bar -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span class="text-sm text-slate-900 font-bold w-10"
                      >{{ room.participation || 0 }}%</span
                    >
                    <div
                      class="w-24 sm:w-32 bg-slate-100 rounded-full h-2.5 ml-2 overflow-hidden border border-slate-200"
                    >
                      <div
                        class="bg-emerald-500 h-full rounded-full"
                        :style="{ width: `${room.participation || 0}%` }"
                      ></div>
                    </div>
                  </div>
                  <div class="text-xs text-slate-500 mt-1.5 font-medium ml-12">
                    {{ Math.floor(((room.participation || 0) * (room.totalVoters || 0)) / 100) }} de
                    {{ room.totalVoters || 0 }} votos
                  </div>
                </td>

                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-1">
                    <button
                      class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Resultados y Estadísticas"
                    >
                      <BarChart2 class="w-5 h-5" />
                    </button>
                    <button
                      class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar Sala"
                      @click="editRoom(room._id)"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <!-- Dropdown de Estados -->
                    <div class="action-menu-container inline-block text-left">
                      <button
                        @click="toggleDropdown(room._id, $event)"
                        class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Opciones de Estado"
                      >
                        <MoreVertical class="w-5 h-5 pointer-events-none" />
                      </button>

                      <!-- Menú Desplegable con Teleport para evitar recorte por tabla -->
                      <Teleport to="body">
                        <transition
                          enter-active-class="transition ease-out duration-100"
                          enter-from-class="transform opacity-0 scale-95"
                          enter-to-class="transform opacity-100 scale-100"
                          leave-active-class="transition ease-in duration-75"
                          leave-from-class="transform opacity-100 scale-100"
                          leave-to-class="transform opacity-0 scale-95"
                        >
                          <div
                            v-if="openDropdownId === room._id"
                            class="fixed z-[100] w-52 rounded-xl bg-white shadow-xl border border-slate-200 focus:outline-none overflow-hidden"
                            :style="dropdownStyles"
                          >
                            <div class="py-1">
                              <div class="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                                <p
                                  class="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                                >
                                  Cambiar estado a:
                                </p>
                              </div>

                              <!-- Opción 1: Publicar -->
                              <button
                                @click="updateStatus(room._id, 'published')"
                                :disabled="room.status !== 'draft'"
                                :class="[
                                  'w-full text-left px-4 py-2.5 text-sm flex items-center transition-colors',
                                  room.status === 'draft'
                                    ? 'text-slate-700 hover:bg-slate-50 cursor-pointer font-medium'
                                    : 'text-slate-300 cursor-not-allowed',
                                ]"
                              >
                                <CheckCircle2 class="w-4 h-4 mr-2.5" />
                                Publicar Sala
                              </button>

                              <!-- Opción 2: Abrir -->
                              <button
                                @click="updateStatus(room._id, 'open')"
                                :disabled="room.status !== 'published'"
                                :class="[
                                  'w-full text-left px-4 py-2.5 text-sm flex items-center transition-colors',
                                  room.status === 'published'
                                    ? 'text-emerald-700 hover:bg-emerald-50 cursor-pointer font-medium'
                                    : 'text-slate-300 cursor-not-allowed',
                                ]"
                              >
                                <PlayCircle class="w-4 h-4 mr-2.5" />
                                Abrir Votación
                              </button>

                              <!-- Opción 3: Cerrar -->
                              <button
                                @click="updateStatus(room._id, 'closed')"
                                :disabled="room.status !== 'open'"
                                :class="[
                                  'w-full text-left px-4 py-2.5 text-sm flex items-center transition-colors',
                                  room.status === 'open'
                                    ? 'text-amber-700 hover:bg-amber-50 cursor-pointer font-medium'
                                    : 'text-slate-300 cursor-not-allowed',
                                ]"
                              >
                                <StopCircle class="w-4 h-4 mr-2.5" />
                                Cerrar Definitivamente
                              </button>

                              <div class="border-t border-slate-100 my-1"></div>

                              <!-- Opción 4: Archivar -->
                              <button
                                @click="updateStatus(room._id, 'archived')"
                                :disabled="
                                  room.status === 'archived' ||
                                  room.status === 'draft' ||
                                  room.status === 'published'
                                "
                                :class="[
                                  'w-full text-left px-4 py-2.5 text-sm flex items-center transition-colors',
                                  room.status === 'closed' || room.status === 'open'
                                    ? 'text-slate-700 hover:bg-slate-50 cursor-pointer font-medium'
                                    : 'text-slate-300 cursor-not-allowed',
                                ]"
                              >
                                <Archive class="w-4 h-4 mr-2.5" />
                                Archivar Historial
                              </button>
                            </div>
                          </div>
                        </transition>
                      </Teleport>
                    </div>
                    <button
                      class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar Sala"
                      @click="promptDelete(room._id)"
                    >
                      <Trash2 class="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
              <!-- Empty State -->
              <tr v-if="filteredRooms.length === 0">
                <td colspan="4" class="px-6 py-16 text-center">
                  <Building2 class="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p class="text-slate-900 text-sm font-semibold">No se encontraron salas</p>
                  <p class="text-slate-500 text-sm mt-1">
                    Ajusta los filtros o intenta con otra búsqueda.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Confirmación de Eliminación -->
    <DeleteRoomCard
      :isOpen="showDeleteModal"
      :id="roomToDelete"
      @roomDeleted="handleRoomDeleted"
      @cancel="showDeleteModal = false"
    />
  </OrganizatorLayout>
</template>
