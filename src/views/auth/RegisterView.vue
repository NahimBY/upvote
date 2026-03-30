<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { User, Mail, Lock, UserPlus, Eye, EyeOff } from 'lucide-vue-next';
import { validateName, validateEmail, validatePassword, validateConfirmPassword, sanitizeInput } from '../../utils/validators';

const router = useRouter();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const nameError = ref<string | null>(null);
const emailError = ref<string | null>(null);
const passwordError = ref<string | null>(null);
const confirmPasswordError = ref<string | null>(null);
const apiError = ref<string | null>(null);
const isLoading = ref(false);

const acceptTerms = ref(false);

const handleRegister = async () => {
  nameError.value = null;
  emailError.value = null;
  passwordError.value = null;
  confirmPasswordError.value = null;
  apiError.value = null;

  const safeName = sanitizeInput(name.value);
  const safeEmail = sanitizeInput(email.value);
  const safePassword = password.value;
  const safeConfirmPassword = confirmPassword.value;

  const nameValidationResult = validateName(safeName);
  const emailValidationResult = validateEmail(safeEmail);
  const passwordValidationResult = validatePassword(safePassword);
  const confirmPasswordValidationResult = validateConfirmPassword(safeConfirmPassword, safePassword);

  if (nameValidationResult || emailValidationResult || passwordValidationResult || confirmPasswordValidationResult) {
    nameError.value = nameValidationResult;
    emailError.value = emailValidationResult;
    passwordError.value = passwordValidationResult;
    confirmPasswordError.value = confirmPasswordValidationResult;
    return;
  }

  try {
    isLoading.value = true;
    const nameParts = safeName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;
    const username = safeEmail.split('@')[0];

    const response = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: safeEmail,
        username,
        firstName,
        lastName,
        password: safePassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      apiError.value = data.message || 'Error en el registro';
      return;
    }

    if (data.data && data.data.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
    }

    router.push('/login');
  } catch (error) {
    apiError.value = 'Error de conexión con el servidor';
    console.error('Register error:', error);
  } finally {
    isLoading.value = false;
  }
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
        <div v-if="apiError" class="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
          {{ apiError }}
        </div>

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
              :class="[
                'block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all',
                nameError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-emerald-500'
              ]"
              placeholder="Juan Pérez"
            />
          </div>
          <p v-if="nameError" class="mt-1.5 text-sm text-red-500">{{ nameError }}</p>
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
              :class="[
                'block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all',
                emailError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-emerald-500'
              ]"
              placeholder="tu@correo.com"
            />
          </div>
          <p v-if="emailError" class="mt-1.5 text-sm text-red-500">{{ emailError }}</p>
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
              :type="showPassword ? 'text' : 'password'" 
              required
              :class="[
                'block w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all',
                passwordError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-emerald-500'
              ]"
              placeholder="••••••••"
            />
            <button 
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300 transition-colors focus:outline-none"
              tabindex="-1"
            >
              <Eye v-if="!showPassword" class="w-5 h-5" />
              <EyeOff v-else class="w-5 h-5" />
            </button>
          </div>
          <p v-if="passwordError" class="mt-1.5 text-sm text-red-500">{{ passwordError }}</p>
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
              :type="showConfirmPassword ? 'text' : 'password'" 
              required
              :class="[
                'block w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all',
                confirmPasswordError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-emerald-500'
              ]"
              placeholder="••••••••"
            />
            <button 
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300 transition-colors focus:outline-none"
              tabindex="-1"
            >
              <Eye v-if="!showConfirmPassword" class="w-5 h-5" />
              <EyeOff v-else class="w-5 h-5" />
            </button>
          </div>
          <p v-if="confirmPasswordError" class="mt-1.5 text-sm text-red-500">{{ confirmPasswordError }}</p>
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
          :disabled="isLoading"
          class="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-slate-900 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all font-semibold mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus v-if="!isLoading" class="w-5 h-5 mr-2" />
          <svg v-else class="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? 'Registrando...' : 'Registrarme' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-400">
        ¿Ya tienes cuenta? 
        <RouterLink to="/login" class="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">Inicia sesión</RouterLink>
      </p>
    </div>
  </div>
</template>
