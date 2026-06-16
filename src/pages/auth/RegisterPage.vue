<template>
  <q-card flat bordered
    class="bg-white text-gray-900 rounded-2xl border border-gray-200 shadow-lg register-card w-full md:min-w-xl ">
    <!-- Header Section -->
    <q-card-section class="px-6 py-4 text-center">
      <div class="text-xl font-bold mb-1">Inscription</div>
      <div class="text-sm text-gray-500">
        Rejoignez TakeLog et trouvez votre solution idéale
      </div>

      <!-- Segmented Role Selector Moved to Top for Better UX -->
      <div class="flex justify-center mt-6">
        <q-btn-toggle v-model="role" toggle-color="dark" text-color="gray-600" toggle-text-color="white" unelevated
          no-caps class="role-toggle rounded-lg px-1" :options="roleOptions" />
      </div>
    </q-card-section>

    <!-- Error Banner Section -->
    <q-card-section v-if="errorMessage" class="px-6 pt-0">
      <q-banner class="bg-red-600 text-white rounded-lg px-4 py-3">
        <template #avatar>
          <AlertCircle class="w-5 h-5" />
        </template>
        {{ errorMessage }}
      </q-banner>
    </q-card-section>

    <!-- Main Form Section -->
    <q-card-section class="px-6 pb-6 pt-0   ">
      <q-form no-error-focus class="flex flex-col gap-4" @submit.prevent="handleRegister">
        <!-- Photo Picker Section -->
        <div class="photo-picker-container ">
          <div class="photo-preview-wrapper">
            <div class="photo-preview">
              <img v-if="photo_profil" :src="photo_profil" alt="Photo de profil" @error="handleImageError" />
              <div v-else class="photo-placeholder">
                <span class="placeholder-text">Aucune photo</span>
              </div>
            </div>
            <!-- Overlay au survol -->
            <div class="photo-overlay" @click="openPhotoMenu">
              <Image class="w-6 h-6 text-white mb-1" />
              <span class="overlay-text text-xs font-medium">Changer la photo</span>
            </div>
          </div>

          <!-- Menu caché pour les avatars -->
          <q-btn ref="photoMenuBtn" icon="photo_library" class="opacity-0" aria-label="Choisir une photo">
            <q-menu v-model="photoMenuOpen">
              <q-card style="min-width: 320px">
                <q-card-section class="row justify-between items-center q-pb-sm">
                  <span class="text-sm font-semibold text-gray-800">Choisir un avatar</span>
                  <q-btn icon="refresh" size="sm" flat color="dark" @click="randomizeAvatars"
                    aria-label="Avatars aléatoires" />
                </q-card-section>
                <q-card-section class="q-pt-none">
                  <div class="avatar-grid">
                    <div v-for="(avatar, index) in avatars" :key="index" class="avatar-item"
                      @click="selectAvatar(avatar)">
                      <img :src="avatar" :alt="`Avatar ${index + 1}`" />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </q-menu>
          </q-btn>
        </div>
        <!-- Identity Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="col-span-1">
            <q-input id="prenom" v-model="prenom" outlined color="dark" label="Prénom" placeholder="Jean"
              :rules="[(val) => (val && val.length > 0) || 'Requis']" no-error-icon hide-bottom-space>
              <template #prepend>
                <User class="w-4 h-4 text-gray-400" />
              </template>
            </q-input>
          </div>

          <div class="col-span-1">
            <q-input id="nom" v-model="nom" outlined color="dark" label="Nom" placeholder="Dupont"
              :rules="[(val) => (val && val.length > 0) || 'Requis']" no-error-icon hide-bottom-space>
              <template #prepend>
                <User class="w-4 h-4 text-gray-400" />
              </template>
            </q-input>
          </div>
        </div>

        <!-- Contact Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="col-span-1">
            <q-input id="email" v-model="email" type="email" outlined color="dark" label="Adresse e-mail"
              placeholder="jean@exemple.com"
              :rules="[(val) => (val && val.length > 0) || 'Requis', (val) => /.+@.+\..+/.test(val) || 'E-mail invalide']"
              no-error-icon hide-bottom-space>
              <template #prepend>
                <Mail class="w-4 h-4 text-gray-400" />
              </template>
            </q-input>
          </div>

          <div class="col-span-1">
            <q-input id="tel" v-model="tel" type="tel" outlined color="dark" label="Téléphone" placeholder="8 chiffres"
              :rules="[(val) => (val && val.length > 0) || 'Requis']" no-error-icon hide-bottom-space>
              <template #prepend>
                <Phone class="w-4 h-4 text-gray-400" />
              </template>
            </q-input>
          </div>
        </div>

        <!-- Password Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="col-span-1">
            <q-input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" outlined color="dark"
              label="Mot de passe" placeholder="••••••••"
              :rules="[(val) => (val && val.length >= 6) || 'Min 6 caractères']" no-error-icon hide-bottom-space>
              <template #prepend>
                <Lock class="w-4 h-4 text-gray-400" />
              </template>
            </q-input>
          </div>

          <div class="col-span-1">
            <q-input id="confirmPassword" v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" outlined
              color="dark" label="Confirmation" placeholder="••••••••"
              :rules="[(val) => (val && val === password) || 'Mots de passe non identiques']" no-error-icon
              hide-bottom-space>
              <template #prepend>
                <Lock class="w-4 h-4 text-gray-400" />
              </template>
              <template #append>
                <q-btn flat round class="password-toggle-btn -mr-1" @click="showPassword = !showPassword">
                  <Eye v-if="!showPassword" class="w-4 h-4 text-gray-400 cursor-pointer" />
                  <EyeOff v-else class="w-4 h-4 text-gray-400 cursor-pointer" />
                </q-btn>
              </template>
            </q-input>
          </div>
        </div>



        <!-- Optional URL Input -->
        <div class="hidden!">
          <q-input id="photo_url" v-model="photo_profil" outlined color="dark" label="Ou URL de photo"
            placeholder="https://exemple.com/photo.jpg" hide-bottom-space>
            <template #prepend>
              <Image class="w-4 h-4 text-gray-400" />
            </template>
          </q-input>
        </div>

        <!-- Dynamic Panels Context -->
        <q-slide-transition>
          <div v-if="role === 'etudiant'"
            class="dynamic-subpanel bg-gray-50 border border-gray-200 rounded-xl p-5 mt-2">
            <div class="subpanel-header flex items-center text-sm font-semibold text-gray-800 mb-3">
              <GraduationCap class="subpanel-header-icon w-[18px] h-[18px] text-gray-500 mr-2" />
              Informations Étudiant
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="col-span-1">
                <q-select id="universite" v-model="selectedEtablissement" :options="etablissementsOptions"
                  option-label="label_fr" option-value="id" outlined color="dark" label="Université / École"
                  placeholder="Sélectionnez votre établissement" use-input input-debounce="300"
                  @filter="filterEtablissements" hide-bottom-space :rules="[(val) => (val && val.id) || 'Requis']">
                  <template #prepend>
                    <GraduationCap class="w-4 h-4 text-gray-400" />
                  </template>
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-gray-500">
                        Aucun établissement trouvé
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <div class="col-span-1">
                <q-input id="budget" v-model.number="budget" type="number" outlined color="dark"
                  label="Budget max (mensuel)" placeholder="ex: 450" hide-bottom-space>
                  <template #suffix>
                    <span class="text-xs font-bold text-gray-600">DT</span>
                  </template>
                </q-input>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
              <div class="col-span-1">
                <q-input id="recherche_ville" v-model="recherche_ville" outlined color="dark" label="Ville recherchée"
                  placeholder="ex: Sousse" hide-bottom-space>
                  <template #prepend>
                    <MapPin class="w-4 h-4 text-gray-400" />
                  </template>
                </q-input>
              </div>
              <div class="col-span-1">
                <q-select id="habitudes" v-model="selectedHabitudes" :options="filteredHabitudesOptions" outlined
                  color="dark" label="Habitudes de vie" placeholder="Sélectionnez ou ajoutez" multiple chips use-input
                  input-debounce="0" @filter="filterHabitudes" @input-value="addNewHabitude" hide-bottom-space>
                  <template #prepend>
                    <Heart class="w-4 h-4 text-gray-400" />
                  </template>
                  <template #no-option>
                    <q-item>
                      <q-item-section class="text-gray-500">
                        Aucune habitude trouvée
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>
          </div>
        </q-slide-transition>

        <q-slide-transition>
          <div v-if="role === 'proprietaire'"
            class="dynamic-subpanel bg-gray-50 border border-gray-200 rounded-xl p-5 mt-2">
            <div class="subpanel-header flex items-center text-sm font-semibold text-gray-800 mb-3">
              <Home class="subpanel-header-icon w-[18px] h-[18px] text-gray-500 mr-2" />
              Informations Propriétaire
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="col-span-1">
                <q-select id="type" v-model="type" :options="typeOptions" emit-value map-options outlined color="dark"
                  label="Type d'entité" hide-bottom-space />
              </div>
              <div class="col-span-1">
                <q-input id="adress" v-model="adress" outlined color="dark" label="Adresse"
                  placeholder="ex: Route de la plage" hide-bottom-space>
                  <template #prepend>
                    <MapPin class="w-4 h-4 text-gray-400" />
                  </template>
                </q-input>
              </div>
            </div>
          </div>
        </q-slide-transition>


        <q-btn type="submit" :loading="authStore.loading" unelevated no-caps class="full-width submit-btn q-mt-md"
          style=" min-height: 48px;
  border-radius: 8px;
  background-color: #0f172a;
  color: #ffffff;
  font-weight: 600;
  transition: background-color 0.2s ease;">
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
    <q-card-actions align="center" class="pb-6 pt-0">
      <div class="text-sm text-gray-500">
        Déjà inscrit ?
        <router-link class="login-redirect-link text-gray-900 font-semibold no-underline ml-1 hover:underline"
          to="/auth/login">
          Se connecter
        </router-link>
      </div>
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useQuasar } from 'quasar'
import { useEtablissements } from '@/composables/useEtablissements'
import {
  User, Mail, Phone, Lock, Eye, EyeOff,
  GraduationCap, MapPin, Heart, Home, Image, AlertCircle
} from 'lucide-vue-next'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const { searchEtablissements, } = useEtablissements()

