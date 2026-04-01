<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, ArrowLeft, Send } from 'lucide-vue-next'
import { validateEmail, sanitizeInput } from '../../utils/validators'

const router = useRouter()

const email = ref('')
const emailError = ref<string | null>(null)
const apiError = ref<string | null>(null)
const isLoading = ref(false)
const emailSent = ref(false)

const handleSubmit = async () => {
  emailError.value = null
  apiError.value = null

  const safeEmail = sanitizeInput(email.value)
  const emailValidationResult = validateEmail(safeEmail)

  if (emailValidationResult) {
    emailError.value = emailValidationResult
    return
  }

  try {
    isLoading.value = true
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: safeEmail }),
    })

    const data = await response.json()

    if (!response.ok) {
      apiError.value = data.message || 'Error al enviar el correo de recuperación'
      return
    }

    emailSent.value = true
  } catch (error) {
    apiError.value = 'Error de conexión con el servidor'
    console.error('Password recovery error:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-emerald-500/30"
  >
    <div
      class="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl shadow-slate-900/50 border border-slate-700/50 p-8"
    >
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2 tracking-tight">UpVote</h1>
        <p class="text-slate-400">Recuperar contraseña</p>
      </div>

      <!-- Success state -->
      <div v-if="emailSent" class="text-center space-y-4">
        <div class="p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm">
          Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y carpeta de spam.
        </div>
        <button
          @click="router.push('/login')"
          class="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-slate-900 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all font-semibold"
        >
          <ArrowLeft class="w-5 h-5 mr-2" />
          Volver al inicio de sesión
        </button>
      </div>

      <!-- Form state -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-6">
        <p class="text-sm text-slate-400">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <div
          v-if="apiError"
          class="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm"
        >
          {{ apiError }}
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-slate-300 mb-1.5"
            >Correo electrónico</label
          >
          <div class="relative">
            <div
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"
            >
              <Mail class="w-5 h-5" />
            </div>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              :class="[
                'block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all',
                emailError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-700 focus:ring-emerald-500',
              ]"
              placeholder="tu@correo.com"
            />
          </div>
          <p v-if="emailError" class="mt-1.5 text-sm text-red-500">{{ emailError }}</p>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-slate-900 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send v-if="!isLoading" class="w-5 h-5 mr-2" />
          <svg
            v-else
            class="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {{ isLoading ? 'Enviando...' : 'Enviar enlace de recuperación' }}
        </button>
      </form>

      <p v-if="!emailSent" class="mt-6 text-center text-sm text-slate-400">
        <RouterLink
          to="/login"
          class="font-medium text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center"
        >
          <ArrowLeft class="w-4 h-4 mr-1" />
          Volver al inicio de sesión
        </RouterLink>
      </p>
    </div>
  </div>
</template>
