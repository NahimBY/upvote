<script setup lang="ts">
import { useRouter } from 'vue-router'
import { CheckCircle2, ShieldCheck, Eye, Zap, ChevronRight } from 'lucide-vue-next'

const router = useRouter()

const handleLogin = () => {
  router.push('/login')
}

const handleRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
    
    <!-- Background Effects -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

    <!-- Navbar -->
    <nav class="relative z-10 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-lg sticky top-0">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-20">
          <div class="flex items-center cursor-pointer group" @click="router.push('/')">
            <span class="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <span class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.5)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] transition-all duration-300 transform group-hover:scale-105">
                <CheckCircle2 class="w-6 h-6" stroke-width="2.5" />
              </span>
              UpVote
            </span>
          </div>
          <div class="flex items-center gap-2 sm:gap-4">
            <button
              class="text-slate-300 hover:text-white font-medium transition-colors cursor-pointer px-4 py-2 text-sm rounded-lg hover:bg-slate-800/50"
              @click="handleLogin"
            >
              Iniciar sesión
            </button>
            <button
              class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition-all duration-300 cursor-pointer px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transform hover:-translate-y-0.5 text-sm flex items-center gap-2"
              @click="handleRegister"
            >
              Comenzar
              <ChevronRight class="w-4 h-4 hidden sm:block" />
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-24">
      
      <!-- Hero Section -->
      <div class="text-center max-w-4xl mx-auto mb-20 sm:mb-28 animate-fade-in-up">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          La nueva era de la votación digital
        </div>
        <h1 class="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
          Decisiones más <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">inteligentes</span>, de forma segura.
        </h1>
        <p class="text-lg sm:text-xl md:text-2xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
          UpVote es la plataforma definitiva que garantiza elecciones transparentes, auditables y sin fricciones para cualquier organización.
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 sm:px-0">
          <button
            class="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-lg px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
            @click="handleRegister"
          >
            Crear cuenta gratis
            <ChevronRight class="w-5 h-5" />
          </button>
          <button
            class="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-semibold text-lg px-8 py-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all duration-300 flex items-center justify-center"
            @click="handleLogin"
          >
            Acceder al dashboard
          </button>
        </div>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
        <!-- Feature 1 -->
        <div class="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 rounded-2xl hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all duration-500 group">
          <div class="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-emerald-500/20">
            <ShieldCheck class="w-7 h-7 text-emerald-400" />
          </div>
          <h3 class="text-xl sm:text-2xl font-bold text-white mb-4">Seguridad Total</h3>
          <p class="text-slate-400 leading-relaxed text-sm sm:text-base">
            Tu voto está protegido con criptografía de última generación. Garantizamos el anonimato y la integridad de cada elección.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 rounded-2xl hover:border-blue-500/50 hover:bg-slate-800/50 transition-all duration-500 group">
          <div class="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-blue-500/20">
            <Eye class="w-7 h-7 text-blue-400" />
          </div>
          <h3 class="text-xl sm:text-2xl font-bold text-white mb-4">Máxima Transparencia</h3>
          <p class="text-slate-400 leading-relaxed text-sm sm:text-base">
            Resultados auditables y en tiempo real. Todos los participantes pueden verificar el transcurso sin comprometer la privacidad.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 rounded-2xl hover:border-purple-500/50 hover:bg-slate-800/50 transition-all duration-500 group">
          <div class="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:bg-purple-500/20">
            <Zap class="w-7 h-7 text-purple-400" />
          </div>
          <h3 class="text-xl sm:text-2xl font-bold text-white mb-4">Rápido y Accesible</h3>
          <p class="text-slate-400 leading-relaxed text-sm sm:text-base">
            Sin configuraciones complicadas. Lanza una elección en minutos y permite a tus usuarios votar desde cualquier dispositivo.
          </p>
        </div>
      </div>
      
    </main>
  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}
</style>