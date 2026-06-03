<template>
  <q-page class="detail-page">
    <div class="container">
      <q-btn flat no-caps color="dark" icon="arrow_back" label="Retour" to="/recherche" class="q-mb-md" />

      <div v-if="loading" class="state-box">
        <q-spinner-dots size="36px" color="black" />
      </div>

      <div v-else-if="error" class="state-box state-error">
        {{ error }}
      </div>

      <q-card v-else flat class="detail-card">
        <div class="hero" :style="{ backgroundImage: `url('${primaryImage}')` }"></div>

        <q-card-section>
          <div class="head-row">
            <div>
              <h1 class="title">{{ capitalize(logement.type) }} · {{ logement.ville }}</h1>
              <p class="sub">{{ logement.adress }}</p>
            </div>
            <q-badge :label="logement.statut || 'disponible'" color="black" text-color="white" />
          </div>

          <div v-if="isEtudiant" class="reserve-box q-mt-lg">
            <h2 class="section-title">Reserver ce logement</h2>
            <div class="reserve-grid">
              <q-input :model-value="dateRangeLabel" outlined dense readonly label="Periode de reservation"
                hint="Selectionnez debut et fin dans un seul calendrier">
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="reservationRange" range mask="YYYY-MM-DD" color="dark" minimal>
                        <div class="row items-center justify-end q-gutter-sm q-pa-sm">
                          <q-btn v-close-popup flat label="Fermer" color="dark" no-caps />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>

              <q-input :model-value="durationLabel" outlined dense readonly label="Duree calculee" />
            </div>

            <div class="reserve-actions q-mt-md">
              <q-btn no-caps unelevated color="dark" label="Reserver maintenant" :loading="reservationsStore.saving"
                @click="submitReservation" />
              <q-btn flat no-caps color="dark" label="Mes reservations" to="/candidatures" />
            </div>
          </div>

          <div class="meta-grid q-mt-md">
            <div class="meta-item">
              <span class="label">Prix</span>
              <span class="value">{{ Number(logement.prix || 0) }} DT / mois</span>
            </div>
            <div class="meta-item">
              <span class="label">Places</span>
              <span class="value">{{ logement.nb_places || 1 }} place(s)</span>
            </div>
            <div class="meta-item">
              <span class="label">Ville</span>
              <span class="value">{{ logement.ville }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Type</span>
              <span class="value">{{ capitalize(logement.type) }}</span>
            </div>
          </div>

          <div class="q-mt-lg">
            <h2 class="section-title">Description</h2>
            <p class="desc">{{ logement.description || 'Aucune description fournie.' }}</p>
          </div>

          <div class="q-mt-lg">
            <h2 class="section-title">Avis</h2>

            <div v-if="avisLoading" class="avis-state">
              <q-spinner-dots size="22px" color="dark" />
            </div>

            <div v-else-if="avisError" class="avis-state avis-error">
              {{ avisError }}
            </div>

            <div v-else>
              <div class="avis-summary q-mb-md">
                <q-rating :model-value="averageRating" max="5" size="22px" color="amber-7" icon="star_border"
                  icon-selected="star" readonly />
                <span class="avis-summary-text">
                  {{ averageRating.toFixed(1) }}/5 ({{ avisList.length }} avis)
                </span>
              </div>

              <div v-if="!avisList.length" class="avis-empty">
                Aucun avis pour le moment.
              </div>

              <div v-else class="avis-list">
                <div v-for="avis in avisList" :key="avis.id" class="avis-item">
                  <div class="avis-head">
                    <div class="avis-author">{{ avis.prenom }} {{ avis.nom }}</div>
                    <q-rating :model-value="Number(avis.note || 0)" max="5" size="18px" color="amber-7"
                      icon="star_border" icon-selected="star" readonly />
                  </div>
                  <p class="avis-commentaire">{{ avis.commentaire || 'Aucun commentaire.' }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="photos.length > 0" class="q-mt-lg">
            <h2 class="section-title">Photos</h2>
            <div class="photos-grid">
              <img v-for="(photo, idx) in photos" :key="idx" :src="photo" class="photo" />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { useReservationsStore } from '@/stores/reservations'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const reservationsStore = useReservationsStore()

const loading = ref(false)
const error = ref('')
const logement = ref({})
const reservationRange = ref({ from: '', to: '' })
const avisList = ref([])
const avisLoading = ref(false)
const avisError = ref('')

const isEtudiant = computed(() => authStore.user?.role === 'etudiant')

const selectedStartDate = computed(() => reservationRange.value?.from || '')
const selectedEndDate = computed(() => reservationRange.value?.to || '')

const dateRangeLabel = computed(() => {
  if (!selectedStartDate.value || !selectedEndDate.value) {
    return ''
  }
  return `${selectedStartDate.value} -> ${selectedEndDate.value}`
})

const calculatedDurationMonths = computed(() => {
  if (!selectedStartDate.value || !selectedEndDate.value) return 0

  const start = new Date(`${selectedStartDate.value}T00:00:00`)
  const end = new Date(`${selectedEndDate.value}T00:00:00`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return 0
  }

  const msDiff = end.getTime() - start.getTime()
  const dayDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24))
  return Math.max(1, Math.ceil(dayDiff / 30))
})

