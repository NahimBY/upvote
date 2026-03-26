<script setup lang="ts">
import AdminLayout from '../../layouts/AdminLayout.vue';
import { Users, Building2, CheckCircle2, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-vue-next';

// Mock data
const stats = [
  { name: 'Total de Votos', value: '45,231', change: '+12.5%', changeType: 'positive', icon: CheckCircle2 },
  { name: 'Salas Activas', value: '12', change: '+2 nuevas', changeType: 'positive', icon: Building2 },
  { name: 'Usuarios Registrados', value: '2,845', change: '-1.2%', changeType: 'negative', icon: Users },
];

const recentActivity = [
  { user: 'Juan Pérez', action: 'votó en', room: 'Elección Presidencia 2026', time: 'Hace 5 min' },
  { user: 'María Gómez', action: 'creó la sala', room: 'Consejo Estudiantil', time: 'Hace 32 min' },
  { user: 'Sistema', action: 'cerró la sala', room: 'Votación Presupuesto', time: 'Hace 2 horas' },
  { user: 'Carlos Silva', action: 'se registró', room: '', time: 'Hace 5 horas' },
];
</script>

<template>
  <AdminLayout>
    <div class="max-w-7xl mx-auto space-y-6">
      
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Cifras Generales</h1>
          <p class="mt-1 text-sm text-slate-500">Resumen y métricas de uso de la plataforma de votaciones.</p>
        </div>
        <div class="mt-4 md:mt-0">
          <button class="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors shadow-sm">
            <Activity class="w-4 h-4 mr-2" />
            Descargar Reporte
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="stat in stats" :key="stat.name" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div class="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <component :is="stat.icon" class="w-6 h-6" />
            </div>
            <div 
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="stat.changeType === 'positive' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
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
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2 flex flex-col">
          <h3 class="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4 mb-4">Tendencia de Votos</h3>
          <div class="flex-1 flex flex-col items-center justify-center text-center py-12">
             <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
               <Activity class="w-8 h-8 text-slate-300" />
             </div>
             <p class="text-slate-600 font-medium">Gráfico de actividad en desarrollo</p>
             <p class="text-sm text-slate-400 mt-1 max-w-sm">Conecta la plataforma a tu proveedor de métricas o base de datos temporal para poblar el gráfico.</p>
          </div>
        </div>

        <!-- Recent Activity Feed -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 class="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-4 mb-4">Actividad Reciente</h3>
          <div class="flow-root">
            <ul role="list" class="-mb-8">
              <li v-for="(activity, index) in recentActivity" :key="index">
                <div class="relative pb-8">
                  <span v-if="index !== recentActivity.length - 1" class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true"></span>
                  <div class="relative flex space-x-3">
                    <div>
                      <span class="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center ring-8 ring-white">
                        <Users class="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      </span>
                    </div>
                    <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p class="text-sm text-slate-500">
                          <span class="font-medium text-slate-900">{{ activity.user }}</span> {{ activity.action }} <span v-if="activity.room" class="font-medium text-slate-900">{{ activity.room }}</span>
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
  </AdminLayout>
</template>
