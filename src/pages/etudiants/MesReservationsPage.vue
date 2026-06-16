<template>
  <q-page class="bg-zinc-50 text-zinc-900 min-h-screen font-sans selection:bg-black selection:text-white">
    <div class="max-w-7xl mx-auto px-6 pb-12">

      <header
        class="border-b-2 border-black pb-8 mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>

          <h1 class="text-4xl font-black tracking-tight text-black m-0">
            Mes Réservations
          </h1>
          <p class="text-zinc-800 mt-2 m-0 text-base font-medium max-w-xl">
            Suivez, gérez et examinez vos demandes de logement étudiant en temps réel.
          </p>
        </div>

        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">

          <button @click="refreshReservations" :disabled="refreshing"
            class="group flex items-center gap-2 bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-400 px-5 py-2.5 rounded-none font-bold text-sm tracking-wide transition-all duration-150 cursor-pointer">
            <RefreshCw :size="14" :class="{ 'animate-spin': refreshing }"
              class="group-hover:rotate-45 transition-transform" />
            <span>Rafraîchir les données</span>
          </button>
        </div>
      </header>

      <section v-if="reservations.length" class="flex flex-col sm:flex-row flex-wrap lg:flex-nowrap gap-4 mb-12 w-full">
        <div class="flex-1 min-w-45 bg-white border-2 border-zinc-900 p-6 shadow-xs">
          <p class="text-xs font-mono uppercase tracking-wider text-zinc-700 font-bold m-0">Demandes totales</p>
          <span class="block text-4xl font-bold font-mono text-black mt-2">{{ statusCounts.total }}</span>
        </div>
        <div v-for="(config, status) in STATUS_THEME" :key="status"
          class="flex-1 min-w-[180px] bg-white border-2 border-zinc-900 p-6 shadow-xs">
          <p class="text-xs font-mono uppercase tracking-wider text-zinc-700 font-bold m-0 flex items-center gap-1.5">
            <component :is="config.icon" :size="12" class="text-black stroke-[2.5]" />
            {{ config.label }}
          </p>
          <span class="block text-4xl font-bold font-mono text-black mt-2">
            {{ statusCounts[status] || 0 }}
          </span>
        </div>
      </section>

      <section v-if="reservations.length"
        class="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-8">
        <div class="relative flex-1 max-w-xl">
          <Search :size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-800 stroke-[2.5]" />
          <input v-model="searchQuery" type="text" placeholder="Filtrer par ville, type, rue..."
            class="w-full bg-white border-2 border-zinc-900 pl-11 pr-4 py-3 text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-500 font-medium transition-colors" />
        </div>

        <div class="flex bg-zinc-100 p-1 border-2 border-zinc-900 max-w-max self-start lg:self-auto">
          <button v-for="opt in statusFilterOptions" :key="opt.value" @click="statusFilter = opt.value" :class="[
            'px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer font-bold',
            statusFilter === opt.value ? 'bg-black text-white' : 'text-zinc-800 hover:text-black hover:bg-zinc-200'
          ]">
            {{ opt.label }}
          </button>
        </div>
      </section>

      <div v-if="store.loading" class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div v-for="n in 2" :key="n"
          class="border-2 border-zinc-900 bg-white h-[320px] p-6 flex flex-col justify-between">
          <div>
            <div class="w-1/3 h-4 bg-zinc-300 animate-pulse mb-4"></div>
            <div class="w-3/4 h-8 bg-zinc-300 animate-pulse mb-2"></div>
            <div class="w-1/2 h-4 bg-zinc-300 animate-pulse"></div>
          </div>
          <div class="space-y-2">
            <div class="w-full h-10 bg-zinc-300 animate-pulse"></div>
          </div>
        </div>
      </div>

      <div v-else-if="!store.loading && store.error"
        class="border-2 border-dashed border-black bg-white p-12 text-center max-w-xl mx-auto">
        <AlertCircle :size="32" class="mx-auto text-black mb-4" />
        <h3 class="text-lg font-black text-black mb-1 uppercase font-mono">Interruption système</h3>
        <p class="text-sm text-zinc-900 mb-0 font-mono font-bold">{{ store.error }}</p>
      </div>

      <div v-else-if="!store.loading && !reservations.length"
        class="border-2 border-zinc-900 bg-white p-16 text-center max-w-2xl mx-auto shadow-xs">
        <FolderOpen :size="40" class="mx-auto text-zinc-800 mb-4" />
        <h3 class="text-xl font-bold text-black mb-2">Aucune archive trouvée</h3>
        <p class="text-zinc-800 text-sm mb-6 max-w-sm mx-auto font-medium">Vous n'avez initié aucun dossier de
          réservation pour le moment.</p>
        <q-btn no-caps unelevated color="dark" label="Rechercher un logement" to="/recherche"
          class="rounded-none px-6 py-2 font-mono text-xs tracking-wider font-bold" />
      </div>

      <div v-else-if="!filteredReservations.length"
        class="border-2 border-zinc-900 bg-white p-12 text-center max-w-md mx-auto">
        <SlidersHorizontal :size="24" class="mx-auto text-zinc-800 mb-3" />
        <h3 class="text-sm font-bold text-black mb-1">Aucune correspondance</h3>
        <p class="text-xs text-zinc-700 mb-4 font-medium">Ajustez vos filtres textuels ou de statut.</p>
        <button @click="resetFilters"
          class="text-xs font-mono uppercase underline tracking-wider font-black text-black hover:text-zinc-600 cursor-pointer">
          Réinitialiser
        </button>
      </div>

      <template v-else>
        <div class="text-xs font-mono text-zinc-700 mb-4 uppercase tracking-wider font-bold">
          Affichage de <span class="text-black font-black">{{ filteredReservations.length }}</span> enregistrement(s)
        </div>

        <transition-group name="grid-fade" tag="div" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <article v-for="item in filteredReservations" :key="`${item.etudiant_id}-${item.logement_id}`"
            class="bg-white border-2 border-zinc-900 transition-all duration-200 hover:border-black flex flex-col justify-between group shadow-xs hover:shadow-md">
            <div class="p-6 sm:p-8">
              <div class="flex items-start justify-between gap-4 mb-6">
                <div>
                  <span class="text-xs font-mono uppercase tracking-widest text-zinc-700 block mb-1 font-bold">
                    {{ item.type || 'Logement' }}
                  </span>
                  <h3
                    class="text-xl font-black text-black tracking-tight m-0 group-hover:underline decoration-2 underline-offset-4">
                    {{ capitalize(item.ville) }}
                  </h3>
                  <div class="text-sm text-zinc-800 font-medium flex items-center gap-1.5 mt-1.5">
                    <MapPin :size="14" class="text-zinc-900 shrink-0 stroke-[2.5]" />
                    <span class="truncate">{{ item.adress || item.adresse || 'Adresse non spécifiée' }}</span>
                  </div>
                </div>

                <span
                  :class="['px-3 py-1 text-[10px] font-mono uppercase tracking-widest font-black border-2', STATUS_THEME[item.reservation_statut]?.class || 'border-zinc-900 text-zinc-900']">
                  {{ getStatusLabel(item.reservation_statut) }}
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 my-4 border-y-2 border-zinc-900 font-mono">
                <div>
                  <span class="text-[10px] uppercase text-zinc-700 block tracking-wider font-bold">Loyer</span>
                  <span class="text-sm font-black text-black mt-0.5 block">{{ Number(item.prix || 0) }} DT</span>
                </div>
                <div>
                  <span class="text-[10px] uppercase text-zinc-700 block tracking-wider font-bold">Période</span>
                  <span class="text-sm font-black text-black mt-0.5 block">{{ item.duree }} mois</span>
                </div>
                <div>
                  <span class="text-[10px] uppercase text-zinc-700 block tracking-wider font-bold">Début</span>
                  <span class="text-xs text-zinc-900 font-bold mt-1 block">{{ formatDate(item.date_debut) }}</span>
                </div>
                <div>
                  <span class="text-[10px] uppercase text-zinc-700 block tracking-wider font-bold">Échéance</span>
                  <span class="text-xs text-zinc-900 font-bold mt-1 block">{{ formatDate(item.date_fin) }}</span>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-sm">
                <div class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 rounded-none bg-black text-white font-mono text-[10px] font-black flex items-center justify-center">
                    {{ item.proprietaire_prenom?.charAt(0).toUpperCase() || 'P' }}
                  </div>
                  <span class="font-bold text-black">
                    {{ item.proprietaire_prenom }} {{ item.proprietaire_nom }}
                  </span>
                </div>
                <div v-if="item.proprietaire_tel"
                  class="text-xs font-mono text-zinc-900 font-bold flex items-center gap-1.5">
                  <Phone :size="12" class="text-black stroke-[2.5]" />
                  {{ item.proprietaire_tel }}
                </div>
              </div>

              <div v-if="item.note_proprietaire"
                class="mt-4 p-4 bg-zinc-100 border-l-4 border-black text-xs text-black font-medium italic leading-relaxed">
                " {{ item.note_proprietaire }} "
              </div>
            </div>

            <div class="bg-zinc-100 border-t-2 border-zinc-900 p-4 flex gap-3 items-center justify-between">
              <q-btn flat no-caps dense color="dark" label="Consulter la fiche" :to="`/logements/${item.logement_id}`"
                class="font-mono text-xs tracking-wider font-bold underline underline-offset-4 hover:text-zinc-600" />

              <div class="flex gap-2">
                <button v-if="canCancel(item.reservation_statut)" @click="confirmCancel(item.logement_id)"
                  :disabled="cancelingId === Number(item.logement_id)"
                  class="border-2 border-zinc-900 hover:bg-black hover:text-white text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 transition-colors bg-white cursor-pointer disabled:opacity-40">
                  Annuler
                </button>
                <button v-if="item.reservation_statut === 'acceptee'" @click="openReviewDialog(item)"
                  class="bg-black text-white hover:bg-zinc-800 text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 transition-colors cursor-pointer">
                  Rédiger un avis
                </button>
              </div>
            </div>
          </article>
        </transition-group>
      </template>
    </div>

    <q-dialog v-model="reviewDialogOpen" persistent backdrop-filter="grayscale(100%) opacity(60%)">
      <q-card class="rounded-none max-w-md w-full border-2 border-black p-6 bg-white text-zinc-900 shadow-2xl">
        <q-card-section class="p-0 pb-4 border-b-2 border-zinc-900">
          <h3 class="text-lg font-black tracking-tight text-black m-0 uppercase font-mono">Retour d'expérience</h3>
          <p class="text-xs text-zinc-800 font-bold m-0 mt-1">
            {{ reviewTarget ? `${capitalize(reviewTarget.type)} à ${reviewTarget.ville}` : '' }}
          </p>
        </q-card-section>

        <q-card-section class="p-0 py-6">
          <div class="mb-6">
            <label class="block text-xs font-mono uppercase tracking-wider text-zinc-800 font-bold mb-2">Évaluation
              globale</label>
            <q-rating v-model="reviewDraft.note" size="28px" color="grey-10" icon="star_border" icon-selected="star"
              class="flex justify-start" />
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono uppercase tracking-wider text-zinc-800 font-bold">Commentaire</label>
            <textarea v-model="reviewDraft.commentaire" rows="4" placeholder="Décrivez votre séjour..."
              class="w-full bg-zinc-50 border-2 border-zinc-900 p-3 text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-500 font-medium transition-colors resize-none"></textarea>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="p-0 pt-4 border-t-2 border-zinc-900 gap-2">
          <button @click="closeReviewDialog"
            class="px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold hover:bg-zinc-200 transition-colors cursor-pointer">
            Fermer
          </button>
          <button @click="submitReview" :disabled="reviewSaving"
            class="px-5 py-2 text-xs font-mono uppercase tracking-wider font-bold bg-black text-white hover:bg-zinc-800 transition-colors disabled:bg-zinc-400 cursor-pointer">
            {{ reviewSaving ? 'Envoi...' : 'Soumettre' }}
          </button>
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
import {
  RefreshCw,
  Clock,
  Check,
  X,
  Search,
  SlidersHorizontal,
  FolderOpen,
  AlertCircle,
  MapPin,
  Phone
} from 'lucide-vue-next'

