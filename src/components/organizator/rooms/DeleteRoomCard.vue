<script setup lang="ts">
import { defineComponent } from 'vue';
import { apiFetch } from '../../../utils/apiFetch';

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['roomDeleted', 'cancel']);

const deleteRoom = async () => {
  try {
    const response = await apiFetch(`/api/organizator/elections/${props.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
        if (response.ok) {
          emit('roomDeleted', props.id);
        }
      } catch (error) {
        console.error('Error deleting room:', error);
      }
    }
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center bg-slate-900/50 z-50 backdrop-blur-[1.5px] p-4">
    <div class="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full ring-1 ring-slate-200">
      <h3 class="text-lg font-bold text-slate-900 mb-2">Eliminar Sala</h3>
      <p class="text-sm text-slate-500 mb-6">¿Estás seguro de que deseas eliminar permanentemente esta sala de votación? Esta acción no se puede deshacer.</p>
      <div class="flex justify-end space-x-3">
        <button @click="$emit('cancel')" class="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-sm font-medium shadow-sm">
          Cancelar
        </button>
        <button @click="deleteRoom" class="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium shadow-md">
          Sí, Eliminar
        </button>
      </div>
    </div>
  </div>
</template>
