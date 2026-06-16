<template>
  <q-page class="bg-zinc-50 min-h-screen">
    <div class="max-w-6xl mx-auto px-4 pt-4 pb-24">

      <q-btn flat no-caps dense color="dark" icon="arrow_back" label="Retour" to="/recherche" class="mb-4" />

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-24">
        <q-spinner-dots size="42px" color="dark" />
      </div>

      <!-- Error -->
      <q-banner v-else-if="error" rounded class="bg-red-50 text-red-700 border border-red-200 mb-4">
        {{ error }}
      </q-banner>

      <template v-else>
        <!-- Hero -->
        <div class="relative rounded-2xl overflow-hidden bg-zinc-200 mb-6" style="height:340px">
          <img :src="photos[activePhoto] || primaryImage"
            class="w-full h-full object-cover transition-all duration-300" />
          <div class="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />

          <!-- Status badge -->
          <div class="absolute top-4 right-4">
            <span :class="logement.statut === 'disponible' ? 'bg-emerald-600' : 'bg-zinc-700'"
              class="text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm shadow">
              {{ logement.statut || 'disponible' }}
            </span>
          </div>

          <!-- Photo thumbnails -->
          <div v-if="photos.length > 1" class="absolute bottom-4 left-4 flex gap-2">
            <img v-for="(p, i) in photos.slice(0, 6)" :key="i" :src="p"
              class="w-12 h-12 object-cover rounded-lg border-2 cursor-pointer transition-all duration-200"
              :class="activePhoto === i ? 'border-white scale-110 shadow-lg' : 'border-white/40 opacity-60'"
              @click="activePhoto = i" />
          </div>
        </div>

        <!-- Two-column layout -->
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

          <!-- LEFT -->
          <div class="flex flex-col gap-6">

            <!-- Title -->
            <div>
              <div class="text-2xl md:text-3xl font-black text-zinc-900 leading-tight m-0">
                {{ capitalize(logement.type) }} · {{ logement.ville }}
              </div>
              <p class="text-zinc-500 mt-2 flex items-center gap-1 m-0 text-sm">
                <q-icon name="place" size="15px" class="text-zinc-400" />
                {{ logement.adress }}
              </p>
            </div>

            <!-- Meta chips -->
            <div class="flex flex-wrap gap-2">
              <span class="meta-chip">
                <q-icon name="payments" size="15px" class="text-zinc-400" />
                <strong class="text-zinc-900">{{ Number(logement.prix || 0) }} DT</strong>
                <span class="text-zinc-400 text-xs">/ mois</span>
              </span>
              <span class="meta-chip">
                <q-icon name="people" size="15px" class="text-zinc-400" />
                {{ logement.nb_places || 1 }} place(s)
              </span>
              <span class="meta-chip">
                <q-icon name="home" size="15px" class="text-zinc-400" />
                {{ capitalize(logement.type) }}
              </span>
              <span class="meta-chip">
                <q-icon name="location_city" size="15px" class="text-zinc-400" />
                {{ logement.ville }}
              </span>
            </div>

            <!-- Rating -->
            <div class="flex items-center gap-2">
              <q-rating :model-value="averageRating" max="5" size="18px" color="amber-7" icon="star_border"
                icon-selected="star" readonly />
              <span class="text-sm font-semibold text-zinc-700">{{ averageRating.toFixed(1) }}/5</span>
              <span class="text-xs text-zinc-400">({{ avisList.length }} avis)</span>
            </div>

            <!-- Description -->
            <div class="card-section">
              <div class="section-label">Description</div>
              <p class="text-zinc-600 text-[0.95rem] leading-relaxed m-0">
                {{ logement.description || 'Aucune description fournie.' }}
              </p>
            </div>

            <!-- Map Card -->
            <div v-if="logement.latitude && logement.longitude" class="card-section">
              <div class="section-label">Localisation</div>
              <div class="rounded-xl overflow-hidden border border-zinc-200" style="height: 300px;">
                <iframe
                  :src="`https://www.google.com/maps?q=${logement.latitude},${logement.longitude}&z=15&output=embed`"
                  width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade">
                </iframe>
              </div>
              <div class="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                <q-icon name="location_on" size="14px" class="text-zinc-400" />
                <span>Latitude: {{ logement.latitude }}, Longitude: {{ logement.longitude }}</span>
              </div>
            </div>

            <!-- Equipements -->
            <div v-if="equipements.length" class="card-section">
              <div class="section-label">Equipements</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="eq in equipements" :key="eq"
                  class="text-xs font-semibold bg-zinc-50 border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg">
                  {{ eq }}
                </span>
              </div>
            </div>

            <!-- Periodes reservees (etudiant_logement) -->
            <div class="card-section">
              <div class="section-label">Periodes reservees</div>
              <div v-if="bookedRanges.length === 0" class="text-zinc-400 text-sm flex items-center gap-1.5">
                <q-icon name="event_available" size="16px" />
                Aucune reservation confirmee - toutes les dates sont disponibles
              </div>
              <div v-else class="flex flex-col gap-2">
                <div v-for="(r, i) in bookedRanges" :key="i"
                  class="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  <span class="w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
                  <span class="text-sm text-zinc-700">
                    Du <strong>{{ formatDate(r.date_debut) }}</strong>
                    au <strong>{{ formatDate(r.date_fin) }}</strong>
                  </span>
                  <span v-if="r.prenom" class="ml-auto text-xs text-zinc-400 font-medium">
                    {{ r.prenom }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Photos grid -->
            <div v-if="photos.length > 1" class="card-section">
              <div class="section-label">Photos</div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <img v-for="(photo, idx) in photos" :key="idx" :src="photo"
                  class="w-full aspect-video object-cover rounded-xl cursor-pointer hover:opacity-85 transition-opacity"
                  @click="activePhoto = idx" />
              </div>
            </div>

            <!-- Avis -->
            <div class="card-section">
              <div class="section-label">Avis</div>
              <div v-if="avisLoading" class="flex justify-center py-4">
                <q-spinner-dots size="20px" color="dark" />
              </div>
              <div v-else-if="!avisList.length" class="text-zinc-400 text-sm">
                Aucun avis pour le moment.
              </div>
              <template v-else>
                <div class="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-100">
                  <q-rating :model-value="averageRating" max="5" size="20px" color="amber-7" icon="star_border"
                    icon-selected="star" readonly />
                  <span class="text-xl font-black text-zinc-900">{{ averageRating.toFixed(1) }}</span>
                  <span class="text-sm text-zinc-400">sur 5 - {{ avisList.length }} avis</span>
                </div>
                <div class="flex flex-col gap-3">
                  <div v-for="avis in avisList" :key="avis.id" class="border border-zinc-100 rounded-xl p-4">
                    <div class="flex items-center justify-between mb-1.5">
                      <div class="flex items-center gap-2">
                        <div
                          class="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-white text-[0.65rem] font-bold shrink-0">
                          {{ avis.prenom?.charAt(0) }}{{ avis.nom?.charAt(0) }}
                        </div>
                        <span class="text-sm font-semibold text-zinc-800">{{ avis.prenom }} {{ avis.nom }}</span>
                      </div>
                      <q-rating :model-value="Number(avis.note || 0)" max="5" size="13px" color="amber-7"
                        icon="star_border" icon-selected="star" readonly />
                    </div>
                    <p class="text-zinc-500 text-sm m-0 leading-relaxed">
                      {{ avis.commentaire || 'Aucun commentaire.' }}
                    </p>
                  </div>
                </div>
              </template>
            </div>

          </div>
          <!-- END LEFT -->

          <!-- RIGHT: Reservation widget -->
          <aside class="lg:sticky lg:top-20 self-start">
            <div class="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">

              <!-- Price -->
              <div class="flex items-baseline gap-2 mb-5 pb-4 border-b border-zinc-100">
                <span class="text-2xl font-black text-zinc-900">{{ Number(logement.prix || 0) }} DT</span>
                <span class="text-zinc-400 text-sm">/ mois</span>
              </div>

              <!-- Not authenticated -->
              <template v-if="!isAuthenticated">
                <p class="text-sm text-zinc-500 mb-4 text-center leading-relaxed">
                  Connectez-vous pour reserver ce logement.
                </p>
                <q-btn no-caps unelevated color="dark" label="Se connecter pour reserver" class="w-full!"
                  to="/auth/login" />
                <q-btn no-caps flat color="dark" label="Creer un compte etudiant" class="w-full! mt-2"
                  to="/auth/register" />
              </template>

              <!-- Not etudiant -->
              <template v-else-if="!isEtudiant">
                <div
                  class="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-sm text-amber-800 text-center leading-relaxed">
                  Seuls les etudiants peuvent reserver un logement.
                </div>
              </template>

              <!-- Etudiant: calendar -->
              <template v-else>
                <p class="text-[0.75rem] font-bold text-zinc-400 uppercase tracking-wider mb-3">
                  Selectionner la periode
                </p>

                <q-date v-model="reservationRange" range :options="isDateAvailable" mask="YYYY-MM-DD" color="dark" flat
                  bordered class="w-full! rounded-xl overflow-hidden">
                </q-date>

                <div class="mt-2 flex items-center gap-1.5 text-[0.71rem] text-zinc-400">
                  <span class="w-2.5 h-2.5 rounded-full bg-zinc-300 shrink-0 inline-block"></span>
                  Dates indisponibles (deja reservees ou passees)
                </div>

                <!-- Date summary -->
                <div class="mt-4 bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 flex flex-col gap-2 text-sm">
                  <div class="flex justify-between text-zinc-500">
                    <span>Arrivee</span>
                    <span class="font-semibold text-zinc-900">{{ selectedStartDate || '-' }}</span>
                  </div>
                  <div class="flex justify-between text-zinc-500">
                    <span>Depart</span>
                    <span class="font-semibold text-zinc-900">{{ selectedEndDate || '-' }}</span>
                  </div>
                  <div class="flex justify-between text-zinc-500 border-t border-zinc-200 pt-2 mt-0.5">
                    <span>Duree</span>
                    <span class="font-bold text-zinc-900">{{ durationLabel || '-' }}</span>
                  </div>
                  <div class="flex justify-between text-zinc-500">
                    <span>Total estime</span>
                    <span class="font-black text-zinc-900">
                      {{ totalPrice > 0 ? totalPrice + ' DT' : '-' }}
                    </span>
                  </div>
                </div>

                <!-- Conflict warning -->
                <div v-if="rangeConflict"
                  class="mt-3 flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                  <q-icon name="error_outline" size="14px" class="shrink-0 mt-0.5" />
                  La periode selectionnee chevauche une reservation existante.
                </div>

                <q-btn no-caps unelevated color="dark" label="Reserver maintenant" :loading="reservationsStore.saving"
                  :disable="!canSubmit" class="w-full! mt-4" @click="submitReservation" />
                <q-btn no-caps flat color="dark" label="Mes reservations" class="w-full! mt-1.5" to="/candidatures" />
              </template>

            </div>
          </aside>
          <!-- END RIGHT -->

        </div>
      </template>
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
const avisList = ref([])
const avisLoading = ref(false)
const bookedRanges = ref([])
const activePhoto = ref(0)
const reservationRange = ref(null)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isEtudiant = computed(() => authStore.user?.role === 'etudiant')

const selectedStartDate = computed(() => reservationRange.value?.from || '')
const selectedEndDate = computed(() => reservationRange.value?.to || '')

const calculatedDurationMonths = computed(() => {
  if (!selectedStartDate.value || !selectedEndDate.value) return 0
  const start = new Date(selectedStartDate.value + 'T00:00:00')
  const end = new Date(selectedEndDate.value + 'T00:00:00')
  if (isNaN(start) || isNaN(end) || start >= end) return 0
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30)))
})

