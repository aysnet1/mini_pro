<template>
  <q-card flat bordered class="bg-white text-dark register-card">
    <!-- Header Section -->
    <q-card-section class="q-pa-xl text-center">
      <div class="text-h5 text-weight-bold q-mb-xs">Inscription</div>
      <div class="text-body2 text-grey-6">
        Rejoignez TakeLog et trouvez votre solution idéale
      </div>

      <!-- Segmented Role Selector Moved to Top for Better UX -->
      <div class="row justify-center q-mt-lg">
        <q-btn-toggle v-model="role" toggle-color="dark" text-color="grey-7" toggle-text-color="white" unelevated
          no-caps class="role-toggle" :options="roleOptions" />
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
      <q-form class="q-gutter-y-lg" @submit.prevent="handleRegister">

        <!-- Identity Fields -->
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input id="prenom" v-model="prenom" outlined dense color="dark" label="Prénom" placeholder="Jean"
              :rules="[(val) => (val && val.length > 0) || 'Requis']" no-error-icon hide-bottom-space>
              <template #prepend>
                <User class="field-icon" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6">
            <q-input id="nom" v-model="nom" outlined dense color="dark" label="Nom" placeholder="Dupont"
              :rules="[(val) => (val && val.length > 0) || 'Requis']" no-error-icon hide-bottom-space>
              <template #prepend>
                <User class="field-icon" />
              </template>
            </q-input>
          </div>
        </div>

        <!-- Contact Fields -->
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input id="email" v-model="email" type="email" outlined dense color="dark" label="Adresse e-mail"
              placeholder="jean@exemple.com"
              :rules="[(val) => (val && val.length > 0) || 'Requis', (val) => /.+@.+\..+/.test(val) || 'E-mail invalide']"
              no-error-icon hide-bottom-space>
              <template #prepend>
                <Mail class="field-icon" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6">
            <q-input id="tel" v-model="tel" type="tel" outlined dense color="dark" label="Téléphone"
              placeholder="8 chiffres" :rules="[(val) => (val && val.length > 0) || 'Requis']" no-error-icon
              hide-bottom-space>
              <template #prepend>
                <Phone class="field-icon" />
              </template>
            </q-input>
          </div>
        </div>

        <!-- Password Fields -->
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" outlined dense
              color="dark" label="Mot de passe" placeholder="••••••••"
              :rules="[(val) => (val && val.length >= 6) || 'Min 6 caractères']" no-error-icon hide-bottom-space>
              <template #prepend>
                <Lock class="field-icon" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6">
            <q-input id="confirmPassword" v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" outlined
              dense color="dark" label="Confirmation" placeholder="••••••••"
              :rules="[(val) => (val && val === password) || 'Mots de passe non identiques']" no-error-icon
              hide-bottom-space>
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
          </div>
        </div>

        <!-- Optional Fields -->
        <div>
          <q-input id="photo_profil" v-model="photo_profil" outlined dense color="dark" label="Photo de profil (URL)"
            placeholder="Optionnel" hide-bottom-space>
            <template #prepend>
              <Image class="field-icon" />
            </template>
          </q-input>
        </div>

        <!-- Dynamic Panels Context -->
        <q-slide-transition>
          <div v-if="role === 'etudiant'" class="dynamic-subpanel">
            <div class="subpanel-header text-weight-bold q-mb-md">
              <GraduationCap class="subpanel-header-icon q-mr-sm" />
              Informations Étudiant
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input id="universite" v-model="universite" outlined dense color="dark" label="Université / École"
                  placeholder="ex: ISET Sousse" hide-bottom-space />
              </div>
              <div class="col-12 col-sm-6">
                <q-input id="budget" v-model.number="budget" type="number" outlined dense color="dark"
                  label="Budget max (mensuel)" placeholder="ex: 450" hide-bottom-space>
                  <template #suffix>
                    <span class="text-caption text-weight-bold text-grey-7">DT</span>
                  </template>
                </q-input>
              </div>
            </div>

            <div class="row q-col-gutter-md q-mt-xs">
              <div class="col-12 col-sm-6">
                <q-input id="recherche_ville" v-model="recherche_ville" outlined dense color="dark"
                  label="Ville recherchée" placeholder="ex: Sousse" hide-bottom-space>
                  <template #prepend>
                    <MapPin class="field-icon" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <q-input id="habitudes" v-model="habitudes" outlined dense color="dark" label="Habitudes de vie"
                  placeholder="ex: Calme, non-fumeur" hide-bottom-space>
                  <template #prepend>
                    <Heart class="field-icon" />
                  </template>
                </q-input>
              </div>
            </div>
          </div>
        </q-slide-transition>

        <q-slide-transition>
          <div v-if="role === 'proprietaire'" class="dynamic-subpanel">
            <div class="subpanel-header text-weight-bold q-mb-md">
              <Home class="subpanel-header-icon q-mr-sm" />
              Informations Propriétaire
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-select id="type" v-model="type" :options="typeOptions" emit-value map-options outlined dense
                  color="dark" label="Type d'entité" hide-bottom-space />
              </div>
              <div class="col-12 col-sm-6">
                <q-input id="adress" v-model="adress" outlined dense color="dark" label="Adresse"
                  placeholder="ex: Route de la plage" hide-bottom-space>
                  <template #prepend>
                    <MapPin class="field-icon" />
                  </template>
                </q-input>
              </div>
            </div>
          </div>
        </q-slide-transition>

        <!-- Submit Button -->
        <q-btn type="submit" :loading="authStore.loading" unelevated no-caps class="full-width submit-btn q-mt-xl">
          <template #loading>
            <q-spinner-oval size="20px" color="white" />
          </template>
          <div class="row items-center justify-center q-gutter-sm">
            <span>S'inscrire et commencer</span>
          </div>
        </q-btn>
      </q-form>
    </q-card-section>

    <!-- Footer Redirect Section -->
    <q-card-actions align="center" class="q-pb-xl q-pt-none">
      <div class="text-body2 text-grey-6">
        Déjà inscrit ?
        <router-link class="login-redirect-link" to="/auth/login">
          Se connecter
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
import {
  User, Mail, Phone, Lock, Eye, EyeOff,
  GraduationCap, MapPin, Heart, Home, Image, AlertCircle
} from 'lucide-vue-next'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()

