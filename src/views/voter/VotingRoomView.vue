<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch } from '@/utils/apiFetch'
import { 
  CheckCircle2, 
  AlertCircle, 
  CalendarDays, 
  Info, 
  ShieldCheck,
  ChevronLeft,
  Loader2,
  Lock,
  UserCircle,
  LogOut
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const electionId = route.params.id as string

const election = ref<any>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const hasVoted = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const userName = ref('Usuario')

const selectedOptions = ref<string[]>([])

const handleLogout = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  router.push('/login')
}

const fetchElectionAndVotes = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const resElection = await apiFetch(`/api/elections/${electionId}`)
    if (!resElection.ok) {
      throw new Error('No se pudo cargar la elección. Quizás no exista o no tengas acceso.')
    }
    const dataElection = await resElection.json()
    election.value = dataElection.data

    const resVotes = await apiFetch('/api/votes/my')
    if (resVotes.ok) {
      const dataVotes = await resVotes.json()
      const userVotes = dataVotes.data || []
      const previousVote = userVotes.find((v: any) => v.electionId === electionId)
      if (previousVote) {
        hasVoted.value = true
      }
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Error al obtener los datos.'
    console.error('Error:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchElectionAndVotes()
  
  const token = localStorage.getItem('accessToken')
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1]
      if (payloadBase64) {
        const payloadDecoded = decodeURIComponent(
          atob(payloadBase64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          }).join('')
        )
        const payload = JSON.parse(payloadDecoded)
        userName.value = payload.name || payload.given_name || payload.preferred_username || 'Usuario'
      }
    } catch (e) {
      // ignore
    }
  }
})

const toggleOption = (optionId: string) => {
  if (hasVoted.value || election.value?.status !== 'open') return

  if (election.value.type === 'multiple_choice') {
    const max = election.value.maxSelections || 1
    const idx = selectedOptions.value.indexOf(optionId)
    if (idx > -1) {
      selectedOptions.value.splice(idx, 1)
    } else {
      if (selectedOptions.value.length < max) {
        selectedOptions.value.push(optionId)
      }
    }
  } else {
    selectedOptions.value = [optionId]
  }
}

const isOptionSelected = (optionId: string) => selectedOptions.value.includes(optionId)

const submitVote = async () => {
  if (selectedOptions.value.length === 0) {
    errorMessage.value = 'Por favor selecciona al menos una opción.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const response = await apiFetch('/api/votes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        electionId,
        selectedOptionIds: selectedOptions.value
      })
    })

    const result = await response.json()
    if (response.ok) {
      successMessage.value = '¡Tu voto ha sido registrado exitosamente y protegido criptográficamente!'
      hasVoted.value = true
    } else {
      errorMessage.value = result.message || 'Error al registrar el voto.'
      if (response.status === 409) {
        hasVoted.value = true
      }
    }
  } catch (error) {
    errorMessage.value = 'Error de conexión. Intenta nuevamente.'
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.push('/dashboard')
}

