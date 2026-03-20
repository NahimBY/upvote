<script setup lang="ts">
import { Calendar, CheckCircle2 } from 'lucide-vue-next';

defineProps<{
  id: string | number;
  title: string;
  closingDate: string;
  status: 'Abierta' | 'Cerrada';
}>();
</script>

<template>
  <div class="bg-slate-800 border border-slate-700/50 rounded-xl p-6 hover:border-emerald-500/30 transition-all group flex flex-col justify-between">
    <div>
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 pr-4">
          {{ title }}
        </h3>
        <span 
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0"
          :class="status === 'Abierta' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400 border border-slate-600'"
        >
          {{ status }}
        </span>
      </div>
      
      <div class="flex items-center text-sm text-slate-400 mb-6">
        <Calendar class="w-4 h-4 mr-2 opacity-70" />
        <span>Cierra: {{ closingDate }}</span>
      </div>
    </div>

    <button 
      v-if="status === 'Abierta'"
      class="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-slate-900 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all font-semibold"
    >
      <CheckCircle2 class="w-4 h-4 mr-2" />
      Emitir Voto
    </button>
    <button 
      v-else
      disabled
      class="w-full flex justify-center items-center py-2.5 px-4 border border-slate-700 rounded-lg text-sm font-medium text-slate-500 bg-slate-900/50 cursor-not-allowed transition-all font-semibold"
    >
      Proceso cerrado
    </button>
  </div>
</template>
