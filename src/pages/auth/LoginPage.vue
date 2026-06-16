<template>
  <q-card flat bordered class="bg-white text-dark login-card">
    <!-- Header Section -->
    <q-card-section class="q-pa-xl text-center">
      <div class="text-h5 text-weight-bold q-mb-xs">Connexion</div>
      <div class="text-body2 text-grey-6">
        Accédez à votre espace logement en quelques secondes.
      </div>
    </q-card-section>

    <!-- Error Banner Section -->
    <q-card-section v-if="errorMessage" class="q-px-xl q-pt-none">
      <q-banner class="bg-negative text-white rounded-borders q-pa-md">
        <template #avatar>
          <AlertCircle class="banner-icon" />
        </template>
        {{ errorMessage }}
      </q-banner>
    </q-card-section>

    <!-- Main Form Section -->
    <q-card-section class="q-px-xl q-pb-xl q-pt-none">
      <q-form class="q-gutter-y-lg" @submit.prevent="handleLogin">

        <!-- Email Input -->
        <q-input id="email" v-model="email" type="email" outlined dense color="dark" label="Adresse e-mail"
          placeholder="nom@exemple.com"
          :rules="[(val) => (val && val.length > 0) || 'Veuillez saisir votre adresse e-mail']" no-error-icon
          hide-bottom-space autocomplete="username email">
          <template #prepend>
            <Mail class="field-icon" />
          </template>
        </q-input>

        <!-- Password Input -->
        <q-input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" outlined dense color="dark"
          label="Mot de passe" placeholder="••••••••"
          :rules="[(val) => (val && val.length > 0) || 'Veuillez saisir votre mot de passe']" no-error-icon
          hide-bottom-space autocomplete="current-password">
          <template #prepend>
            <Lock class="field-icon" />
          </template>
          <template #append>
            <q-btn flat round dense class="password-toggle-btn" @click="showPassword = !showPassword">
              <Eye v-if="!showPassword" class="field-icon cursor-pointer" />
              <EyeOff v-else class="field-icon cursor-pointer" />
            </q-btn>
          </template>
        </q-input>

        <!-- Options Row (Remember Me & Forgot Password) -->
        <div class="row items-center justify-between q-py-xs">
          <q-checkbox v-model="rememberMe" dense color="dark" label="Se souvenir de moi"
            class="text-body2 text-grey-7" />
          <q-btn flat no-caps dense color="dark" label="Mot de passe oublié ?"
            class="text-body2 text-weight-medium text-grey-8 forgot-password-btn" />
        </div>

        <!-- Submit Button -->
        <q-btn type="submit" :loading="authStore.loading" unelevated no-caps class="full-width submit-btn q-mt-md">
          <template #loading>
            <q-spinner-oval size="20px" color="white" />
          </template>
          <div class="row items-center justify-center q-gutter-sm">
            <span>Se connecter</span>
          </div>
        </q-btn>
      </q-form>
    </q-card-section>

    <!-- Footer Redirect Section -->
    <q-card-actions align="center" class="q-pb-xl q-pt-none">
      <div class="text-body2 text-grey-6">
        Vous n'avez pas de compte ?
        <router-link class="signup-redirect-link" to="/auth/register">
          S'inscrire
        </router-link>
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useQuasar } from 'quasar'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-vue-next'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(true)
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''
  try {
    await authStore.login(email.value, password.value)

    $q.notify({
      message: 'Connexion réussie ! Bienvenue sur TakeLog.',
      color: 'positive',
      position: 'top',
      icon: 'check',
      timeout: 3000
    })

    // Redirect based on user role
    if (authStore.user?.role === 'admin') {
      router.push('/admin/home')
    } else if (authStore.user?.role === 'proprietaire') {
      router.push('/proprietaire/mes-logements')
    } else {
      router.push('/')
    }
  } catch (err) {
    errorMessage.value = err.message || 'Identifiants incorrects'

    // Check if it's a disabled account error
    const isDisabledError = err.message.includes('désactivé') || err.message.includes('désactivé')

    $q.notify({
      message: errorMessage.value,
      color: isDisabledError ? 'warning' : 'negative',
      position: 'top',
      icon: isDisabledError ? 'warning' : 'warning',
      timeout: isDisabledError ? 6000 : 3500,
      html: true,
      caption: isDisabledError ? 'Contactez l\'administrateur pour réactiver votre compte.' : null
    })
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 440px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.field-icon {
  width: 16px;
  height: 16px;
  color: #94a3b8;
}

.banner-icon {
  width: 20px;
  height: 20px;
}

.password-toggle-btn {
  margin-right: -4px;
}

.forgot-password-btn:hover {
  text-decoration: underline;
  background: transparent !important;
}

.submit-btn {
  min-height: 48px;
  border-radius: 8px;
  background-color: #0f172a;
  color: #ffffff;
  font-weight: 600;
  transition: background-color 0.2s ease;
}

.submit-btn:hover {
  background-color: #1e293b;
}

.signup-redirect-link {
  color: #0f172a;
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
}

.signup-redirect-link:hover {
  text-decoration: underline;
}
</style>