const nom = ref('')
const prenom = ref('')
const email = ref('')
const tel = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref('etudiant')
const photo_profil = ref('')

const budget = ref(null)
const habitudes = ref('')
const universite = ref('')
const recherche_ville = ref('')

const adress = ref('')
const type = ref('particulier')

const showPassword = ref(false)
const errorMessage = ref('')

const roleOptions = [
  { label: 'Je suis Étudiant', value: 'etudiant' },
  { label: 'Je suis Propriétaire', value: 'proprietaire' }
]

const typeOptions = [
  { label: 'Particulier', value: 'particulier' },
  { label: 'Agence Immobilière', value: 'agence' }
]

async function handleRegister() {
  errorMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Les mots de passe ne correspondent pas'
    return
  }

  const payload = {
    nom: nom.value,
    prenom: prenom.value,
    email: email.value,
    tel: tel.value,
    password: password.value,
    role: role.value,
    photo_profil: photo_profil.value || null
  }

  if (role.value === 'etudiant') {
    payload.budget = budget.value || null
    payload.habitudes = habitudes.value || null
    payload.universite = universite.value || null
    payload.recherche_ville = recherche_ville.value || null
  } else if (role.value === 'proprietaire') {
    payload.adress = adress.value || null
    payload.type = type.value || null
  }

  try {
    await authStore.register(payload)
    $q.notify({
      message: 'Inscription réussie ! Bienvenue sur TakeLog.',
      color: 'positive',
      position: 'top',
      timeout: 4000
    })
    router.push('/')
  } catch (err) {
    errorMessage.value = err.message || "Une erreur est survenue lors de l'inscription."
  }
}
</script>

<style scoped>
.register-card {
  width: 100%;
  max-width: 840px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.role-toggle {
  border: 1px solid #e2e8f0;
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 4px;
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

.dynamic-subpanel {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-top: 8px;
}

.subpanel-header {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #1e293b;
}

.subpanel-header-icon {
  width: 18px;
  height: 18px;
  color: #64748b;
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

.login-redirect-link {
  color: #0f172a;
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
}

.login-redirect-link:hover {
  text-decoration: underline;
}
</style>
