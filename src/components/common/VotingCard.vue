<script setup lang="ts">
import { Calendar, Vote } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()

defineProps<{
  id: string | number
  title: string
  description: string
  startDate: string
  endDate: string
  status: string
}>()

const getStatusText = (status: string) => {
  switch (status) {
    case 'open':
      return 'Abierta'
    case 'closed':
      return 'Cerrada'
    case 'published':
      return 'Publicada'
    default:
      return status
  }
}

const getStatusClasses = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'closed':
      return 'bg-red-500/10 text-red-400 border border-red-500/20'
    case 'published':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    default:
      return 'bg-slate-700 text-slate-400 border border-slate-600'
  }
}
</script>

<template>
  <div
    class="bg-slate-800 border border-slate-700/50 rounded-xl p-6 hover:border-emerald-500/30 transition-all group flex flex-col justify-between"
  >
    <div>
      <div class="flex justify-between items-start mb-4">
        <h3
          @click="router.push(`/election/${id}`)"
          class="text-lg font-semibold text-white cursor-pointer group-hover:text-emerald-400 transition-colors line-clamp-2 pr-4"
        >
          {{ title }}
        </h3>
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0"
          :class="getStatusClasses(status)"
          :title="getStatusText(status)"
        >
          {{ getStatusText(status) }}
        </span>
      </div>

      <p class="text-sm text-slate-400 mb-6 line-clamp-3">
        {{ description }}
      </p>

      <div class="flex gap-4">
        <div v-if="status === 'published'" class="flex items-center text-sm text-slate-400 mb-6">
          <Calendar class="w-4 h-4 mr-2 opacity-70" />
          <span>Inicia: {{ startDate }}</span>
        </div>

        <div class="flex items-center text-sm text-slate-400 mb-6">
          <Calendar class="w-4 h-4 mr-2 opacity-70" />
          <span>Cierra: {{ endDate }}</span>
        </div>
      </div>
    </div>

    <button
      v-if="status === 'open'"
      @click="router.push(`/election/${id}`)"
      class="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-slate-900 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all font-semibold"
    >
      <Vote class="w-5 h-5 mr-2" />
      Votar
    </button>
    <button
      v-if="status === 'closed'"
      disabled
      class="w-full flex justify-center items-center py-2.5 px-4 border border-slate-700 rounded-lg text-sm font-medium text-slate-500 bg-slate-900/50 cursor-not-allowed transition-all font-semibold"
    >
      Proceso cerrado
    </button>
    <button
      v-if="status === 'published'"
      @click="router.push(`/election/${id}`)"
      class="w-full flex justify-center items-center py-2.5 px-4 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-slate-200 hover:border-slate-700/50 cursor-pointer transition-all font-semibold"
    >
      Ver proceso
    </button>
  </div>
</template>