// Boosted contrast definitions inside configuration models
const STATUS_THEME = {
  en_attente: { label: 'En attente', icon: Clock, class: 'border-zinc-900 bg-zinc-100 text-black font-black' },
  acceptee: { label: 'Acceptée', icon: Check, class: 'border-black bg-black text-white' },
  refusee: { label: 'Refusée', icon: X, class: 'border-zinc-400 bg-zinc-100 text-zinc-600 line-through font-bold' },
  annulee: { label: 'Annulée', icon: X, class: 'border-dashed border-zinc-500 text-zinc-700 font-bold' }
}

const statusFilterOptions = [
  { label: 'Tous', value: 'all' },
  { label: 'En Attente', value: 'en_attente' },
  { label: 'Acceptées', value: 'acceptee' },
  { label: 'Refusées', value: 'refusee' }
]

const $q = useQuasar()
const store = useReservationsStore()
const authStore = useAuthStore()

const reviewDialogOpen = ref(false)
const reviewSaving = ref(false)
const reviewTarget = ref(null)
const refreshing = ref(false)
const cancelingId = ref(null)
const statusFilter = ref('all')
const searchQuery = ref('')
const lastRefreshAt = ref('')

const reviewDraft = ref({
  note: 5,
  commentaire: ''
})

const reservations = computed(() => store.sortedItems || [])

