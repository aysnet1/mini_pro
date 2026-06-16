<template>
  <q-page class="bg-zinc-50 min-h-screen">
    <div class="max-w-5xl mx-auto px-4 pt-6 pb-24">

      <!-- Header -->
      <div class="mb-6">
        <div class="text-2xl font-black text-zinc-900 m-0">Réservations reçues</div>
        <p class="text-zinc-400 mt-1 m-0 text-sm">Gérez les demandes de vos annonces</p>
      </div>

      <!-- Filter bar -->
      <div v-if="!store.loading && !store.error" class="flex flex-wrap items-center gap-2 mb-5">
        <!-- Status filters -->
        <div class="flex flex-wrap gap-1.5 flex-1">
          <button v-for="opt in statusOpts" :key="opt.value"
            class="px-3 py-1.5 rounded-full text-xs font-bold border transition-all" :class="filterStatus === opt.value
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'" @click="filterStatus = opt.value">
            {{ opt.label }}
          </button>
        </div>
        <!-- Sort dropdown -->
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[0.7rem] font-bold text-zinc-400">Trier :</span>
          <select v-model="sortBy" :style="selectStyle"
            class="text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:border-zinc-400 transition-all appearance-none pr-7">
            <option v-for="s in sortOpts" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="flex items-center justify-center py-24">
        <q-spinner-dots size="36px" color="dark" />
      </div>

      <!-- Error -->
      <q-banner v-else-if="store.error" rounded class="bg-red-50 text-red-700 border border-red-200 mb-4">
        {{ store.error }}
      </q-banner>

      <!-- Empty -->
      <div v-else-if="!groupedLogements.length"
        class="border border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
        <q-icon name="inbox" size="42px" />
        <p class="m-0 text-sm font-semibold">Aucune demande pour le moment</p>
      </div>

      <!-- Grouped by logement -->
      <div v-else class="flex flex-col gap-6">
        <div v-for="group in groupedLogements" :key="group.logement_id"
          class="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">

          <!-- Logement header -->
          <div class="flex items-start gap-3 p-4 border-b border-zinc-100">
            <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-100">
              <img :src="coverImage(group.photos)" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-black text-zinc-900 text-sm sm:text-base truncate">
                {{ capitalize(group.type) }} · {{ group.ville }}
              </div>
              <div class="text-zinc-400 text-xs mt-0.5 truncate">{{ group.adress }}</div>
              <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span
                  class="text-xs font-bold text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full">
                  {{ Number(group.prix || 0) }} DT / mois
                </span>
                <span class="text-xs font-bold bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full"
                  :class="pendingCount(group) > 0 ? 'text-amber-600 border-amber-200 bg-amber-50' : 'text-zinc-500'">
                  {{ group.reservations.length }} demande{{ group.reservations.length > 1 ? 's' : '' }}
                  <span v-if="pendingCount(group) > 0"> · {{ pendingCount(group) }} en attente</span>
                </span>
              </div>
            </div>
            <q-btn flat no-caps dense color="dark" icon="open_in_new" :to="`/logements/${group.logement_id}`"
              class="shrink-0 mt-0.5" />
          </div>

          <!-- Reservations list for this logement -->
          <div class="divide-y divide-zinc-100">
            <div v-for="item in group.reservations" :key="item.etudiant_id" class="p-4">

              <!-- Row 1: Student avatar + info + status badge -->
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {{ item.etudiant_prenom?.charAt(0) }}{{ item.etudiant_nom?.charAt(0) }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-zinc-900 text-sm truncate">
                    {{ item.etudiant_prenom }} {{ item.etudiant_nom }}
                  </div>
                  <div class="text-zinc-400 text-xs truncate">
                    {{ item.etudiant_email || item.etudiant_tel || '-' }}
                  </div>
                </div>
                <!-- Status badge always visible top-right -->
                <div class="flex items-center gap-1 shrink-0">
                  <span class="status-badge" :class="statusClass(item.reservation_statut)">
                    {{ statusLabel(item.reservation_statut) }}
                  </span>
                  <q-btn v-if="item.note_proprietaire" flat round dense icon="info_outline" color="grey-6" size="sm">
                    <q-tooltip>{{ item.note_proprietaire }}</q-tooltip>
                  </q-btn>
                </div>
              </div>

              <!-- Row 2: Date range + total + actions -->
              <div class="flex flex-wrap items-center gap-2 mt-2.5 pl-12">
                <div
                  class="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 flex-wrap">
                  <q-icon name="calendar_today" size="11px" class="text-zinc-400" />
                  <span class="text-xs font-semibold text-zinc-700">{{ formatDate(item.date_debut) }}</span>
                  <span class="text-zinc-300 text-xs">→</span>
                  <span class="text-xs font-semibold text-zinc-700">{{ formatDate(item.date_fin) }}</span>
                  <span class="text-zinc-400 text-[0.68rem] ml-0.5">· {{ item.duree }} mois</span>
                </div>
                <span class="text-xs font-black text-zinc-900">{{ item.duree * Number(item.prix || 0) }} DT</span>
                <!-- Actions for pending -->
                <template v-if="item.reservation_statut === 'en_attente'">
                  <q-btn no-caps unelevated color="positive" label="Accepter" size="sm" dense :loading="isSaving(item)"
                    :disable="savingKey !== null" @click="openDecisionDialog(item, group, 'acceptee')" />
                  <q-btn no-caps unelevated color="negative" label="Refuser" size="sm" dense :loading="isSaving(item)"
                    :disable="savingKey !== null" @click="openDecisionDialog(item, group, 'refusee')" />
                </template>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useReservationsStore } from '@/stores/reservations'