const durationLabel = computed(() =>
  calculatedDurationMonths.value > 0 ? calculatedDurationMonths.value + ' mois' : '')

const totalPrice = computed(() =>
  calculatedDurationMonths.value > 0
    ? calculatedDurationMonths.value * Number(logement.value.prix || 0)
    : 0)

const rangeConflict = computed(() => {
  if (!selectedStartDate.value || !selectedEndDate.value) return false
  const start = new Date(selectedStartDate.value + 'T00:00:00')
  const end = new Date(selectedEndDate.value + 'T00:00:00')
  return bookedRanges.value.some(r => {
    const rFrom = new Date(String(r.date_debut).slice(0, 10) + 'T00:00:00')
    const rTo = new Date(String(r.date_fin).slice(0, 10) + 'T00:00:00')
    return rFrom < end && rTo > start
  })
})

const canSubmit = computed(() =>
  !!selectedStartDate.value &&
  !!selectedEndDate.value &&
  calculatedDurationMonths.value > 0 &&
  !rangeConflict.value
)

const photos = computed(() => {
  try {
    const v = logement.value?.photos
    const p = typeof v === 'string' ? JSON.parse(v) : v
    return Array.isArray(p) ? p.filter(Boolean) : []
  } catch { return [] }
})

const primaryImage = computed(() =>
  photos.value[0] || 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80'
)

