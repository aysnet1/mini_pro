<template>
  <q-page class="reservations-page">
    <div class="container">
      <div class="head q-mb-lg">
        <div class="head-top-row">
          <div>
            <h1>Mes reservations</h1>
            <p>Suivez vos logements reserves et gerez vos demandes.</p>
          </div>
          <q-btn flat no-caps color="dark" icon="refresh" label="Rafraichir" :loading="refreshing"
            @click="refreshReservations" />
        </div>
        <div v-if="lastRefreshAt" class="last-refresh-text">
          Derniere mise a jour: {{ formatLastRefresh(lastRefreshAt) }}
        </div>
      </div>

      <div v-if="reservations.length" class="stats-grid q-mb-md">
        <div class="stat-card">
          <span class="stat-label">Total</span>
          <span class="stat-value">{{ statusCounts.total }}</span>
        </div>
        <div class="stat-card warning">
          <span class="stat-label">En attente</span>
          <span class="stat-value">{{ statusCounts.en_attente }}</span>
        </div>
        <div class="stat-card positive">
          <span class="stat-label">Acceptees</span>
          <span class="stat-value">{{ statusCounts.acceptee }}</span>
        </div>
        <div class="stat-card negative">
          <span class="stat-label">Refusees</span>
          <span class="stat-value">{{ statusCounts.refusee }}</span>
        </div>
      </div>

      <div v-if="reservations.length" class="filter-bar q-mb-md">
        <q-input v-model="searchQuery" dense outlined clearable label="Rechercher (ville, type, adresse)"
          class="filter-search" />

        <q-btn-toggle v-model="statusFilter" no-caps unelevated outline toggle-color="dark"
          :options="statusFilterOptions" class="filter-toggle" />
      </div>

      <div v-if="store.loading" class="cards-grid skeleton-grid">
        <q-card v-for="n in 4" :key="`skeleton-${n}`" flat class="reservation-card skeleton-card">
          <q-skeleton height="180px" square />
          <q-card-section>
            <q-skeleton type="text" width="70%" />
            <q-skeleton type="text" width="50%" class="q-mt-xs" />
            <div class="q-mt-md">
              <q-skeleton type="rect" height="66px" />
            </div>
            <div class="q-mt-md">
              <q-skeleton type="text" width="85%" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div v-else-if="store.error" class="state-box state-error">
        <span>{{ store.error }}</span>
      </div>

      <div v-else-if="!reservations.length" class="state-box">
        <span>Vous n'avez aucune reservation pour le moment.</span>
        <q-btn no-caps unelevated color="dark" label="Explorer les logements" to="/recherche" class="q-mt-md" />
      </div>

      <div v-else-if="!filteredReservations.length" class="state-box">
        <span>Aucun resultat pour les filtres actuels.</span>
        <q-btn flat no-caps color="dark" label="Reinitialiser les filtres" class="q-mt-sm" @click="resetFilters" />
      </div>

      <template v-else>
        <div class="results-summary q-mb-sm">
          <span class="results-count">
            {{ filteredReservations.length }} resultat(s) affiche(s)
          </span>
          <q-chip dense outline color="dark" text-color="dark" class="results-filter-chip">
            Filtre: {{ statusLabel(statusFilter === 'all' ? '' : statusFilter) }}
          </q-chip>
        </div>

        <transition-group name="card-fade" tag="div" class="cards-grid">
          <q-card v-for="item in filteredReservations" :key="`${item.etudiant_id}-${item.logement_id}`" flat
            class="reservation-card">
            <div class="card-image" :style="{ backgroundImage: `url('${coverImage(item.photos)}')` }"></div>

            <q-card-section>
              <div class="row items-start justify-between q-col-gutter-sm">
                <div class="col">
                  <div class="title">{{ capitalize(item.type) }} - {{ item.ville }}</div>
                  <div class="sub">{{ item.adress || 'Adresse non renseignee' }}</div>
                </div>
                <q-badge :label="statusLabel(item.reservation_statut)" :color="statusColor(item.reservation_statut)"
                  text-color="white" />
              </div>

              <div class="meta-grid q-mt-md">
                <div class="meta-item">
                  <span class="label">Prix</span>
                  <span class="value">{{ Number(item.prix || 0) }} DT/mois</span>
                </div>
                <div class="meta-item">
                  <span class="label">Duree</span>
                  <span class="value">{{ item.duree }} mois</span>
                </div>
                <div class="meta-item">
                  <span class="label">Date debut</span>
                  <span class="value">{{ formatDate(item.date_debut) }}</span>
                </div>
                <div class="meta-item">
                  <span class="label">Date fin</span>
                  <span class="value">{{ formatDate(item.date_fin) }}</span>
                </div>
              </div>

              <div class="owner q-mt-md">
                Proprietaire: {{ item.proprietaire_prenom }} {{ item.proprietaire_nom }}
                <span v-if="item.proprietaire_tel"> • {{ item.proprietaire_tel }}</span>
              </div>

              <div class="owner q-mt-xs">
                Statut logement: <strong>{{ item.logement_statut || 'disponible' }}</strong>
              </div>

              <div v-if="item.note_proprietaire" class="owner-note q-mt-sm">
                Note proprietaire: {{ item.note_proprietaire }}
              </div>

              <div class="actions q-mt-md">
                <q-btn flat no-caps color="dark" label="Voir le logement" :to="`/logements/${item.logement_id}`" />
                <q-btn v-if="canCancel(item.reservation_statut)" no-caps unelevated color="negative"
                  label="Annuler la demande" :loading="cancelingId === Number(item.logement_id)"
                  @click="confirmCancel(item.logement_id)" />
                <q-btn v-if="item.reservation_statut === 'acceptee'" no-caps unelevated color="primary"
                  label="Laisser un avis" :loading="submittingReview" @click="openReviewDialog(item)" />
              </div>
            </q-card-section>
          </q-card>
        </transition-group>
      </template>
    </div>

    <q-dialog v-model="reviewDialogOpen" persistent>
      <q-card class="review-dialog-card">
        <q-card-section>
          <div class="text-h6 text-weight-bold">Votre avis</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            {{ reviewTarget ? `${capitalize(reviewTarget.type)} - ${reviewTarget.ville}` : '' }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-subtitle2 q-mb-xs">Note</div>
          <q-rating v-model="reviewDraft.note" size="32px" color="amber-7" icon="star_border" icon-selected="star" />

          <q-input v-model="reviewDraft.commentaire" type="textarea" autogrow outlined class="q-mt-md"
            label="Commentaire" hint="Partagez votre experience (optionnel)" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat no-caps color="dark" label="Annuler" @click="closeReviewDialog" />
          <q-btn no-caps unelevated color="primary" label="Publier" :loading="reviewSaving" @click="submitReview" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useReservationsStore } from '@/stores/reservations'
