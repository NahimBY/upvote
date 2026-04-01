<script setup lang="ts">
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
  <Transition
    enter-active-class="transition duration-100 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-100 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center bg-slate-900/50 z-50 backdrop-blur-[1.5px] p-4">
      <div class="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full ring-1 ring-slate-200">
        <h3 class="text-lg font-bold text-slate-900 mb-2">Eliminar Sala</h3>
        <p class="text-sm text-slate-500 mb-6">¿Estás seguro de que deseas eliminar permanentemente esta sala de votación? Esta acción no se puede deshacer.</p>
        <div class="flex justify-end space-x-3">
          <button @click="$emit('cancel')" class="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-sm font-medium shadow-sm cursor-pointer">
            Cancelar
          </button>
          <button @click="deleteRoom" class="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium shadow-md cursor-pointer">
            Sí, Eliminar
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
