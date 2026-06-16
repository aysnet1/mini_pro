<template>
  <q-dialog v-model="dialogModel">
    <q-card class="edit-dialog">
      <q-card-section>
        <h3 class="dialog-title">Modifier Mon Profil</h3>
        <p class="dialog-subtitle">Gardons vos informations a jour.</p>
      </q-card-section>

      <q-card-section>
        <q-form class="form-stack" @submit.prevent="submitForm">
          <!-- Sélecteur de photo avec aperçu -->
          <div class="photo-picker-container">
            <div class="photo-preview-wrapper">
              <div class="photo-preview">
                <img v-if="localForm.photo_profil" :src="localForm.photo_profil" alt="Photo de profil"
                  @error="handleImageError" />
                <div v-else class="photo-placeholder">
                  <span class="placeholder-text">Aucune photo</span>
                </div>
              </div>
              <!-- Overlay au survol -->
              <div class="photo-overlay" @click="openPhotoMenu">
                <q-icon name="photo_camera" size="24px" color="white" />
                <span class="overlay-text">Changer la photo</span>
              </div>
            </div>

            <!-- Menu caché pour les avatars -->
            <q-btn ref="photoMenuBtn" icon="photo_library" class="hidden-btn" aria-label="Choisir une photo">
              <q-menu v-model="photoMenuOpen" anchor="top middle" self="bottom middle" :offset="[0, 10]">
                <q-card style="min-width: 320px">
                  <q-card-section class="row justify-between items-center q-pb-sm">
                    <span class="text-weight-bold">Choisir un avatar</span>
                    <q-btn icon="refresh" size="sm" flat color="primary" @click="randomizeAvatars"
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

          <!-- Champs de base pour tous les utilisateurs -->
          <div class="form-row">
            <q-input v-model="localForm.prenom" label="Prenom" outlined class="form-field" />
            <q-input v-model="localForm.nom" label="Nom" outlined class="form-field" />
          </div>

          <q-input v-model="localForm.email" type="email" label="Email" outlined class="form-field" />
          <q-input v-model="localForm.tel" label="Telephone" outlined class="form-field" />

          <!-- Champs spécifiques pour les étudiants -->
          <template v-if="userRole === 'etudiant'">
            <q-separator class="q-my-sm" />
            <p class="section-label">Informations Étudiant</p>

            <q-input v-model="localForm.budget" type="number" label="Budget (DT)" outlined class="form-field" />

            <!-- Habitudes avec auto-complétion et tags -->
            <div class="habitudes-container">
              <q-select v-model="selectedHabitudes" :options="filteredHabitudesOptions" label="Habitudes de vie"
                outlined class="form-field" multiple chips use-input input-debounce="0" @filter="filterHabitudes"
                @input-value="addNewHabitude">
                <template #prepend>
                  <q-icon name="favorite" />
                </template>
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      Aucune habitude trouvée
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <q-select v-model="selectedEtablissement" :options="etablissementsOptions" option-value="id"
              option-label="label_fr" emit-value map-options outlined class="form-field" label="Université / École"
              placeholder="Sélectionnez votre établissement" use-input input-debounce="300" behavior="menu"
              @filter="filterEtablissements">
              <template #prepend>
                <q-icon name="school" />
              </template>
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    Aucun établissement trouvé
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-input v-model="localForm.recherche_ville" label="Ville recherchée" outlined class="form-field" />
          </template>

          <div class="form-actions">
            <q-btn flat no-caps label="Annuler" @click="dialogModel = false" />
            <q-btn type="submit" no-caps unelevated color="dark" label="Enregistrer" :loading="saving" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useEtablissements } from '@/composables/useEtablissements'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  initialForm: {
    type: Object,
    default: () => ({})
  },
  saving: {
    type: Boolean,
    default: false
  },
  userRole: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const { searchEtablissements, etablissements } = useEtablissements()

const avatars = ref([])
const photoMenuOpen = ref(false)
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
const etablissementsOptions = ref([])

const localForm = ref({
  nom: '',
  prenom: '',
  email: '',
  tel: '',
  photo_profil: '',
  budget: null,
  habitudes: '',
  universite: '',
  recherche_ville: ''
})

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Charger les établissements au montage du composant (optionnel)
onMounted(async () => {
  // Optionnel: ne rien charger au montage - live search seulement
})