const durationLabel = computed(() => {
  return calculatedDurationMonths.value > 0 ? `${calculatedDurationMonths.value} mois` : ''
})

const averageRating = computed(() => {
  if (!avisList.value.length) return 0
  const total = avisList.value.reduce((sum, avis) => sum + Number(avis.note || 0), 0)
  return total / avisList.value.length
})

const photos = computed(() => {
  try {
    const value = logement.value?.photos
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})

const primaryImage = computed(() => {
  return photos.value[0] || 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80'
})

function capitalize(text) {
  if (!text) return 'Logement'
  const value = `${text}`
  return value.charAt(0).toUpperCase() + value.slice(1)
}

async function loadLogement() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`/api/logements/${route.params.id}`, {
      headers: { ...authStore.authHeader }
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Logement introuvable.')
    logement.value = data || {}
  } catch (err) {
    error.value = err.message || 'Erreur de chargement.'
  } finally {
    loading.value = false
  }
}

async function loadAvis() {
  avisLoading.value = true
  avisError.value = ''
  try {
    const response = await fetch(`/api/avis/logement/${route.params.id}`)
    const data = await response.json().catch(() => ([]))
    if (!response.ok) throw new Error(data.error || 'Erreur de chargement des avis.')
    avisList.value = Array.isArray(data) ? data : []
  } catch (err) {
    avisError.value = err.message || 'Erreur de chargement des avis.'
  } finally {
    avisLoading.value = false
  }
}

function isValidReservationForm() {
  if (!selectedStartDate.value || !selectedEndDate.value) {
    return false
  }

  const start = new Date(`${selectedStartDate.value}T00:00:00`)
  const end = new Date(`${selectedEndDate.value}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return false
  }

  return calculatedDurationMonths.value > 0
}

async function submitReservation() {
  if (!authStore.isAuthenticated) {
    $q.notify({ message: 'Veuillez vous connecter pour reserver.', color: 'negative', position: 'top' })
    return
  }

  if (!isEtudiant.value) {
    $q.notify({ message: 'Seuls les etudiants peuvent reserver.', color: 'negative', position: 'top' })
    return
  }

  if (!isValidReservationForm()) {
    $q.notify({
      message: 'Veuillez verifier les dates et la duree de reservation.',
      color: 'negative',
      position: 'top'
    })
    return
  }

  try {
    await reservationsStore.reserve({
      logement_id: route.params.id,
      date_debut: selectedStartDate.value,
      date_fin: selectedEndDate.value,
      duree: calculatedDurationMonths.value
    })

    $q.notify({
      message: 'Demande de reservation envoyee au proprietaire.',
      color: 'positive',
      position: 'top'
    })
    await loadLogement()
    await loadAvis()
    router.push('/candidatures')
  } catch (err) {
    $q.notify({
      message: err.message || 'Erreur lors de la reservation.',
      color: 'negative',
      position: 'top'
    })
  }
}

onMounted(async () => {
  await Promise.all([loadLogement(), loadAvis()])
})
</script>

<style scoped>
.detail-page {
  background: #f8fafc;
  min-height: 100vh;
}

.container {
  max-width: 1050px;
  margin: 0 auto;
  padding: 24px 16px 56px;
}

.state-box {
  min-height: 260px;
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #334155;
  background: #fff;
}

.state-error {
  color: #991b1b;
}

.detail-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
}

.hero {
  height: 320px;
  background-size: cover;
  background-position: center;
}

.head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

.sub {
  margin: 6px 0 0;
  color: #64748b;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.meta-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
}

.label {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.value {
  display: block;
  margin-top: 4px;
  font-weight: 700;
  color: #111827;
}

.section-title {
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
}

.reserve-box {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  background: #f8fafc;
}

.reserve-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.reserve-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.desc {
  margin: 0;
  color: #334155;
  line-height: 1.55;
}

.avis-state {
  min-height: 60px;
  display: grid;
  place-items: center;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  background: #fff;
  color: #334155;
}

.avis-error {
  color: #991b1b;
}

.avis-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avis-summary-text {
  font-weight: 700;
  color: #334155;
}

.avis-empty {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  color: #64748b;
  background: #fff;
}

.avis-list {
  display: grid;
  gap: 10px;
}

.avis-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}

.avis-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.avis-author {
  font-weight: 700;
  color: #0f172a;
}

.avis-commentaire {
  margin: 8px 0 0;
  color: #334155;
  line-height: 1.45;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.photo {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

@media (max-width: 760px) {
  .hero {
    height: 220px;
  }

  .meta-grid,
  .photos-grid,
  .reserve-grid {
    grid-template-columns: 1fr;
  }
}
</style>
