<script setup lang="ts">
import { ref } from 'vue';
import { Mail, Lock, LogIn } from 'lucide-vue-next';

const email = ref('');
const password = ref('');

const handleLogin = () => {
  console.log('Login attempt with', email.value, password.value);
};
</script>

<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-emerald-500/30">
    <div class="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl shadow-slate-900/50 border border-slate-700/50 p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2 tracking-tight">UpVote</h1>
        <p class="text-slate-400">Inicia sesión para continuar</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
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
           <div class="flex justify-between items-center mb-1.5">
             <label for="password" class="block text-sm font-medium text-slate-300">Contraseña</label>
             <a href="#" class="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">¿Recuperar contraseña?</a>
           </div>
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

        <button 
          type="submit"
          class="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-slate-900 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all font-semibold"
        >
          <LogIn class="w-5 h-5 mr-2" />
          Entrar
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-400">
        ¿No tienes una cuenta? 
        <RouterLink to="/register" class="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">Crear cuenta</RouterLink>
      </p>
    </div>
  </div>
</template>
