<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  UserCircle,
  LogOut,
  CheckCircle2,
  LayoutDashboard,
  Search,
  Inbox,
  History,
  Filter,
} from 'lucide-vue-next'
import VotingCard from '../../components/common/VotingCard.vue'
import router from '@/router'
import { apiFetch } from '../../utils/apiFetch'

interface ActiveVote {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  status: string
}

const activeVotes = ref<ActiveVote[]>([])
const activeTab = ref<'activas' | 'historial'>('activas')

const historyVotes = ref([
  {
    id: 101,
    title: 'Elección Centro de Estudiantes 2025',
    date: '10 Nov 2025',
    status: 'Confirmado',
  },
  { id: 102, title: 'Encuesta de Satisfacción Comedor', date: '15 Sep 2025', status: 'Confirmado' },
])

const fetchElections = async () => {
  try {
    const response = await apiFetch('/api/elections')
    if (response.ok) {
      const result = await response.json()
      activeVotes.value = result.data.map((election: any) => {
        const date = new Date(election.endDate)
        const formattedDate = date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })

        return {
          id: election._id,
          title: election.title,
          description: election.description,
          startDate: formattedDate,
          endDate: formattedDate,
          status: election.status,
        }
      })
    }
  } catch (error) {
    console.error('Error al obtener las votaciones:', error)
  }
}

fetchElections()

// Search logic
const searchQuery = ref('')
const filteredActiveVotes = computed(() => {
  if (!searchQuery.value) return activeVotes.value
  return activeVotes.value.filter((vote) =>
    vote.title.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const handleLogout = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  router.push('/login')
}

const userName = ref('Usuario')

onMounted(() => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1]
      if (!payloadBase64) throw new Error('Invalid token format')

      const payloadDecoded = decodeURIComponent(
        atob(payloadBase64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          })
          .join(''),
      )

      const payload = JSON.parse(payloadDecoded)
      userName.value = payload.name || payload.given_name || payload.preferred_username || 'Usuario'
    } catch (error) {
      console.error('Error al decodificar el token', error)
      userName.value = 'Usuario'
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-900 selection:bg-emerald-500/30 font-sans">
    <!-- Navbar -->
    <nav class="bg-slate-800 border-b border-slate-700/50 sticky top-0 z-10 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <span class="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span
                class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-900 shadow-md"
              >
                <CheckCircle2 class="w-5 h-5" stroke-width="3" />
              </span>
              UpVote
            </span>
          </div>
          <div class="flex items-center gap-4">
            <div
              class="flex items-center gap-2 text-slate-300 hover:text-white transition-colors cursor-pointer p-2 rounded-lg hover:bg-slate-700/50"
            >
              <span class="text-sm font-medium hidden sm:block">{{ userName }}</span>
              <UserCircle class="w-7 h-7 text-emerald-500" />
            </div>
            <div class="w-px h-6 bg-slate-700"></div>
            <button
              class="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
              title="Cerrar sesión"
              @click="handleLogout"
            >
              <LogOut class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Tabs Navigation -->
      <div
        class="flex space-x-1 rounded-xl bg-slate-800/50 p-1 mb-8 max-w-md border border-slate-700/50"
      >
        <button
          @click="activeTab = 'activas'"
          :class="[
            'flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all',
            activeTab === 'activas'
              ? 'bg-emerald-500 text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
          ]"
        >
          <LayoutDashboard class="w-4 h-4" />
          Votaciones
          <span
            :class="[
              'px-2 py-0.5 rounded-full text-xs font-bold',
              activeTab === 'activas'
                ? 'bg-slate-900/20 text-slate-900'
                : 'bg-slate-700 text-slate-300',
            ]"
          >
            {{ activeVotes.length }}
          </span>
        </button>
        <button
          @click="activeTab = 'historial'"
          :class="[
            'flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all',
            activeTab === 'historial'
              ? 'bg-emerald-500 text-slate-900 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
          ]"
        >
          <History class="w-4 h-4" />
          Mi Historial
        </button>
      </div>

      <!-- Section: Votaciones Activas -->
      <section v-show="activeTab === 'activas'">
        <div class="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <LayoutDashboard class="w-6 h-6 text-emerald-500" />
            Votaciones Activas
          </h2>
          <span
            class="text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20"
            >{{ activeVotes.length }} procesos abiertos</span
          >
        </div>

        <!-- Barra de búsqueda -->
        <div class="mb-6">
          <div class="flex">
            <div class="relative w-full">
              <div
                class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"
              >
                <Search class="w-5 h-5" />
              </div>
              <input
                v-model="searchQuery"
                type="text"
                class="block w-full pl-11 pr-4 py-3 bg-slate-800 border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm shadow-slate-900/10"
                placeholder="Buscar por nombre de elección..."
              />
            </div>
            <button
              class="ml-2 px-4 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
            >
              <Filter class="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <!-- Cuadrícula de tarjetas -->
        <div
          v-if="filteredActiveVotes.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <VotingCard
            v-for="vote in filteredActiveVotes"
            :key="vote.id"
            :id="vote.id"
            :title="vote.title"
            :description="vote.description"
            :start-date="vote.startDate"
            :end-date="vote.endDate"
            :status="vote.status"
          />
        </div>

        <!-- Estado Vacío -->
        <div
          v-else
          class="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-12 text-center flex flex-col items-center justify-center"
        >
          <div
            class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700"
          >
            <Inbox class="w-8 h-8 text-slate-500" />
          </div>
          <h3 class="text-lg font-bold text-white mb-2">No se encontraron resultados</h3>
          <p class="text-slate-400 max-w-sm mx-auto">
            No pudimos encontrar ninguna votación activa que coincida con "<span
              class="text-slate-300 font-medium"
              >{{ searchQuery }}</span
            >". Intenta con otros términos.
          </p>
          <button
            @click="searchQuery = ''"
            class="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700"
          >
            Borrar búsqueda
          </button>
        </div>
      </section>

      <!-- Section: Mi Historial -->
      <section v-show="activeTab === 'historial'">
        <div class="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History class="w-6 h-6 text-emerald-500" />
            Mi Historial
          </h2>
        </div>

        <div class="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden shadow-lg">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-700/50">
              <thead class="bg-slate-900/50">
                <tr>
                  <th
                    scope="col"
                    class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                  >
                    Votación
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                  >
                    Fecha
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                  >
                    Estado de voto
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-700/50">
                <tr
                  v-for="item in historyVotes"
                  :key="item.id"
                  class="hover:bg-slate-700/30 transition-colors group"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div
                      class="text-sm font-medium text-slate-200 group-hover:text-white transition-colors"
                    >
                      {{ item.title }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-slate-400">{{ item.date }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    >
                      <CheckCircle2 class="w-3 h-3 mr-1" />
                      {{ item.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