const statusInfo = computed(() => {
  if (!election.value) return { text: '', color: '' }
  switch (election.value.status) {
    case 'open':
      return { text: 'Votación Abierta', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' }
    case 'closed':
      return { text: 'Votación Cerrada', color: 'text-red-400 bg-red-500/10 border-red-500/20' }
    case 'published':
      return { text: 'Próximamente', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
    default:
      return { text: election.value.status, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' }
  }
})

const formattedDateRange = computed(() => {
  if (!election.value) return ''
  const start = new Date(election.value.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  const end = new Date(election.value.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  return `${start} - ${end}`
})
</script>

<template>
  <div class="min-h-screen bg-slate-900 selection:bg-emerald-500/30 font-sans flex flex-col">
    <!-- Navbar (consistent view) -->
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
            <div class="flex items-center gap-2 text-slate-300 hover:text-white transition-colors p-2 rounded-lg">
              <span class="text-sm font-medium hidden sm:block">{{ userName }}</span>
              <UserCircle class="w-7 h-7 text-emerald-500" />
            </div>
            <div class="w-px h-6 bg-slate-700"></div>
            <button class="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-700/50" title="Cerrar sesión" @click="handleLogout">
              <LogOut class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Section -->
    <main class="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
      <!-- Back button -->
      <button @click="goBack" class="self-start inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6 group bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-700/50">
        <ChevronLeft class="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
        Volver al Dashboard
      </button>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 bg-slate-800/30 rounded-3xl border border-slate-700/50 backdrop-blur-md">
        <Loader2 class="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p class="text-slate-400 font-medium animate-pulse">Cargando sala de votación...</p>
      </div>

      <!-- Error fetching state -->
      <div v-else-if="!election && errorMessage" class="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center backdrop-blur-md">
        <AlertCircle class="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 class="text-xl font-bold text-white mb-2">Error de acceso</h3>
        <p class="text-slate-300">{{ errorMessage }}</p>
        <button @click="goBack" class="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700">
          Regresar a inicio
        </button>
      </div>

      <!-- Voting Room Content -->
      <div v-else-if="election" class="space-y-6 animate-in slide-in-from-bottom-6 fade-in duration-500">
        
        <!-- Header Card -->
        <div class="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-3xl border border-slate-700/50 p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div class="absolute inset-0 bg-emerald-500/5 mix-blend-overlay pointer-events-none"></div>
          
          <div class="relative z-10 flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
            <div>
              <span :class="['inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border mb-4 backdrop-blur-md', statusInfo.color]">
                <span v-if="election.status === 'open'" class="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                {{ statusInfo.text }}
              </span>
              <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2 leading-tight">
                {{ election.title }}
              </h1>
              <p class="text-slate-300 max-w-2xl text-lg leading-relaxed">
                {{ election.description }}
              </p>
            </div>
            <div class="flex items-center text-slate-400 bg-slate-900/50 rounded-xl px-4 py-3 border border-slate-700/50 shadow-inner shrink-0">
              <CalendarDays class="w-5 h-5 mr-3 text-emerald-500" />
              <div class="text-sm font-medium">
                <span class="block text-slate-500 text-xs uppercase tracking-wider">Período</span>
                {{ formattedDateRange }}
              </div>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)] transform transition-all animate-in zoom-in-95 duration-500">
          <div class="bg-emerald-500/20 p-3 rounded-full shrink-0">
            <CheckCircle2 class="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-white mb-1">¡Votación Completada!</h3>
            <p>{{ successMessage }}</p>
          </div>
        </div>

        <!-- Already Voted Locked State -->
        <div v-else-if="hasVoted" class="bg-slate-800 rounded-2xl border border-slate-700/50 p-8 text-center shadow-lg relative overflow-hidden backdrop-blur-md">
          <div class="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl rounded-tl-none pointer-events-none"></div>
          <div class="relative z-10 max-w-md mx-auto">
            <div class="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700 shadow-inner">
              <ShieldCheck class="w-10 h-10 text-emerald-500" />
            </div>
            <h3 class="text-2xl font-bold text-white mb-3">Voto Registrado</h3>
            <p class="text-slate-400 mb-6 leading-relaxed">
              Ya has emitido tu voto en este proceso electoral. Por diseño de seguridad, nuestro sistema previene la emisión de votos duplicados para proteger la integridad de la elección.
            </p>
            <button @click="goBack" class="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              Volver a Votaciones
            </button>
          </div>
        </div>

        <!-- Voting Options Form -->
        <div v-else class="bg-slate-800/40 rounded-3xl border border-slate-700/50 p-6 sm:p-8 backdrop-blur-sm relative">
          <!-- Only show if open -->
          <template v-if="election.status === 'open'">
            <div class="flex items-center justify-between mb-6 border-b border-slate-700/50 pb-4">
              <h2 class="text-xl font-bold text-white">Opciones disponibles</h2>
              <span class="text-sm px-3 py-1 bg-slate-900 rounded-lg text-slate-300 border border-slate-700 shadow-inner">
                {{ election.type === 'multiple_choice' ? `Selecciona hasta ${election.maxSelections} opciones` : 'Selecciona 1 opción' }}
              </span>
            </div>

            <!-- Error message on form -->
            <div v-if="errorMessage" class="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start text-sm">
              <AlertCircle class="w-5 h-5 mr-3 shrink-0" />
              <span>{{ errorMessage }}</span>
            </div>

            <div class="space-y-4 mb-8">
              <div 
                v-for="option in election.options" 
                :key="option.id"
                @click="toggleOption(option.id)"
                :class="[
                  'group relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden backdrop-blur-md',
                  isOptionSelected(option.id) 
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800'
                ]"
              >
                <!-- Selection effect bg -->
                <div 
                  class="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  v-if="!isOptionSelected(option.id)"
                ></div>
                
                <div class="flex items-center relative z-10 w-full">
                  <div class="flex-grow pr-4">
                    <h3 :class="['text-lg font-bold transition-colors', isOptionSelected(option.id) ? 'text-emerald-400' : 'text-slate-200 group-hover:text-white']">
                      {{ option.label }}
                    </h3>
                    <p v-if="option.description" class="text-sm text-slate-400 mt-1 line-clamp-2">{{ option.description }}</p>
                  </div>
                  
                  <div class="shrink-0 flex items-center justify-center">
                    <div 
                      :class="[
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                        isOptionSelected(option.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 group-hover:border-slate-400'
                      ]"
                    >
                      <CheckCircle2 v-if="isOptionSelected(option.id)" class="w-4 h-4 text-slate-900" stroke-width="3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p class="text-sm text-slate-400 flex items-center">
                <Lock class="w-4 h-4 mr-2" />
                Voto anónimo y seguro
              </p>
              <button 
                @click="submitVote" 
                :disabled="isSubmitting || selectedOptions.length === 0"
                :class="[
                  'w-full sm:w-auto px-8 py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 group',
                  selectedOptions.length === 0 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                ]"
              >
                <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin" />
                <span v-if="!isSubmitting">Emitir mi voto</span>
              </button>
            </div>
          </template>

          <template v-else>
            <!-- Cannot vote state (upcoming or closed) -->
            <div class="text-center py-10">
              <div class="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                <Info class="w-8 h-8 text-slate-400" />
              </div>
              <h3 class="text-xl font-bold text-white mb-2">Votación no disponible</h3>
              <p class="text-slate-400 max-w-sm mx-auto">
                {{ election.status === 'published' ? 'Esta elección aún no ha comenzado. Vuelve cuando el status cambie a abierta.' : 'Esta elección ya ha cerrado y no acepta nuevos votos.' }}
              </p>
            </div>
          </template>
        </div>

      </div>
    </main>
  </div>
</template>