const equipements = computed(() => {
  try {
    const v = logement.value?.equipemens
    const e = typeof v === 'string' ? JSON.parse(v) : v
    return Array.isArray(e) ? e.filter(Boolean) : []
  } catch { return [] }
})

const averageRating = computed(() => {
  if (!avisList.value.length) return 0
  return avisList.value.reduce((s, a) => s + Number(a.note || 0), 0) / avisList.value.length
})

function capitalize(text) {
  if (!text) return 'Logement'
  return String(text).charAt(0).toUpperCase() + String(text).slice(1)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  // Handle both 'YYYY-MM-DD' and full ISO/datetime strings from MySQL
  const plain = String(dateStr).slice(0, 10)
  const d = new Date(plain + 'T00:00:00')
  if (isNaN(d)) return '-'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isDateAvailable(dateStr) {
  const d = new Date(dateStr.replace(/\//g, '-') + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (d < today) return false
  return !bookedRanges.value.some(r => {
    const from = new Date(String(r.date_debut).slice(0, 10) + 'T00:00:00')
    const to = new Date(String(r.date_fin).slice(0, 10) + 'T00:00:00')
    return d >= from && d <= to
  })
}

async function loadLogement() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/logements/' + route.params.id)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Logement introuvable.')
    logement.value = data || {}
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function loadAvis() {
  avisLoading.value = true
  try {
    const res = await fetch('/api/avis/logement/' + route.params.id)
    const data = await res.json().catch(() => [])
    avisList.value = Array.isArray(data) ? data : []
  } catch { avisList.value = [] }
  finally { avisLoading.value = false }
}

async function loadBookedDates() {
  try {
    const res = await fetch('/api/logements/' + route.params.id + '/booked-dates')
    if (!res.ok) return
    const data = await res.json()
    bookedRanges.value = Array.isArray(data) ? data : []
  } catch { bookedRanges.value = [] }
}

async function submitReservation() {
  if (!canSubmit.value) {
    $q.notify({ message: 'Periode invalide ou deja reservee.', color: 'negative', position: 'top' })
    return
  }
  try {
    await reservationsStore.reserve({
      logement_id: route.params.id,
      date_debut: selectedStartDate.value,
      date_fin: selectedEndDate.value,
      duree: calculatedDurationMonths.value
    })
    $q.notify({ message: 'Demande de reservation envoyee au proprietaire !', color: 'positive', position: 'top' })
    await loadBookedDates()
    router.push('/candidatures')
  } catch (err) {
    $q.notify({ message: err.message || 'Erreur lors de la reservation.', color: 'negative', position: 'top' })
  }
}

onMounted(() => {
  Promise.all([loadLogement(), loadAvis(), loadBookedDates()])
})
</script>

<style scoped>
.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border: 1px solid #e4e4e7;
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 0.85rem;
  color: #52525b;
}

.card-section {
  background: #fff;
  border: 1px solid #f4f4f5;
  border-radius: 16px;
  padding: 20px;
}

.section-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 12px 0;
}
</style>
