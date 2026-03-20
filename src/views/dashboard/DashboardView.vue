<script setup lang="ts">
import { ref } from 'vue';
import { UserCircle, LogOut, CheckCircle2, LayoutDashboard } from 'lucide-vue-next';
import VotingCard from '../../components/common/VotingCard.vue';

// Mocked data
const activeVotes = ref([
  { id: 1, title: 'Elección Representantes de Facultad 2026', closingDate: '25 Mar 2026', status: 'Abierta' as const },
  { id: 2, title: 'Aprobación de Presupuesto General Estudiantil', closingDate: '28 Mar 2026', status: 'Abierta' as const },
  { id: 3, title: 'Reforma del Reglamento Interno Deportivo', closingDate: '02 Abr 2026', status: 'Abierta' as const },
]);

const historyVotes = ref([
  { id: 101, title: 'Elección Centro de Estudiantes 2025', date: '10 Nov 2025', status: 'Confirmado' },
  { id: 102, title: 'Encuesta de Satisfacción Comedor', date: '15 Sep 2025', status: 'Confirmado' },
]);
</script>

<template>
  <div class="min-h-screen bg-slate-900 selection:bg-emerald-500/30 font-sans">
    <!-- Navbar -->
    <nav class="bg-slate-800 border-b border-slate-700/50 sticky top-0 z-10 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <span class="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-900 shadow-md">
                <CheckCircle2 class="w-5 h-5" stroke-width="3" />
              </span>
              UpVote
            </span>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 text-slate-300 hover:text-white transition-colors cursor-pointer p-2 rounded-lg hover:bg-slate-700/50">
              <span class="text-sm font-medium hidden sm:block">Juan Pérez</span>
              <UserCircle class="w-7 h-7 text-emerald-500" />
            </div>
            <div class="w-px h-6 bg-slate-700"></div>
            <button class="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-700/50" title="Cerrar sesión">
              <LogOut class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      <!-- Section: Votaciones Activas -->
      <section>
        <div class="mb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <LayoutDashboard class="w-6 h-6 text-emerald-500" />
            Votaciones Activas
          </h2>
          <span class="text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">{{ activeVotes.length }} procesos abiertos</span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <VotingCard 
            v-for="vote in activeVotes" 
            :key="vote.id"
            :id="vote.id"
            :title="vote.title"
            :closing-date="vote.closingDate"
            :status="vote.status"
          />
        </div>
      </section>

      <!-- Section: Mi Historial -->
      <section>
        <h2 class="text-2xl font-bold text-white tracking-tight mb-6">Mi Historial</h2>
        
        <div class="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden shadow-lg">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-700/50">
              <thead class="bg-slate-900/50">
                <tr>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Votación
                  </th>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" class="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Estado de voto
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-700/50">
                <tr v-for="item in historyVotes" :key="item.id" class="hover:bg-slate-700/30 transition-colors group">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{{ item.title }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-slate-400">{{ item.date }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