const statusCounts = computed(() => {
  const base = { total: reservations.value.length, en_attente: 0, acceptee: 0, refusee: 0, annulee: 0 }
  reservations.value.forEach((item) => {
    const s = item.reservation_statut
    if (s in base) base[s]++
  })
  return base
})

const filteredReservations = computed(() => {
  const query = searchQuery.value?.trim().toLowerCase() || ''
  return reservations.value.filter((item) => {
    if (statusFilter.value !== 'all' && item.reservation_statut !== statusFilter.value) {
      return false
    }
    if (!query) return true
    const textData = [item.ville, item.type, item.adress, item.adresse].map(v => String(v || '').toLowerCase())
    return textData.some(str => str.includes(query))
  })
})

function getStatusLabel(status) {
  return STATUS_THEME[status]?.label || 'Inconnu'
}

function formatDate(dateValue) {
  if (!dateValue) return '—'
  const date = new Date(dateValue)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}


// Fixed case mapping logic directly bound inside view template expressions
function capitalize(text) {
  if (!text) return ''
  const val = String(text)
  return val.charAt(0).toUpperCase() + val.slice(1)
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
  } catch {
    $q.notify({ message: 'Erreur de mise à jour.', color: 'dark' })
  } finally {
    refreshing.value = false
  }
}

