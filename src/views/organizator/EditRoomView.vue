<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OrganizatorLayout from '../../layouts/OrganizatorLayout.vue'
import { apiFetch } from '../../utils/apiFetch'
import {
  ChevronRight,
  Save,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const roomId = route.params.id as string

const room = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const title = ref('')
const description = ref('')
const startDateStr = ref('')
const startTimeStr = ref('')
const endDateStr = ref('')
const endTimeStr = ref('')
const allowResultsBeforeClose = ref(false)
const maxSelections = ref(1)
const maxVotes = ref<number | null>(null)
const isLocationRestricted = ref(false)
const type = ref('single_choice')
const options = ref<any[]>([])
const status = ref('')

const fetchRoom = async () => {
  try {
    loading.value = true
    const response = await apiFetch(`/api/organizator/elections/${roomId}`)
    const parsed = await response.json()

    if (parsed.success && parsed.data) {
      room.value = parsed.data

      title.value = room.value.title || ''
      description.value = room.value.description || ''
      allowResultsBeforeClose.value = room.value.allowResultsBeforeClose || false
      maxSelections.value = room.value.maxSelections || 1
      maxVotes.value = room.value.maxVotes || null
      isLocationRestricted.value = room.value.isLocationRestricted || false
      type.value = room.value.type || 'single_choice'
      status.value = room.value.status || ''

      const extractLocal = (utcString: string) => {
        if (!utcString) return { date: '', time: '' }
        const d = new Date(utcString)
        if (isNaN(d.getTime())) return { date: '', time: '' }

        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')

        return {
          date: `${year}-${month}-${day}`,
          time: `${hours}:${minutes}`,
        }
      }

      const startStr =
        typeof room.value.startDate === 'object' && room.value.startDate
          ? room.value.startDate.$date || room.value.startDate
          : room.value.startDate
      const localStart = extractLocal(startStr)
      startDateStr.value = localStart.date
      startTimeStr.value = localStart.time

      const endStr =
        typeof room.value.endDate === 'object' && room.value.endDate
          ? room.value.endDate.$date || room.value.endDate
          : room.value.endDate
      const localEnd = extractLocal(endStr)
      endDateStr.value = localEnd.date
      endTimeStr.value = localEnd.time

      options.value = room.value.options || []
    } else {
      error.value = parsed.message || 'Sala no encontrada'
    }
  } catch (err) {
    error.value = 'Error al cargar la sala'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const addOption = () => {
  options.value.push({ label: '', description: '' })
}

const removeOption = (index: number) => {
  options.value.splice(index, 1)
}

onMounted(() => {
  fetchRoom()
})

const saveRoom = async () => {
  saving.value = true
  error.value = ''

  try {
    const parseLocalToISO = (dateStr: string, timeStr: string) => {
      return new Date(`${dateStr}T${timeStr}:00`).toISOString()
    }

    const payload = {
      title: title.value,
      description: description.value,
      startDate: parseLocalToISO(startDateStr.value, startTimeStr.value),
      endDate: parseLocalToISO(endDateStr.value, endTimeStr.value),
      allowResultsBeforeClose: allowResultsBeforeClose.value,
      maxSelections: Number(maxSelections.value),
      maxVotes: maxVotes.value ? Number(maxVotes.value) : null,
      isLocationRestricted: isLocationRestricted.value,
      options: options.value.filter((o) => o.label && o.label.trim()),
    }

    const response = await apiFetch(`/api/organizator/elections/${roomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const parsed = await response.json()

    if (!parsed.success) {
      error.value = parsed.message || 'Error al guardar'
      return
    }

    if (status.value !== room.value.status) {
      if (status.value === 'draft') {
        error.value =
          'El backend no permite revertir la sala a Borrador una vez activada. (El resto de cambios sí se guardaron)'
        return
      }

      const statusResponse = await apiFetch(`/api/organizator/elections/${roomId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: status.value }),
      })

      const statusParsed = await statusResponse.json()
      if (!statusParsed.success) {
        error.value =
          statusParsed.message || 'Cambios guardados, pero error al actualizar el estado'
        return
      }
    }

    router.push('/organizator/rooms')
  } catch (err) {
    error.value = 'Error de conexión'
    console.error(err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <OrganizatorLayout>
    <div class="max-w-4xl mx-auto space-y-6 pb-12">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <button
            @click="$router.push('/organizator/rooms')"
            class="text-sm font-medium text-slate-500 cursor-pointer hover:text-slate-600 transition-colors"
          >
            Salas de Votación
          </button>
          <ChevronRight class="w-5 h-5 text-slate-400" />
          <h2 class="text-sm font-medium text-slate-500">Editar Sala</h2>
        </div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Editar Sala</h1>
        <p class="mt-1 text-sm text-slate-500">
          Modifica la configuración y opciones de la votación.
        </p>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2"
      >
        <AlertCircle class="w-5 h-5 flex-shrink-0" />
        {{ error }}
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <Loader2 class="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
        <p class="text-slate-500">Cargando sala...</p>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="saveRoom" class="space-y-6">
        <!-- Basic Info Card -->
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">
            Información General
          </h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Título de la Sala</label>
              <input
                v-model="title"
                type="text"
                required
                class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Ej: Elecciones Representantes Estudiantiles"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea
                v-model="description"
                rows="3"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Descripción detallada de la votación..."
              ></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Fecha de Inicio</label>
                <div class="relative">
                  <input
                    v-model="startDateStr"
                    type="date"
                    required
                    class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:m-0"
                  />
                  <Calendar
                    class="w-5 h-5 text-slate-400 absolute right-3 top-3 pointer-events-none"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Hora de Inicio</label>
                <div class="relative">
                  <input
                    v-model="startTimeStr"
                    type="time"
                    required
                    class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:m-0"
                  />
                  <Clock
                    class="w-5 h-5 text-slate-400 absolute right-3 top-3 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Fecha de Cierre</label>
                <div class="relative">
                  <input
                    v-model="endDateStr"
                    type="date"
                    required
                    class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:m-0"
                  />
                  <Calendar
                    class="w-5 h-5 text-slate-400 absolute right-3 top-3 pointer-events-none"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Hora de Cierre</label>
                <div class="relative">
                  <input
                    v-model="endTimeStr"
                    type="time"
                    required
                    class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:m-0"
                  />
                  <Clock
                    class="w-5 h-5 text-slate-400 absolute right-3 top-3 pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Configuration Card -->
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-2">
            Configuración
          </h3>

          <!-- State Selection -->
          <div class="space-y-3 pb-6 border-b border-slate-100">
            <div>
              <label class="block text-sm font-medium text-slate-700">Estado de la Votación</label>
              <p class="text-xs text-slate-500 mb-3">
                Define en qué fase se encuentra la sala actualmente.
              </p>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <!-- Draft -->
              <label
                :class="[
                  'relative flex flex-col items-start p-4 cursor-pointer rounded-xl border-2 transition-all',
                  status === 'draft'
                    ? 'bg-slate-50 border-slate-500 text-slate-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50',
                ]"
              >
                <input type="radio" value="draft" v-model="status" class="sr-only" />
                <div class="flex items-center justify-between w-full mb-1">
                  <span class="text-sm font-bold">Borrador</span>
                  <div
                    v-show="status === 'draft'"
                    class="w-2.5 h-2.5 rounded-full bg-slate-500"
                  ></div>
                </div>
                <span class="text-xs opacity-80 mt-1">En configuración</span>
              </label>

              <!-- Published -->
              <label
                :class="[
                  'relative flex flex-col items-start p-4 cursor-pointer rounded-xl border-2 transition-all',
                  status === 'published'
                    ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50',
                ]"
              >
                <input type="radio" value="published" v-model="status" class="sr-only" />
                <div class="flex items-center justify-between w-full mb-1">
                  <span class="text-sm font-bold">Publicada</span>
                  <div
                    v-show="status === 'published'"
                    class="w-2.5 h-2.5 rounded-full bg-blue-500"
                  ></div>
                </div>
                <span class="text-xs opacity-80 mt-1">Aprobada/Agendada</span>
              </label>

              <!-- Open -->
              <label
                :class="[
                  'relative flex flex-col items-start p-4 cursor-pointer rounded-xl border-2 transition-all',
                  status === 'open'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50',
                ]"
              >
                <input type="radio" value="open" v-model="status" class="sr-only" />
                <div class="flex items-center justify-between w-full mb-1">
                  <span class="text-sm font-bold">Abierta</span>
                  <div
                    v-show="status === 'open'"
                    class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  ></div>
                </div>
                <span class="text-xs opacity-80 mt-1">Recibiendo votos</span>
              </label>

              <!-- Closed -->
              <label
                :class="[
                  'relative flex flex-col items-start p-4 cursor-pointer rounded-xl border-2 transition-all',
                  status === 'closed'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50',
                ]"
              >
                <input type="radio" value="closed" v-model="status" class="sr-only" />
                <div class="flex items-center justify-between w-full mb-1">
                  <span class="text-sm font-bold">Cerrada</span>
                  <div
                    v-show="status === 'closed'"
                    class="w-2.5 h-2.5 rounded-full bg-amber-500"
                  ></div>
                </div>
                <span class="text-xs opacity-80 mt-1">Proceso finalizado</span>
              </label>
            </div>
          </div>
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-slate-700"
                  >Mostrar Resultados Antes del Cierre</label
                >
                <p class="text-xs text-slate-500">
                  Permitir a los votantes ver los resultados temporales.
                </p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="allowResultsBeforeClose" class="sr-only peer" />
                <div
                  class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"
                ></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-slate-700"
                  >Restricción por Ubicación</label
                >
                <p class="text-xs text-slate-500">
                  Habilitar filtros geográficos para los votantes.
                </p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="isLocationRestricted" class="sr-only peer" />
                <div
                  class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"
                ></div>
              </label>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Máximo de Selecciones por Persona</label
                >
                <input
                  v-model="maxSelections"
                  type="number"
                  min="1"
                  required
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1"
                  >Límite Global de Votos (Opcional)</label
                >
                <input
                  v-model="maxVotes"
                  type="number"
                  min="1"
                  class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Sin límite"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Dynamic Candidates Block -->
        <div
          v-if="type !== 'yes_no'"
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
        >
          <div
            class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50"
          >
            <div class="flex items-center">
              <div class="p-2 bg-emerald-100 rounded-lg mr-3">
                <Users class="w-5 h-5 text-emerald-600" />
              </div>
              <h2 class="text-lg font-semibold text-slate-900">Candidatos / Opciones</h2>
            </div>
            <button
              type="button"
              @click="addOption"
              class="inline-flex items-center px-4 py-2 bg-white border border-emerald-200 text-sm font-medium rounded-lg text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors shadow-sm"
            >
              <Plus class="w-4 h-4 mr-2 text-emerald-500" />
              Añadir Candidato
            </button>
          </div>

          <div class="p-6">
            <TransitionGroup name="list" tag="div" class="space-y-4">
              <div
                v-for="(option, index) in options"
                :key="option.id || index"
                class="flex flex-col sm:flex-row gap-4 p-5 border border-slate-200 rounded-xl bg-slate-50/50 relative group transition-all hover:bg-white hover:border-emerald-200 hover:shadow-sm"
              >
                <!-- Number Indicator -->
                <div
                  class="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm shrink-0 border border-emerald-200 shadow-sm mt-1"
                >
                  {{ index + 1 }}
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 flex-1">
                  <!-- Nombre -->
                  <div>
                    <label
                      class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider"
                      >Nombre</label
                    >
                    <input
                      type="text"
                      v-model="option.label"
                      required
                      class="block w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                      placeholder="Ej. Ana Martínez"
                    />
                  </div>

                  <!-- Siglas -->
                  <div>
                    <label
                      class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider"
                      >Siglas o Partido</label
                    >
                    <input
                      type="text"
                      v-model="option.description"
                      required
                      class="block w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                      placeholder="Ej. UNAM"
                    />
                  </div>

                  <!-- URL Foto -->
                  <div>
                    <label
                      class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider"
                      >URL Foto (Opcional)</label
                    >
                    <div class="relative">
                      <input
                        type="url"
                        v-model="option.photoUrl"
                        class="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                        placeholder="https://..."
                      />
                      <ImageIcon
                        class="w-5 h-5 text-slate-400 absolute left-3 top-2.5 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                <!-- Eliminar Button -->
                <div class="flex items-end justify-end sm:justify-start">
                  <button
                    type="button"
                    @click="removeOption(index)"
                    :disabled="options.length === 1"
                    class="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed border border-transparent hover:border-rose-200"
                    title="Eliminar candidato"
                  >
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>
              </div>
            </TransitionGroup>

            <!-- Empty State (Fallback - though we prevent deleting the last one usually) -->
            <div
              v-if="options.length === 0"
              class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300"
            >
              <Users class="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p class="text-slate-500 font-medium">No hay candidatos registrados.</p>
              <button
                type="button"
                @click="addOption"
                class="mt-3 text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-flex items-center"
              >
                <Plus class="w-4 h-4 mr-1" />
                Añadir el primer candidato
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom Action Bar -->
        <div class="flex items-center justify-end pt-6 border-t border-slate-200 space-x-4">
          <button
            type="button"
            class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors shadow-sm cursor-pointer"
            @click="$router.push('/organizator/rooms')"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="inline-flex items-center px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors shadow-md cursor-pointer"
          >
            <Save v-if="!saving" class="w-5 h-5 mr-2 -ml-1" />
            <Loader2 v-else class="w-5 h-5 mr-2 animate-spin" />
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  </OrganizatorLayout>
</template>