import { useAuthStore } from '@/stores/auth'

const $q = useQuasar()
const store = useReservationsStore()
const authStore = useAuthStore()
const submittingReview = ref(false)
const reviewDialogOpen = ref(false)
const reviewSaving = ref(false)
const reviewTarget = ref(null)
const refreshing = ref(false)
const cancelingId = ref(null)
const statusFilter = ref('all')
const searchQuery = ref('')
const lastRefreshAt = ref('')

const statusFilterOptions = [
  { label: 'Tous', value: 'all' },
  { label: 'En attente', value: 'en_attente' },
  { label: 'Acceptees', value: 'acceptee' },
  { label: 'Refusees', value: 'refusee' },
  { label: 'Annulees', value: 'annulee' }
]
const reviewDraft = ref({
  note: 5,
  commentaire: ''
})

const reservations = computed(() => store.sortedItems)

const statusCounts = computed(() => {
  const base = {
    total: reservations.value.length,
    en_attente: 0,
    acceptee: 0,
    refusee: 0,
    annulee: 0
  }

  reservations.value.forEach((item) => {
    const status = `${item.reservation_statut || ''}`
    if (status in base) base[status] += 1
  })

  return base
})

const filteredReservations = computed(() => {
  const query = `${searchQuery.value || ''}`.trim().toLowerCase()

  return reservations.value.filter((item) => {
    if (statusFilter.value !== 'all' && item.reservation_statut !== statusFilter.value) {
      return false
    }

    if (!query) return true

    const haystack = [item.ville, item.type, item.adress]
      .map((v) => `${v || ''}`.toLowerCase())
      .join(' ')

    return haystack.includes(query)
  })
})

