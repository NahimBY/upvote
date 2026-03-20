<script setup lang="ts">
import { ref } from 'vue';
import { User, Mail, Lock, UserPlus } from 'lucide-vue-next';

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const acceptTerms = ref(false);

const handleRegister = () => {
  console.log('Register attempt', { name: name.value, email: email.value, acceptTerms: acceptTerms.value });
};
</script>

<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-emerald-500/30">
    <div class="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl shadow-slate-900/50 border border-slate-700/50 p-8 my-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2 tracking-tight">Crear Cuenta</h1>
        <p class="text-slate-400">Únete a UpVote para participar</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-5">
        <div>
          <label for="name" class="block text-sm font-medium text-slate-300 mb-1.5">Nombre Completo</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User class="w-5 h-5" />
            </div>
            <input 
              id="name"
              v-model="name" 
              type="text" 
              required
              class="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="Juan Pérez"
            />
          </div>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-slate-300 mb-1.5">Correo electrónico</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail class="w-5 h-5" />
            </div>
            <input 
              id="email"
              v-model="email" 
              type="email" 
              required
              class="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="tu@correo.com"
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-slate-300 mb-1.5">Contraseña</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock class="w-5 h-5" />
            </div>
            <input 
              id="password"
              v-model="password" 
              type="password" 
              required
              class="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>
        
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-slate-300 mb-1.5">Confirmar Contraseña</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock class="w-5 h-5" />
            </div>
            <input 
              id="confirmPassword"
              v-model="confirmPassword" 
              type="password" 
              required
              class="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input 
              id="terms" 
              v-model="acceptTerms"
              type="checkbox" 
              required
              class="w-4 h-4 rounded border-slate-600 bg-slate-900/50 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 focus:ring-2 transition-all cursor-pointer"
            >
          </div>
          <div class="ml-3 text-sm">
            <label for="terms" class="font-medium text-slate-300 cursor-pointer">Acepto términos de veracidad de identidad</label>
            <p class="text-slate-500 text-xs mt-0.5">Al registrarte, confirmas que los datos ingresados son reales.</p>
          </div>
        </div>

        <button 
          type="submit"
          class="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-slate-900 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all font-semibold mt-6"
        >
          <UserPlus class="w-5 h-5 mr-2" />
          Registrarme
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-400">
        ¿Ya tienes cuenta? 
        <RouterLink to="/login" class="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">Inicia sesión</RouterLink>
      </p>
    </div>
  </div>
</template>