const nom = ref('')
const prenom = ref('')
const email = ref('')
const tel = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref('etudiant')
const photo_profil = ref('')

const budget = ref(null)
const selectedHabitudes = ref([])
const selectedEtablissement = ref(null)
const habitudesOptions = ref([
  'Non-fumeur',
  'Fumeur',
  'Calme',
  'Sociable',
  'Rangé',
  'Fêtard',
  'Matinal',
  'Nocturne',
  'Aime les animaux',
  'Végétarien',
  'Sportif',
  'Étudiant',
  'Professionnel',
  'Tranquille'
])
const filteredHabitudesOptions = ref([])
const recherche_ville = ref('')

const adress = ref('')
const type = ref('particulier')

const showPassword = ref(false)
const errorMessage = ref('')
const photoMenuOpen = ref(false)
const avatars = ref([])
const photoMenuBtn = ref(null)

const roleOptions = [
  { label: 'Je suis Étudiant', value: 'etudiant' },
  { label: 'Je suis Propriétaire', value: 'proprietaire' }
]

const typeOptions = [
  { label: 'Particulier', value: 'particulier' },
  { label: 'Agence Immobilière', value: 'agence' }
]

// Computed property for etablissements options (live search)
const etablissementsOptions = ref([])

// Initialiser les avatars au montage
onMounted(() => {
  randomizeAvatars()
})