const $q = useQuasar()
const store = useReservationsStore()
const savingKey = ref(null)
const filterStatus = ref('all')
const sortBy = ref('pending_first')

const statusOpts = [
  { value: 'all', label: 'Toutes' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'acceptee', label: 'Acceptées' },
  { value: 'refusee', label: 'Refusées' },
  { value: 'annulee', label: 'Annulées' }
]

const sortOpts = [
  { value: 'pending_first', label: 'En attente d\'abord' },
  { value: 'latest', label: 'Plus récentes' },
  { value: 'updated', label: 'Mises à jour' }
]

function isSaving(item) {
  return savingKey.value === `${item.logement_id}-${item.etudiant_id}`
}

const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center'
}

// Group flat reservations list by logement_id
const groupedLogements = computed(() => {
  const map = new Map()
  for (const item of store.sortedOwnerItems) {
    // Apply status filter per student row
    if (filterStatus.value !== 'all' && item.reservation_statut !== filterStatus.value) continue
    if (!map.has(item.logement_id)) {
      map.set(item.logement_id, {
        logement_id: item.logement_id,
        type: item.type,
        ville: item.ville,
        adress: item.adress,
        prix: item.prix,
        photos: item.photos,
        reservations: []
      })
    }
    map.get(item.logement_id).reservations.push(item)
  }

  const groups = [...map.values()]

  if (sortBy.value === 'pending_first') {
    groups.sort((a, b) => pendingCount(b) - pendingCount(a))
  } else if (sortBy.value === 'latest') {
    groups.forEach(g => g.reservations.sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut)))
    groups.sort((a, b) => new Date(b.reservations[0]?.date_debut) - new Date(a.reservations[0]?.date_debut))
  } else if (sortBy.value === 'updated') {
    groups.forEach(g => g.reservations.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0)))
    groups.sort((a, b) => new Date(b.reservations[0]?.updated_at || 0) - new Date(a.reservations[0]?.updated_at || 0))
  }

  return groups
})

function pendingCount(group) {
  return group.reservations.filter(r => r.reservation_statut === 'en_attente').length
}

function parsePhotos(value) {
  try {
    const p = typeof value === 'string' ? JSON.parse(value) : value
    return Array.isArray(p) ? p : []
  } catch { return [] }
}

function coverImage(value) {
  const photos = parsePhotos(value)
  return photos[0] || 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80'
}

function formatDate(dateValue) {
  if (!dateValue) return '-'
  const d = new Date(dateValue)
  if (isNaN(d)) return '-'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function capitalize(text) {
  if (!text) return 'Logement'
  return String(text).charAt(0).toUpperCase() + String(text).slice(1)
}

function statusLabel(status) {
  const map = { en_attente: 'En attente', acceptee: 'Acceptée', refusee: 'Refusée', annulee: 'Annulée' }
  return map[status] || status
}

function statusClass(status) {
  if (status === 'en_attente') return 'badge-pending'
  if (status === 'acceptee') return 'badge-accepted'
  if (status === 'refusee') return 'badge-refused'
  if (status === 'annulee') return 'badge-cancelled'
  return ''
}

function openDecisionDialog(item, group, decision) {
  const isAccept = decision === 'acceptee'
  $q.dialog({
    title: isAccept ? 'Accepter la demande' : 'Refuser la demande',
    message: isAccept
      ? `Accepter la demande de ${item.etudiant_prenom} ${item.etudiant_nom} du ${formatDate(item.date_debut)} au ${formatDate(item.date_fin)} ?`
      : `Refuser la demande de ${item.etudiant_prenom} ${item.etudiant_nom} ?`,
    prompt: { model: '', type: 'text', label: 'Note au demandeur (optionnelle)' },
    cancel: { flat: true, label: 'Annuler', color: 'dark' },
    ok: { unelevated: true, label: isAccept ? 'Accepter' : 'Refuser', color: isAccept ? 'positive' : 'negative' }
  }).onOk(async (note) => {
    savingKey.value = `${item.logement_id}-${item.etudiant_id}`
    try {
      await store.decideReservation(item.logement_id, item.etudiant_id, decision, note || '')
      $q.notify({ message: isAccept ? 'Demande acceptée.' : 'Demande refusée.', color: 'positive', position: 'top' })
    } catch (err) {
      $q.notify({ message: err.message || 'Opération échouée.', color: 'negative', position: 'top' })
    } finally {
      savingKey.value = null
    }
  })
}

onMounted(async () => {
  try { await store.fetchOwnerReservations() } catch { /* store.error handles it */ }
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.badge-pending {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.badge-accepted {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.badge-refused {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.badge-cancelled {
  background: #f4f4f5;
  color: #71717a;
  border: 1px solid #e4e4e7;
}
</style>
