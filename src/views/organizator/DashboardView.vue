<script setup lang="ts">
import OrganizatorLayout from '../../layouts/OrganizatorLayout.vue'
import {
  Users,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  PieChart,
  TrendingUp,
} from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import { apiFetch } from '../../utils/apiFetch'
import { downloadOrganizatorReport } from '../../utils/exportReport'

const downloading = ref(false)
const handleDownloadReport = async () => {
  if (downloading.value) return
  downloading.value = true
  try {
    await downloadOrganizatorReport()
  } catch (error) {
    console.error('Error generating report:', error)
    alert('No se pudo generar el reporte')
  } finally {
    downloading.value = false
  }
}

const stats = ref([
  {
    name: 'Total de Votos (Mis Salas)',
    value: '...',
    change: '',
    changeType: 'neutral',
    icon: CheckCircle2,
  },
  { name: 'Mis Salas Activas', value: '...', change: '', changeType: 'neutral', icon: Building2 },
  { name: 'Total de Salas', value: '...', change: '', changeType: 'neutral', icon: PieChart },
  {
    name: 'Participación Promedio',
    value: '...',
    change: '',
    changeType: 'neutral',
    icon: TrendingUp,
  },
])

const recentActivity = ref<any[]>([])
const timeline = ref<{ date: string; count: number }[]>([])

const maxTimelineCount = computed(() =>
  Math.max(1, ...timeline.value.map((b) => b.count)),
)

const formatDayLabel = (iso: string) => {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
}

const fetchDashboardStats = async () => {
  try {
    const response = await apiFetch('/api/organizator/dashboard')
    if (response.ok) {
      const result = await response.json()
      const computedStats = result?.data?.stats
      if (computedStats) {
        if (stats.value[0]) {
          stats.value[0].value = computedStats.totalVotes?.toString() ?? '0'
          stats.value[0].change = 'Sistema en vivo'
          stats.value[0].changeType = 'positive'
        }
        if (stats.value[1]) {
          stats.value[1].value = computedStats.activeRooms?.toString() ?? '0'
          stats.value[1].change = 'Métricas online'
          stats.value[1].changeType = 'positive'
        }
      }
      recentActivity.value = result?.data?.recentActivity ?? []
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
  }
}

const fetchOverview = async () => {
  try {
    const response = await apiFetch('/api/organizator/stats/overview')
    if (!response.ok) return
    const result = await response.json()
    const data = result?.data
    if (!data) return
    if (stats.value[2]) {
      stats.value[2].value = (data.totalElections ?? 0).toString()
      stats.value[2].change = `${data.draftElections ?? 0} en borrador`
      stats.value[2].changeType = 'positive'
    }
    if (stats.value[3]) {
      stats.value[3].value = `${data.averageParticipation ?? 0}%`
      stats.value[3].change = `${data.closedElections ?? 0} cerradas`
      stats.value[3].changeType = (data.averageParticipation ?? 0) >= 50 ? 'positive' : 'negative'
    }
  } catch (error) {
    console.error('Error fetching stats overview:', error)
  }
}

const fetchTimeline = async () => {
  try {
    const response = await apiFetch('/api/organizator/stats/votes-timeline?days=7')
    if (!response.ok) return
    const result = await response.json()
    timeline.value = result?.data?.timeline ?? []
  } catch (error) {
    console.error('Error fetching votes timeline:', error)
  }
}

onMounted(() => {
  fetchDashboardStats()
  fetchOverview()
  fetchTimeline()
})
</script>

<template>
  <OrganizatorLayout>
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Cifras Generales</h1>
          <p class="mt-1 text-sm text-slate-500">
            Resumen y métricas de uso de la plataforma de votaciones.
          </p>
        </div>
        <div class="mt-4 md:mt-0">
          <button
            class="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="downloading"
            @click="handleDownloadReport"
          >
            <Activity class="w-4 h-4 mr-2" />
            {{ downloading ? 'Generando...' : 'Descargar Reporte' }}
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="stat in stats"
          :key="stat.name"
          class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between">
            <div class="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <component :is="stat.icon" class="w-6 h-6" />
            </div>
            <div
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="
                stat.changeType === 'positive'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              "
            >
              <ArrowUpRight v-if="stat.changeType === 'positive'" class="w-3 h-3 mr-1" />
              <ArrowDownRight v-else class="w-3 h-3 mr-1" />
              {{ stat.change }}
            </div>
          </div>
          <div class="mt-4">
            <p class="text-3xl font-bold text-slate-900 tracking-tight">{{ stat.value }}</p>
            <p class="text-sm font-medium text-slate-500 mt-1">{{ stat.name }}</p>
          </div>
        </div>
      </div>

      <!-- Main Columns Configuration -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Activity Chart / Main Area Placeholder -->
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2 flex flex-col"
        >
          <h3 class="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4 mb-4">
            Tendencia de Votos (últimos 7 días)
          </h3>
          <div v-if="timeline.length === 0" class="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <Activity class="w-8 h-8 text-slate-300" />
            </div>
            <p class="text-slate-600 font-medium">Sin datos aún</p>
            <p class="text-sm text-slate-400 mt-1 max-w-sm">
              Cuando lleguen votos en tus salas, aparecerá aquí su tendencia diaria.
            </p>
          </div>
          <div v-else class="flex-1 flex items-end gap-3 px-2 pt-4 pb-2 min-h-[220px]">
            <div
              v-for="bucket in timeline"
              :key="bucket.date"
              class="flex-1 flex flex-col items-center justify-end gap-2"
            >
              <span class="text-xs font-semibold text-slate-700">{{ bucket.count }}</span>
              <div
                class="w-full bg-emerald-500 rounded-t-md transition-all"
                :style="{ height: `${(bucket.count / maxTimelineCount) * 160 + 4}px` }"
              ></div>
              <span class="text-[10px] text-slate-500 capitalize">{{ formatDayLabel(bucket.date) }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Activity Feed -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 class="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4 mb-4">
            Actividad Reciente
          </h3>
          <div class="flow-root">
            <ul role="list" class="-mb-8">
              <li v-for="(activity, index) in recentActivity" :key="index">
                <div class="relative pb-8">
                  <span
                    v-if="index !== recentActivity.length - 1"
                    class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                    aria-hidden="true"
                  ></span>
                  <div class="relative flex space-x-3">
                    <div>
                      <span
                        class="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center ring-8 ring-white"
                      >
                        <Users class="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      </span>
                    </div>
                    <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p class="text-sm text-slate-500">
                          <span class="font-medium text-slate-900">{{ activity.user }}</span>
                          {{ activity.action }}
                          <span v-if="activity.room" class="font-medium text-slate-900">{{
                            activity.room
                          }}</span>
                        </p>
                      </div>
                      <div class="whitespace-nowrap text-right text-xs text-slate-500">
                        <time>{{ activity.time }}</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </OrganizatorLayout>
</template>