function generateRandomAvatar() {
  const imgNum = Math.floor(Math.random() * 72) + 1
  return `https://i.pravatar.cc/300?img=${imgNum}`
}

function randomizeAvatars() {
  avatars.value = Array.from({ length: 6 }, () => generateRandomAvatar())
}

function selectAvatar(avatarUrl) {
  photo_profil.value = avatarUrl
  photoMenuOpen.value = false
}

function handleImageError() {
  // Si l'image ne charge pas, on affiche le placeholder
  photo_profil.value = ''
}

function openPhotoMenu() {
  if (photoMenuBtn.value) {
    photoMenuOpen.value = true
  }
}

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
    // Convertir les habitudes (array) en string
    payload.habitudes = selectedHabitudes.value.length > 0 ? selectedHabitudes.value.join(', ') : null
    // Utiliser l'ID de l'établissement sélectionné
    payload.universite = selectedEtablissement.value?.id || null
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

function filterHabitudes(val, update) {
  update(() => {
    const needle = val.toLowerCase()
    filteredHabitudesOptions.value = habitudesOptions.value.filter(
      v => v.toLowerCase().indexOf(needle) > -1 && !selectedHabitudes.value.includes(v)
    )
  })
}

/**
 * LIVE SEARCH - Recherche les établissements à chaque frappe
 * Déclenché par le q-select avec input-debounce="300"
 */
async function filterEtablissements(val, update, abort) {
  // Annuler la recherche précédente si l'utilisateur tape encore
  if (typeof abort === 'function') {
    abort()
  }

  // Attendre 300ms (géré par input-debounce)
  update(async () => {
    if (val === '') {
      etablissementsOptions.value = []
      return
    }

    // Recherche live avec le backend
    const results = await searchEtablissements(val)
    etablissementsOptions.value = results
  })
}
</script>

<style scoped>
.register-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.role-toggle {
  border: 1px solid #e2e8f0;
  background-color: #f8fafc;
  padding: 4px;
}

.password-toggle-btn {
  margin-right: -4px;
}

.dynamic-subpanel {
  transition: all 0.3s ease;
}

.submit-btn {
  transition: background-color 0.2s ease;
}

/* Photo Picker Styles */
.photo-picker-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}

.photo-preview-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #e2e8f0;
  transition: border-color 0.2s ease;
  cursor: pointer;
}

.photo-preview-wrapper:hover {
  border-color: #0f172a;
}

.photo-preview {
  width: 100%;
  height: 100%;
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
}

.placeholder-text {
  color: #94a3b8;
  font-size: 0.75rem;
  text-align: center;
  padding: 8px;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.photo-preview-wrapper:hover .photo-overlay {
  opacity: 1;
}

.overlay-text {
  color: white;
  text-align: center;
}

.hidden-btn {
  display: none;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 8px;
}

.avatar-item {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 2px solid transparent;
}

.avatar-item:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #0f172a;
}

.avatar-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