// Clean functional parameter configuration block without loose assignments
function confirmCancel(logementId) {
  $q.dialog({
    title: 'Confirmation',
    message: 'Souhaitez-vous annuler définitivement cette demande de réservation ?',
    ok: { flat: false, label: 'Oui, Annuler', color: 'dark', rounded: false, noCaps: true },
    cancel: { flat: true, label: 'Conserver', color: 'dark', noCaps: true }
  }).onOk(async () => {
    cancelingId.value = Number(logementId)
    try {
      await store.cancel(logementId)
      $q.notify({ message: 'Dossier annulé.', color: 'dark' })
    } catch {
      $q.notify({ message: 'Échec de la demande d\'annulation.', color: 'dark' })
    } finally {
      cancelingId.value = null
    }
  })
}

function openReviewDialog(item) {
  reviewTarget.value = item
  reviewDraft.value = { note: 5, commentaire: '' }
  reviewDialogOpen.value = true
}

function closeReviewDialog() {
  reviewDialogOpen.value = false
  reviewSaving.value = false
  reviewTarget.value = null
}

async function submitReview() {
  if (!reviewTarget.value) return
  reviewSaving.value = true
  try {
    const response = await fetch('/api/avis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authStore.authHeader },
      body: JSON.stringify({
        logement_id: reviewTarget.value.logement_id,
        note: Math.floor(Number(reviewDraft.value.note)),
        commentaire: reviewDraft.value.commentaire || ''
      })
    })
    if (!response.ok) throw new Error()
    $q.notify({ message: 'Avis enregistré.', color: 'dark' })
    closeReviewDialog()
  } catch {
    $q.notify({ message: 'Erreur lors de l\'enregistrement.', color: 'dark' })
  } finally {
    reviewSaving.value = false
  }
}

onMounted(async () => {
  if (!reservations.value.length) await refreshReservations()
})
</script>

<style scoped>
.grid-fade-enter-active,
.grid-fade-leave-active {
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.grid-fade-enter-from {
  opacity: 0;
  transform: scale(0.99) translateY(4px);
}

.grid-fade-leave-to {
  opacity: 0;
  transform: scale(0.99) translateY(-4px);
}

.animate-spin-slow {
  animation: spin 6s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
