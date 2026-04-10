<script setup lang="ts">
import { ref, watch } from 'vue'
import { apiFetch } from '../../../utils/apiFetch'
import { X, BarChart2, Trophy } from 'lucide-vue-next'

interface OptionResult {
  id: string
  label: string
  votes: number
  percentage: number
}

interface DistributionData {
  electionId: string
  totalVotes: number
  options: OptionResult[]
}

const props = defineProps<{
  isOpen: boolean
  electionId: string
  electionTitle?: string
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const data = ref<DistributionData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const fetchDistribution = async () => {
  if (!props.electionId) return
  loading.value = true
  error.value = null
  data.value = null
  try {
    const res = await apiFetch(`/api/organizator/elections/${props.electionId}/distribution`)
    const parsed = await res.json()
    if (!res.ok) {
      error.value = parsed?.message || 'No se pudo obtener la distribución'
      return
    }
    data.value = parsed?.data ?? null
  } catch (e) {
    console.error('Error fetching distribution:', e)
    error.value = 'Error de red al obtener la distribución'
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.isOpen, props.electionId],
  ([open]) => {
    if (open) fetchDistribution()
  },
)

const sortedOptions = () => {
  if (!data.value) return []
  return [...data.value.options].sort((a, b) => b.votes - a.votes)
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-100 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-100 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <!-- Header -->
        <div class="flex items-start justify-between p-6 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <BarChart2 class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Resultados</h3>
              <p class="text-sm text-slate-500 mt-0.5">
                {{ electionTitle || 'Distribución de votos por opción' }}
              </p>
            </div>
          </div>
          <button
            class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            @click="emit('close')"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto">
          <div v-if="loading" class="py-12 text-center text-slate-500 text-sm">
            Cargando resultados...
          </div>

          <div v-else-if="error" class="py-12 text-center text-rose-600 text-sm">
            {{ error }}
          </div>

          <div v-else-if="data && data.totalVotes === 0" class="py-12 text-center">
            <BarChart2 class="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p class="text-slate-700 text-sm font-semibold">Aún no hay votos</p>
            <p class="text-slate-500 text-xs mt-1">
              Cuando los electores voten, los resultados aparecerán aquí.
            </p>
          </div>

          <div v-else-if="data" class="space-y-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-500">Total de votos emitidos</span>
              <span class="font-bold text-slate-900 text-lg">{{ data.totalVotes }}</span>
            </div>

            <div class="space-y-3">
              <div
                v-for="(option, index) in sortedOptions()"
                :key="option.id"
                class="rounded-xl border border-slate-200 p-4 hover:border-emerald-300 transition-colors"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <Trophy
                      v-if="index === 0 && option.votes > 0"
                      class="w-4 h-4 text-amber-500"
                    />
                    <span class="text-sm font-semibold text-slate-900">{{ option.label }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-sm font-bold text-slate-900">{{ option.percentage }}%</span>
                    <span class="text-xs text-slate-500 ml-2">({{ option.votes }})</span>
                  </div>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="index === 0 && option.votes > 0 ? 'bg-emerald-500' : 'bg-emerald-300'"
                    :style="{ width: `${option.percentage}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            @click="emit('close')"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
