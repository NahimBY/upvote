<script setup lang="ts">
import { ref, computed } from 'vue';
import AdminLayout from '../../layouts/AdminLayout.vue';
import { Search, Filter, Plus, Edit2, PauseCircle, PlayCircle, BarChart2, Trash2, Building2 } from 'lucide-vue-next';

// Mock Data
const rooms = ref([
  { id: 1, name: 'Elección Presidencia 2026', status: 'Activa', participation: 45, totalVoters: 1000 },
  { id: 2, name: 'Consejo Estudiantil', status: 'Pausada', participation: 22, totalVoters: 500 },
  { id: 3, name: 'Votación Presupuesto', status: 'Finalizada', participation: 89, totalVoters: 250 },
  { id: 4, name: 'Mejor Proyecto de Grado', status: 'Activa', participation: 12, totalVoters: 150 },
]);

const searchQuery = ref('');
const statusFilter = ref('Todas');

const filteredRooms = computed(() => {
  return rooms.value.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesStatus = statusFilter.value === 'Todas' || room.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Activa': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Pausada': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Finalizada': return 'bg-slate-100 text-slate-800 border-slate-200';
    default: return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

const toggleStatus = (id: number) => {
  const room = rooms.value.find(r => r.id === id);
  if (room) {
    if (room.status === 'Activa') room.status = 'Pausada';
    else if (room.status === 'Pausada') room.status = 'Activa';
  }
};
</script>

<template>
  <AdminLayout>
    <div class="max-w-7xl mx-auto space-y-6 pb-12">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Administrar Salas</h1>
          <p class="mt-1 text-sm text-slate-500">Gestiona, edita y supervisa las salas de votación de tu organización.</p>
        </div>
        <div>
          <RouterLink 
            to="/admin/rooms/create"
            class="inline-flex items-center px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
          >
            <Plus class="w-5 h-5 mr-2 -ml-1" />
            Crear Nueva Sala
          </RouterLink>
        </div>
      </div>

      <!-- Filters & Actions Bar -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <!-- Search -->
        <div class="relative flex-1 w-full">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search class="w-5 h-5" />
          </div>
          <input 
            v-model="searchQuery"
            type="text" 
            class="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-slate-50 hover:bg-white"
            placeholder="Buscar sala por nombre..."
          />
        </div>
        
        <!-- Filter Dropdown -->
        <div class="sm:w-64 relative w-full">
           <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Filter class="w-4 h-4" />
          </div>
          <select 
            v-model="statusFilter"
            class="block w-full pl-10 pr-10 py-2.5 text-slate-700 border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg appearance-none border cursor-pointer bg-slate-50 hover:bg-white font-medium transition-colors"
          >
            <option value="Todas">Todos los estados</option>
            <option value="Activa">Activa</option>
            <option value="Pausada">Pausada</option>
            <option value="Finalizada">Finalizada</option>
          </select>
        </div>
      </div>

      <!-- Data Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nombre de la Sala
                </th>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Participación
                </th>
                <th scope="col" class="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-100">
              <tr 
                v-for="room in filteredRooms" 
                :key="room.id"
                class="hover:bg-slate-50/80 transition-colors group"
              >
                <!-- Sala Info -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-sm group-hover:scale-105 transition-transform">
                      {{ room.name.charAt(0) }}
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-semibold text-slate-900">{{ room.name }}</div>
                      <div class="text-xs text-slate-500 mt-0.5">ID: #{{ room.id.toString().padStart(4, '0') }}</div>
                    </div>
                  </div>
                </td>
                
                <!-- Estado Badge -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border"
                    :class="getStatusColor(room.status)"
                  >
                    <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="{'bg-emerald-500': room.status === 'Activa', 'bg-amber-500': room.status === 'Pausada', 'bg-slate-400': room.status === 'Finalizada'}"></span>
                    {{ room.status }}
                  </span>
                </td>

                <!-- Participacion Bar -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span class="text-sm text-slate-900 font-bold w-10">{{ room.participation }}%</span>
                    <div class="w-24 sm:w-32 bg-slate-100 rounded-full h-2.5 ml-2 overflow-hidden border border-slate-200">
                      <div 
                        class="bg-emerald-500 h-full rounded-full" 
                        :style="{ width: `${room.participation}%` }"
                      ></div>
                    </div>
                  </div>
                  <div class="text-xs text-slate-500 mt-1.5 font-medium ml-12">{{ Math.floor((room.participation * room.totalVoters) / 100) }} de {{ room.totalVoters }} votos</div>
                </td>

                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-1">
                    <button class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors" title="Resultados y Estadísticas">
                      <BarChart2 class="w-5 h-5" />
                    </button>
                    <button class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors" title="Editar Sala">
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <!-- Toggle Activa/Pausada -->
                    <button 
                      @click="toggleStatus(room.id)"
                      v-if="room.status !== 'Finalizada'"
                      class="p-2 rounded-lg transition-colors"
                      :class="room.status === 'Activa' ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'"
                      :title="room.status === 'Activa' ? 'Pausar Elección' : 'Reanudar Elección'"
                    >
                      <PauseCircle v-if="room.status === 'Activa'" class="w-5 h-5" />
                      <PlayCircle v-else class="w-5 h-5" />
                    </button>
                    <button class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar Sala">
                      <Trash2 class="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
              <!-- Empty State -->
              <tr v-if="filteredRooms.length === 0">
                <td colspan="4" class="px-6 py-16 text-center">
                  <Building2 class="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p class="text-slate-900 text-sm font-semibold">No se encontraron salas</p>
                  <p class="text-slate-500 text-sm mt-1">Ajusta los filtros o intenta con otra búsqueda.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>