function parsePhotos(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function coverImage(value) {
  const photos = parsePhotos(value)
  return photos[0] || 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
}

function formatDate(dateValue) {
  if (!dateValue) return '-'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('fr-FR')
}

function capitalize(text) {
  if (!text) return 'Logement'
  const value = `${text}`
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function statusLabel(status) {
  if (!status || status === 'all') return 'Tous'
  if (status === 'en_attente') return 'En attente'
  if (status === 'acceptee') return 'Acceptee'
  if (status === 'refusee') return 'Refusee'
  if (status === 'annulee') return 'Annulee'
  return 'Inconnu'
}

function formatLastRefresh(isoString) {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function statusColor(status) {
  if (status === 'en_attente') return 'warning'
  if (status === 'acceptee') return 'positive'
  if (status === 'refusee') return 'negative'
  if (status === 'annulee') return 'grey-7'
  return 'dark'
}

function canCancel(status) {
  return status === 'en_attente' || status === 'acceptee'
}

function resetFilters() {
  statusFilter.value = 'all'
  searchQuery.value = ''
}

async function refreshReservations() {
  refreshing.value = true
  try {
    await store.fetchMine()
    lastRefreshAt.value = new Date().toISOString()
  } finally {
    refreshing.value = false
  }
}

function confirmCancel(logementId) {
  $q.dialog({
    title: 'Annuler reservation',
    message: 'Voulez-vous vraiment annuler cette reservation ?',
    cancel: { flat: true, label: 'Non', color: 'dark' },
    ok: { unelevated: true, label: 'Oui, annuler', color: 'negative' }
  }).onOk(async () => {
    try {
      cancelingId.value = Number(logementId)
      await store.cancel(logementId)
      $q.notify({ message: 'Reservation annulee.', color: 'positive', position: 'top' })
    } catch (err) {
      $q.notify({ message: err.message || "Echec de l'annulation.", color: 'negative', position: 'top' })
    } finally {
      cancelingId.value = null
    }
  })
}

function openReviewDialog(item) {
  reviewTarget.value = item
  reviewDraft.value = {
    note: 5,
    commentaire: ''
  }
  reviewDialogOpen.value = true
}

function closeReviewDialog() {
  reviewDialogOpen.value = false
  reviewSaving.value = false
  reviewTarget.value = null
}

async function submitReview() {
  if (!reviewTarget.value) return

  const noteValue = Number(reviewDraft.value.note)
  if (!Number.isInteger(noteValue) || noteValue < 1 || noteValue > 5) {
    $q.notify({ message: 'La note doit etre entre 1 et 5.', color: 'negative', position: 'top' })
    return
  }

  reviewSaving.value = true
  submittingReview.value = true
  try {
    const response = await fetch('/api/avis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authStore.authHeader
      },
      body: JSON.stringify({
        logement_id: reviewTarget.value.logement_id,
        note: noteValue,
        commentaire: reviewDraft.value.commentaire || ''
      })
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Impossible de publier l avis.')

    $q.notify({
      message: data.message || 'Avis publie avec succes.',
      color: 'positive',
      position: 'top'
    })
    closeReviewDialog()
  } catch (err) {
    $q.notify({
      message: err.message || 'Erreur lors de la publication de l avis.',
      color: 'negative',
      position: 'top'
    })
  } finally {
    reviewSaving.value = false
    submittingReview.value = false
  }
}

onMounted(async () => {
  try {
    await refreshReservations()
  } catch {
    // Erreur deja exposee via store.error
  }
})
</script>

<style scoped>
.reservations-page {
  min-height: 100vh;
  background: #f8fafc;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 56px;
}

.head h1 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
}

.head-top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.last-refresh-text {
  margin-top: 4px;
  font-size: 0.72rem;
  color: #64748b;
  letter-spacing: 0.02em;
}

.head p {
  margin: 6px 0 0;
  color: #64748b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.stat-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  padding: 10px 12px;
}

.stat-card.warning {
  border-color: #facc15;
}

.stat-card.positive {
  border-color: #22c55e;
}

.stat-card.negative {
  border-color: #ef4444;
}

.stat-label {
  display: block;
  font-size: 0.72rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-value {
  display: block;
  margin-top: 4px;
  font-size: 1.12rem;
  font-weight: 800;
  color: #0f172a;
}

.filter-bar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

.filter-search {
  min-width: 240px;
}

.filter-toggle {
  width: fit-content;
}

.state-box {
  min-height: 260px;
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #334155;
  background: #fff;
  text-align: center;
  padding: 12px;
}

.state-error {
  color: #991b1b;
}

.results-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.results-count {
  font-size: 0.8rem;
  color: #475569;
  font-weight: 700;
}

.results-filter-chip {
  background: #fff;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.reservation-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(2, 6, 23, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.reservation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(2, 6, 23, 0.08);
  border-color: #cbd5e1;
}

.skeleton-card {
  pointer-events: none;
}

.card-image {
  height: 180px;
  background-size: cover;
  background-position: center;
}

.title {
  font-weight: 800;
  color: #0f172a;
}

.sub {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.92rem;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.meta-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 9px 10px;
}

.label {
  display: block;
  font-size: 0.72rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.value {
  margin-top: 3px;
  display: block;
  color: #111827;
  font-weight: 700;
}

.owner {
  color: #334155;
}

.owner-note {
  border-left: 3px solid #cbd5e1;
  padding-left: 8px;
  color: #475569;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.review-dialog-card {
  width: 560px;
  max-width: 92vw;
}

.card-fade-enter-active,
.card-fade-leave-active {
  transition: all 0.25s ease;
}

.card-fade-enter-from,
.card-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 900px) {
  .head-top-row {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-bar {
    grid-template-columns: 1fr;
  }

  .results-summary {
    flex-direction: column;
    align-items: flex-start;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