function generateRandomAvatar() {
  const imgNum = Math.floor(Math.random() * 72) + 1
  return `https://i.pravatar.cc/300?img=${imgNum}`
}

function randomizeAvatars() {
  avatars.value = Array.from({ length: 6 }, () => generateRandomAvatar())
}

function selectAvatar(avatarUrl) {
  localForm.value.photo_profil = avatarUrl
  photoMenuOpen.value = false
}

function handleImageError() {
  // Si l'image ne charge pas, on affiche le placeholder
  localForm.value.photo_profil = ''
}

function openPhotoMenu() {
  // Ouvre le menu quand on clique sur l'overlay
  photoMenuOpen.value = true
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

function addNewHabitude(val) {
  if (val !== null && val !== '') {
    const newValue = val.trim()
    if (newValue.length > 0 && !selectedHabitudes.value.includes(newValue)) {
      selectedHabitudes.value.push(newValue)
      // Ajouter aux options si n'existe pas
      if (!habitudesOptions.value.includes(newValue)) {
        habitudesOptions.value.push(newValue)
      }
    }
  }
}

// Convertir les habitudes (string) en tableau et vice versa
function parseHabitudes(habitudesStr) {
  if (!habitudesStr) return []
  return habitudesStr.split(',').map(h => h.trim()).filter(h => h.length > 0)
}

function formatHabitudes(habitudesArray) {
  if (!habitudesArray || habitudesArray.length === 0) return ''
  return habitudesArray.join(', ')
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      localForm.value = {
        nom: props.initialForm?.nom || '',
        prenom: props.initialForm?.prenom || '',
        email: props.initialForm?.email || '',
        tel: props.initialForm?.tel || '',
        photo_profil: props.initialForm?.photo_profil || '',
        budget: props.initialForm?.budget ?? null,
        habitudes: props.initialForm?.habitudes || '',
        universite: props.initialForm?.universite || '',
        recherche_ville: props.initialForm?.recherche_ville || ''
      }
      // Parser les habitudes (string -> array)
      selectedHabitudes.value = parseHabitudes(props.initialForm?.habitudes)
      filteredHabitudesOptions.value = [...habitudesOptions.value]

      // Si l'utilisateur a déjà une université, essayer de trouver l'établissement correspondant
      if (props.initialForm?.universite) {
        const foundEtab = etablissements.value.find(
          etab => etab.label_fr === props.initialForm.universite
        )
        if (foundEtab) {
          selectedEtablissement.value = foundEtab
        }
      }

      // Générer 6 avatars aléatoires lors de l'ouverture
      randomizeAvatars()
    }
  },
  { immediate: true }
)

function submitForm() {
  // Formater les habitudes (array -> string) avant soumission
  const formData = {
    ...localForm.value,
    habitudes: formatHabitudes(selectedHabitudes.value),
    // Utiliser le label de l'établissement sélectionné
    universite: selectedEtablissement.value || localForm.value?.etablissement_id
  }
  emit('submit', formData)
}
</script>

<style scoped>
.edit-dialog {
  width: min(560px, 94vw);
  border-radius: 0.9rem;
}

.dialog-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.dialog-subtitle {
  margin: 0.3rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.photo-preview-container {
  display: flex;
  justify-content: center;
  margin: 0.5rem 0 1rem;
}

.photo-picker-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0.5rem 0 1rem;
  position: relative;
}

.photo-preview-wrapper {
  position: relative;
  display: inline-block;
}

.photo-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s, box-shadow 0.3s;
}

.photo-preview-wrapper:hover .photo-preview {
  border-color: #3b82f6;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-text {
  color: #94a3b8;
  font-size: 0.75rem;
  text-align: center;
  padding: 0.5rem;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
  gap: 0.25rem;
}

.photo-preview-wrapper:hover .photo-overlay {
  opacity: 1;
}

.overlay-text {
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
}

.hidden-btn {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
}

.section-label {
  margin: 0.5rem 0;
  color: #0f172a;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.form-field {
  width: 100%;
}

.form-field {
  width: 100%;
}

.habitudes-container {
  margin-bottom: 0.5rem;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.avatar-item {
  cursor: pointer;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 0.2s, transform 0.2s;
}

.avatar-item:hover {
  border-color: #3b82f6;
  transform: scale(1.05);
}

.avatar-item img {
  width: 100%;
  height: 80px;
  object-fit: cover;
  display: block;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

@media (max-width: 760px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
