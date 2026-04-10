<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import OrganizatorLayout from '../../layouts/OrganizatorLayout.vue'
import { apiFetch } from '../../utils/apiFetch'
import { BarChart2, TrendingUp, CalendarClock, PieChart } from 'lucide-vue-next'

interface Overview {
  totalElections: number
  totalVotes: number
  activeElections: number
  draftElections: number
  closedElections: number
  archivedElections: number
  averageParticipation: number
  byStatus: Record<string, number>
}

interface TimelineBucket {
  date: string
  count: number
}

interface UpcomingElection {
  _id: string
  title: string
  status: string
  startDate: string
  endDate: string
}

const overview = ref<Overview | null>(null)
const timeline = ref<TimelineBucket[]>([])
const upcoming = ref<UpcomingElection[]>([])
const days = ref(14)

const maxTimelineCount = computed(() =>
  Math.max(1, ...timeline.value.map((b) => b.count)),
)

const formatDayLabel = (iso: string) => {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const fetchOverview = async () => {
  try {
    const res = await apiFetch('/api/organizator/stats/overview')
    if (!res.ok) return
    const parsed = await res.json()
    overview.value = parsed?.data ?? null
  } catch (error) {
    console.error('Error fetching overview:', error)
  }
}

const fetchTimeline = async () => {
  try {
    const res = await apiFetch(`/api/organizator/stats/votes-timeline?days=${days.value}`)
    if (!res.ok) return
    const parsed = await res.json()
    timeline.value = parsed?.data?.timeline ?? []
  } catch (error) {
    console.error('Error fetching timeline:', error)
  }
}

const fetchUpcoming = async () => {
  try {
    const res = await apiFetch('/api/organizator/elections/upcoming')
    if (!res.ok) return
    const parsed = await res.json()
    upcoming.value = parsed?.data ?? []
  } catch (error) {
    console.error('Error fetching upcoming:', error)
  }
}

const changeDays = async (value: number) => {
  days.value = value
  await fetchTimeline()
}

onMounted(() => {
  fetchOverview()
  fetchTimeline()
  fetchUpcoming()
})
</script>

<template>
  <OrganizatorLayout>
    <div class="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Estadísticas</h1>
        <p class="mt-1 text-sm text-slate-500">
          Métricas detalladas de tus salas de votación.
        </p>
      </div>

      <!-- Overview cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div class="p-3 inline-block rounded-xl bg-emerald-50 text-emerald-600 mb-4">
            <BarChart2 class="w-6 h-6" />
          </div>
          <p class="text-3xl font-bold text-slate-900 tracking-tight">
            {{ overview?.totalElections ?? '...' }}
          </p>
          <p class="text-sm font-medium text-slate-500 mt-1">Total de salas</p>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div class="p-3 inline-block rounded-xl bg-blue-50 text-blue-600 mb-4">
            <PieChart class="w-6 h-6" />
          </div>
          <p class="text-3xl font-bold text-slate-900 tracking-tight">
            {{ overview?.totalVotes ?? '...' }}
          </p>
          <p class="text-sm font-medium text-slate-500 mt-1">Votos emitidos</p>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div class="p-3 inline-block rounded-xl bg-amber-50 text-amber-600 mb-4">
            <TrendingUp class="w-6 h-6" />
          </div>
          <p class="text-3xl font-bold text-slate-900 tracking-tight">
            {{ overview?.averageParticipation ?? '...' }}%
          </p>
          <p class="text-sm font-medium text-slate-500 mt-1">Participación promedio</p>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div class="p-3 inline-block rounded-xl bg-purple-50 text-purple-600 mb-4">
            <CalendarClock class="w-6 h-6" />
          </div>
          <p class="text-3xl font-bold text-slate-900 tracking-tight">
            {{ overview?.activeElections ?? '...' }}
          </p>
          <p class="text-sm font-medium text-slate-500 mt-1">Activas / publicadas</p>
        </div>
      </div>

      <!-- Status breakdown -->
      <div
        v-if="overview"
        class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
      >
        <h3 class="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4 mb-4">
          Distribución por estado
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div
            v-for="(count, status) in overview.byStatus"
            :key="status"
            class="rounded-xl border border-slate-200 p-4"
          >
            <p class="text-2xl font-bold text-slate-900">{{ count }}</p>
            <p class="text-xs uppercase tracking-wider text-slate-500 mt-1">{{ status }}</p>
          </div>
        </div>
      </div>

      <!-- Timeline chart -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <h3 class="text-lg font-semibold text-slate-900">Tendencia de votos</h3>
          <div class="flex gap-2">
            <button
              v-for="opt in [7, 14, 30]"
              :key="opt"
              @click="changeDays(opt)"
              :class="[
                'px-3 py-1 rounded-lg text-xs font-medium border transition-colors',
                days === opt
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400',
              ]"
            >
              {{ opt }} días
            </button>
          </div>
        </div>
        <div v-if="timeline.length === 0" class="text-center py-12 text-slate-400">
          Sin datos de votos en el rango seleccionado.
        </div>
        <div v-else class="flex items-end gap-2 px-2 pt-4 pb-2 min-h-[240px] overflow-x-auto">
          <div
            v-for="bucket in timeline"
            :key="bucket.date"
            class="flex-1 min-w-[24px] flex flex-col items-center justify-end gap-2"
          >
            <span class="text-[10px] font-semibold text-slate-700">{{ bucket.count }}</span>
            <div
              class="w-full bg-emerald-500 rounded-t-md transition-all"
              :style="{ height: `${(bucket.count / maxTimelineCount) * 180 + 4}px` }"
            ></div>
            <span class="text-[10px] text-slate-500 whitespace-nowrap">
              {{ formatDayLabel(bucket.date) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Upcoming elections -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 class="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4 mb-4">
          Próximas salas
        </h3>
        <div v-if="upcoming.length === 0" class="text-center py-8 text-slate-400 text-sm">
          No tienes salas programadas próximamente.
        </div>
        <ul v-else class="divide-y divide-slate-100">
          <li
            v-for="el in upcoming"
            :key="el._id"
            class="py-3 flex items-center justify-between"
          >
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ el.title }}</p>
              <p class="text-xs text-slate-500 mt-0.5">
                Inicia el {{ formatDate(el.startDate) }}
              </p>
            </div>
            <span
              class="text-xs font-medium px-2.5 py-1 rounded-md border bg-slate-50 text-slate-700 border-slate-200"
            >
              {{ el.status }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </OrganizatorLayout>
</template>
