<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
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

interface MyVote {
  id: string
  electionId: string
  title: string
  status: string
  submittedAt: string
}

const activeVotes = ref<ActiveVote[]>([])
const myVotes = ref<MyVote[]>([])
const activeTab = ref<'activas' | 'historial'>('activas')

const fetchElections = async () => {
  try {
    const response = await apiFetch('/api/elections')
    if (response.ok) {
      const result = await response.json()
      console.log(result)
      activeVotes.value = result.data.map((election: any) => {
        const startDate = new Date(election.startDate)
        const formattedStartDate = startDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        const endDate = new Date(election.endDate)
        const formattedEndDate = endDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })

        return {
          id: election._id,
          title: election.title,
          description: election.description,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          status: election.status,
        }
      })
    }
  } catch (error) {
    console.error('Error al obtener las votaciones:', error)
  }
}

const fetchMyVotes = async () => {
  try {
    const response = await apiFetch('/api/votes/my')
    if (response.ok) {
      const result = await response.json()
      myVotes.value = result.data.map((vote: any) => {
        const submitDate = new Date(vote.submittedAt)
        const formattedSubmitDate = submitDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) + ', ' + submitDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })

        return {
          id: vote._id,
          electionId: vote.election?._id || 'Elección desconocida',
          title: vote.election?.title || 'Elección desconocida',
          status: 'Confirmado',
          submittedAt: formattedSubmitDate
        }
      })
    }
  } catch (error) {
    console.error('Error al obtener el historial de votos:', error)
  }
}

const searchQuery = ref('')
const showFilterMenu = ref(false)
const activeFilter = ref<'all' | 'open' | 'published' | 'closed'>('all')

const filteredActiveVotes = computed(() => {
  let result = activeVotes.value

  if (activeFilter.value !== 'all') {
    result = result.filter(v => v.status === activeFilter.value)
  }

  if (searchQuery.value) {
    result = result.filter(v => v.title.toLowerCase().includes(searchQuery.value.toLowerCase()))
  }

  return result
})

const openElectionsCount = computed(() => activeVotes.value.filter(v => v.status === 'open').length)
const publishedElectionsCount = computed(() => activeVotes.value.filter(v => v.status === 'published').length)

const handleLogout = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  router.push('/')
}

const userName = ref('Usuario')


let pollInterval: number | null = null

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

  fetchElections()
  fetchMyVotes()

  pollInterval = window.setInterval(() => {
    fetchElections()
    fetchMyVotes()
  }, 10000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-900 selection:bg-emerald-500/30 font-sans">
    <!-- Navbar -->
    <nav class="bg-slate-800 border-b border-slate-700/50 sticky top-0 z-10 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center cursor-pointer" @click="router.push('/dashboard')">
            <span class="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
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
            Votaciones
          </h2>
          <div class="flex flex-wrap gap-2">
            <span v-if="openElectionsCount > 0"
              class="text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              >{{ openElectionsCount }} en curso</span
            >
            <span v-if="publishedElectionsCount > 0"
              class="text-sm font-medium text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              >{{ publishedElectionsCount }} próximas</span
            >
          </div>
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
            <div class="relative ml-2">
              <button
                @click="showFilterMenu = !showFilterMenu"
                :class="[
                  'px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center h-full',
                  showFilterMenu || activeFilter !== 'all' 
                    ? 'bg-emerald-500/20 text-emerald-400 borderborder-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50 hover:border-slate-500/50'
                ]"
              >
                <Filter class="w-5 h-5" />
              </button>
              
              <!-- Menú Desplegable -->
              <div v-if="showFilterMenu" class="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl border border-slate-700/80 shadow-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                <button 
                  @click="activeFilter = 'all'; showFilterMenu = false" 
                  :class="['w-full text-left px-5 py-3 text-sm transition-colors border-b border-slate-700/50', activeFilter === 'all' ? 'text-emerald-400 bg-slate-700/80 font-bold' : 'text-slate-300 hover:bg-slate-700/50']"
                >
                  <span class="block">Todos los procesos</span>
                </button>
                <button 
                  @click="activeFilter = 'open'; showFilterMenu = false" 
                  :class="['w-full text-left px-5 py-3 text-sm transition-colors border-b border-slate-700/50', activeFilter === 'open' ? 'text-emerald-400 bg-slate-700/80 font-bold' : 'text-slate-300 hover:bg-slate-700/50']"
                >
                  <span class="block flex items-center"><div class="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgb(16,185,129)]"></div> Solo en curso</span>
                </button>
                <button 
                  @click="activeFilter = 'published'; showFilterMenu = false" 
                  :class="['w-full text-left px-5 py-3 text-sm transition-colors', activeFilter === 'published' ? 'text-amber-400 bg-amber-500/20 font-bold' : 'text-slate-300 hover:bg-slate-700/50']"
                >
                  <span class="block flex items-center"><div class="w-2 h-2 rounded-full bg-amber-500 mr-2 shadow-[0_0_8px_rgb(245,158,11)]"></div> Próximos (Publicados)</span>
                </button>
                <button 
                  @click="activeFilter = 'closed'; showFilterMenu = false" 
                  :class="['w-full text-left px-5 py-3 text-sm transition-colors', activeFilter === 'closed' ? 'text-red-400 bg-red-500/20 font-bold' : 'text-slate-300 hover:bg-slate-700/50']"
                >
                  <span class="block flex items-center"><div class="w-2 h-2 rounded-full bg-red-500 mr-2 shadow-[0_0_8px_rgb(239,68,68)]"></div> Finalizadas</span>
                </button>
              </div>
            </div>
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
          v-else-if="filteredActiveVotes.length === 0 && activeVotes.length > 0 && activeFilter === 'all'"
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

        <div
          v-if="filteredActiveVotes.length === 0 && activeVotes.length > 0 && activeFilter !== 'all'"
          class="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-12 text-center flex flex-col items-center justify-center"
        >
          <div
            class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700"
          >
            <Filter class="w-8 h-8 text-slate-500" />
          </div>
          <h3 class="text-lg font-bold text-white mb-2">No hay votaciones con ese filtro</h3>
          <p class="text-slate-400 max-w-sm mx-auto">
            No pudimos encontrar votaciones que coincidan con tu filtro actual. Intenta cambiar el filtro o la búsqueda.
          </p>
          <button
            @click="activeFilter = 'all'"
            class="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700"
          >
            Ver todas
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
                  v-for="item in myVotes"
                  :key="item.id"
                  class="hover:bg-slate-700/30 transition-colors group"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div
                      @click="router.push(`/election/${item.electionId}`)"
                      class="text-sm font-medium text-slate-200 group-hover:text-white transition-colors cursor-pointer"
                    >
                      {{ item.title }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-slate-400">{{ item.submittedAt }}</div>
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
