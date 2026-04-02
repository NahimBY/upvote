<script setup lang="ts">
import { ref } from 'vue'
import OrganizatorLayout from '../../layouts/OrganizatorLayout.vue'
import {
  Plus,
  Trash2,
  Save,
  FileText,
  Calendar,
  Users,
  User,
  AlignLeft,
  Image as ImageIcon,
  ChevronRight,
  ChevronDown,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { apiFetch } from '../../utils/apiFetch'

const router = useRouter()

// Form Data Model
const formData = ref({
  name: '',
  description: '',
  type: 'single_choice',
  startDate: '',
  endDate: '',
})

// Dynamic Candidates Model
const candidates = ref([{ id: Date.now(), name: '', acronym: '', photoUrl: '' }])

const addCandidate = () => {
  candidates.value.push({ id: Date.now(), name: '', acronym: '', photoUrl: '' })
}

const removeCandidate = (id: number) => {
  if (candidates.value.length > 1) {
    candidates.value = candidates.value.filter((c) => c.id !== id)
  }
}

const createElection = async () => {
  try {
    const payload: any = {
      title: formData.value.name,
      description: formData.value.description,
      type: formData.value.type,
      startDate: new Date(formData.value.startDate).toISOString(),
      endDate: new Date(formData.value.endDate).toISOString(),
      allowResultsBeforeClose: false,
      maxSelections: formData.value.type === 'multiple_choice' ? candidates.value.length : 1,
    }

    if (formData.value.type !== 'yes_no') {
      payload.options = candidates.value.map((c) => ({
        label: c.name,
        description: c.acronym,
      }))
    }

    const response = await apiFetch('/api/organizator/elections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.message || 'Error de la petición')
    }

    const data = await response.json()
    console.log('Creada:', data)
    router.push('/organizator/rooms')
  } catch (error) {
    console.error('Error creating election:', error)
    alert('No se pudo crear la sala. Verifica los datos.')
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
          <h2 class="text-sm font-medium text-slate-500">Crear Sala de Votación</h2>
        </div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Crear Sala de Votación</h1>
        <p class="mt-1 text-sm text-slate-500">
          Configura una nueva elección definiendo sus detalles, fechas y opciones de candidatos.
        </p>
      </div>

      <form @submit.prevent="createElection" class="space-y-6">
        <!-- Room Details Block -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
        >
          <div class="px-6 py-4 border-b border-slate-100 flex items-center bg-slate-50">
            <div class="p-2 bg-emerald-100 rounded-lg mr-3">
              <FileText class="w-5 h-5 text-emerald-600" />
            </div>
            <h2 class="text-lg font-semibold text-slate-900">Detalles de la Elección</h2>
          </div>

          <div class="p-6 space-y-6">
            <div>
              <label for="name" class="block text-sm font-medium text-slate-700 mb-1.5"
                >Nombre de la elección</label
              >
              <input
                type="text"
                id="name"
                v-model="formData.name"
                required
                class="block w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Ej. Elección Consejo Estudiantil 2026"
              />
            </div>

            <div>
              <label for="description" class="block text-sm font-medium text-slate-700 mb-1.5"
                >Descripción</label
              >
              <textarea
                id="description"
                rows="3"
                v-model="formData.description"
                class="block w-full px-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                placeholder="Explica el propósito de esta votación u ofrece contexto adicional..."
              ></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
              <div>
                <label for="type" class="block text-sm font-medium text-slate-700 mb-1.5"
                  >Tipo de votación</label
                >
                <div class="relative">
                  <select
                    id="type"
                    v-model="formData.type"
                    class="block w-full pl-4 pr-10 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none cursor-pointer"
                  >
                    <option value="single_choice">Unipersonal</option>
                    <option value="multiple_choice">Múltiple</option>
                    <option value="yes_no">Aprobación (Sí/No)</option>
                  </select>
                  <ChevronDown
                    class="w-5 h-5 text-slate-400 absolute right-3 top-3 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label for="startDate" class="block text-sm font-medium text-slate-700 mb-1.5"
                  >Fecha de Inicio</label
                >
                <div class="relative">
                  <input
                    type="datetime-local"
                    id="startDate"
                    v-model="formData.startDate"
                    required
                    class="block w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:m-0"
                  />
                  <Calendar
                    class="w-5 h-5 text-slate-400 absolute right-3 top-3 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label for="endDate" class="block text-sm font-medium text-slate-700 mb-1.5"
                  >Fecha de Cierre</label
                >
                <div class="relative">
                  <input
                    type="datetime-local"
                    id="endDate"
                    v-model="formData.endDate"
                    required
                    class="block w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:m-0"
                  />
                  <Calendar
                    class="w-5 h-5 text-slate-400 absolute right-3 top-3 pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dynamic Candidates Block -->
        <div
          v-if="formData.type !== 'yes_no'"
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
              @click="addCandidate"
              class="inline-flex items-center px-4 py-2 bg-white border border-emerald-200 text-sm font-medium rounded-lg text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors shadow-sm"
            >
              <Plus class="w-4 h-4 mr-2 text-emerald-500" />
              Añadir Candidato
            </button>
          </div>

          <div class="p-6">
            <TransitionGroup name="list" tag="div" class="space-y-4">
              <div
                v-for="(candidate, index) in candidates"
                :key="candidate.id"
                class="flex flex-col sm:flex-row gap-5 p-5 border border-slate-200 rounded-2xl bg-white relative group transition-all duration-300 hover:border-emerald-300 hover:shadow-[0_8px_30px_-4px_rgba(16,185,129,0.12)] overflow-hidden pl-7"
              >
                <!-- Elegante barra lateral animada -->
                <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200 group-hover:bg-emerald-500 transition-colors duration-300"></div>

                <!-- Number Indicator -->
                <div
                  class="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 text-slate-500 font-bold text-sm shrink-0 border border-slate-100 shadow-sm mt-1 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-colors"
                >
                  {{ index + 1 }}
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
                  <!-- Nombre -->
                  <div class="relative group/input">
                    <label class="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider group-focus-within/input:text-emerald-600 transition-colors">
                      Nombre del Candidato u Opción
                    </label>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-emerald-500 transition-colors">
                        <User class="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        v-model="candidate.name"
                        required
                        class="block w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all sm:text-sm"
                        placeholder="Ej. Ing. Ana Martínez / Planilla A"
                      />
                    </div>
                  </div>

                  <!-- Descripción -->
                  <div class="relative group/input">
                    <label class="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider group-focus-within/input:text-emerald-600 transition-colors">
                      Breve Descripción
                    </label>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/input:text-emerald-500 transition-colors">
                        <AlignLeft class="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        v-model="candidate.acronym"
                        required
                        class="block w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all sm:text-sm"
                        placeholder="Ej. Estudiante de la Facultad de Ingeniería"
                      />
                    </div>
                  </div>
                </div>

                <!-- Eliminar Button -->
                <div class="flex items-center justify-end sm:pl-2">
                  <button
                    type="button"
                    @click="removeCandidate(candidate.id)"
                    :disabled="candidates.length === 1"
                    class="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all focus:outline-none disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed border border-transparent hover:border-rose-100 hover:shadow-sm"
                    title="Eliminar candidato"
                  >
                    <Trash2 class="w-5 h-5 pointer-events-none" />
                  </button>
                </div>
              </div>
            </TransitionGroup>

            <!-- Empty State (Fallback - though we prevent deleting the last one usually) -->
            <div
              v-if="candidates.length === 0"
              class="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300"
            >
              <Users class="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p class="text-slate-500 font-medium">No hay candidatos registrados.</p>
              <button
                type="button"
                @click="addCandidate"
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
            class="inline-flex items-center px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors shadow-md cursor-pointer"
          >
            <Save class="w-5 h-5 mr-2 -ml-1" />
            Guardar Sala de Votación
          </button>
        </div>
      </form>
    </div>
  </OrganizatorLayout>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
