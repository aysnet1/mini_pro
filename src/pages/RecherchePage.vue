<template>
  <q-page class="search-page">
    <div class="search-topbar">
      <div class="top-pill">
        <q-icon name="place" size="18px" />
        <span>Logements dans la zone de la carte</span>
      </div>
      <div class="top-filters">
        <q-select v-model="filters.ville" :options="villeOptions" dense borderless clearable emit-value map-options
          use-input fill-input hide-selected input-debounce="0" placeholder="Ville" class="filter-input"
          @filter="filterVilleOptions" />
        <q-input v-model="filters.universite" dense borderless placeholder="Université" class="filter-input" />
        <q-input v-model.number="filters.budget_max" dense borderless type="number" placeholder="Budget max"
          class="filter-input" />
        <q-select v-model="filters.type" :options="typeOptions" dense borderless emit-value map-options clearable
          placeholder="Type" class="filter-input" />
        <q-btn v-if="hasActiveFilters" no-caps flat color="dark" icon="restart_alt" label="Réinitialiser"
          class="reset-filters-btn" @click="clearFilters" />
        <q-btn no-caps round color="negative" icon="search" @click="fetchLogements" :loading="loading" />
      </div>
    </div>

    <div class="split-layout">
      <section class="list-side">
        <div class="list-head">
          <h5 class="q-my-none">{{ logements.length }} logements trouvés</h5>
          <span class="text-caption text-grey-7">Résultats sur la carte Google Maps</span>
        </div>

        <div v-if="displayedContext.message" class="search-context q-mb-md">
          <p class="context-message">{{ displayedContext.message }}</p>
          <p v-if="displayedContext.filtreVille" class="context-meta">
            Zone recherchée : {{ displayedContext.filtreVille }}
          </p>
          <p v-if="displayedContext.universite" class="context-meta">
            Université : {{ displayedContext.universite }}
          </p>
        </div>

        <div v-if="loading" class="list-loading">
          <q-spinner-dots size="36px" color="dark" />
        </div>

        <div v-else-if="logements.length === 0" class="list-empty">
          Aucun logement trouvé avec ces filtres.
        </div>

        <div v-else class="cards-grid">
          <router-link v-for="logement in logements" :key="logement.id" :to="`/logements/${logement.id}`"
            class="card-link">
            <article class="listing-card" :class="{ active: String(activeListingId) === String(logement.id) }"
              @mouseenter="activeListingId = logement.id">
              <div class="listing-media" :style="{ backgroundImage: `url('${getPrimaryImage(logement)}')` }">
                <span class="price-chip">{{ formatPrice(logement.prix) }}</span>
              </div>
              <div class="listing-body">
                <p class="listing-title">{{ capitalize(logement.type) }} · {{ logement.ville }}</p>
                <p class="listing-subtitle">{{ logement.adress }}</p>
                <p v-if="logement.match_universite" class="listing-badge">Adapté à votre université</p>
                <p class="listing-meta">{{ logement.nb_places || 1 }} place(s) · {{ logement.statut || 'disponible' }}
                </p>
              </div>
            </article>
          </router-link>
        </div>
      </section>

      <aside class="map-side">
        <GoogleMapCanvas api-key="AIzaSyD0yI8RiNp5uxgZD7OasrMrDCcKLaGq0hA" :markers="mapMarkers"
          :active-marker-id="activeListingId" :fit-to-markers="true" :max-auto-zoom="9" :center="mapCenter" :zoom="9"
          height="calc(100vh - 160px)" @marker-click="handleMarkerClick" />
      </aside>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import GoogleMapCanvas from '@/components/maps/GoogleMapCanvas.vue'
import { useAuthStore } from '@/stores/auth'
import { tunisianVilles } from '@/helpers/tunisiaCities'

const loading = ref(false)
const logements = ref([])
const activeListingId = ref(null)
const authStore = useAuthStore()
const searchContext = ref({
  filtreVille: null,
  universite: null,
  message: ''
})

const filters = ref({
  ville: null,
  universite: '',
  budget_max: null,
  type: null
})

const baseVilleOptions = tunisianVilles.map((ville) => ({
  label: ville,
  value: ville
}))

const villeOptions = ref(baseVilleOptions)

const typeOptions = [
  { label: 'Studio', value: 'studio' },
  { label: 'Appartement', value: 'appartement' },
  { label: 'Maison', value: 'maison' }
]

const mapMarkers = computed(() => {
  return logements.value
    .map((item) => ({
      id: item.id,
      lat: Number(item.latitude),
      lng: Number(item.longitude),
      title: `${capitalize(item.type)} · ${item.ville}`,
      priceLabel: `${Number(item.prix || 0)} DT`,
      info: buildMapCardHtml(item)
    }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
})

const mapCenter = computed(() => {
  if (mapMarkers.value.length > 0) {
    return { lat: mapMarkers.value[0].lat, lng: mapMarkers.value[0].lng }
  }
  return { lat: 36.8065, lng: 10.1815 }
})

const displayedContext = computed(() => {
  const selectedVille = filters.value.ville?.trim()
  const selectedUniversite = filters.value.universite?.trim()

  return {
    ...searchContext.value,
    filtreVille: selectedVille || searchContext.value.filtreVille,
    universite: selectedUniversite || searchContext.value.universite
  }
})

const hasActiveFilters = computed(() => {
  return Boolean(
    filters.value.ville ||
    filters.value.universite?.trim() ||
    filters.value.budget_max ||
    filters.value.type
  )
})

function filterVilleOptions(val, update) {
  update(() => {
    const needle = (val || '').trim().toLowerCase()
    if (!needle) {
      villeOptions.value = baseVilleOptions
      return
    }

    villeOptions.value = baseVilleOptions.filter((option) =>
      option.label.toLowerCase().includes(needle)
    )
  })
}

function clearFilters() {
  filters.value = {
    ville: null,
    universite: '',
    budget_max: null,
    type: null
  }
  fetchLogements()
}

function getPrimaryImage(logement) {
  try {
    const photos = typeof logement.photos === 'string' ? JSON.parse(logement.photos) : logement.photos
    if (Array.isArray(photos) && photos[0]) return photos[0]
  } catch {
    // noop
  }
  return 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
}

function escapeHtml(value) {
  return `${value || ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildMapCardHtml(logement) {
  const imageUrl = escapeHtml(getPrimaryImage(logement))
  const title = escapeHtml(`${capitalize(logement.type)} · ${logement.ville || ''}`)
  const address = escapeHtml(logement.adress || 'Adresse non renseignée')
  const status = escapeHtml(logement.statut || 'Disponible')
  const places = Number(logement.nb_places || 1)
  const price = Number(logement.prix || 0)

  return `
    <div style="width:280px;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 12px 30px rgba(15,23,42,.18);font-family:Inter,Segoe UI,Arial,sans-serif;">
      <div style="height:160px;background:#e5e7eb;">
        <img src="${imageUrl}" alt="Logement" style="width:100%;height:100%;object-fit:cover;display:block;" />
      </div>
      <div style="padding:12px 14px 14px;">
        <p style="margin:0 0 4px;font-size:20px;line-height:1.2;font-weight:700;color:#0f172a;">${title}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#475569;line-height:1.35;">${address}</p>
        <p style="margin:0 0 10px;font-size:12px;color:#0f766e;font-weight:700;">${places} place(s) · ${status}</p>
        <div style="display:flex;align-items:baseline;gap:6px;">
          <span style="font-size:22px;font-weight:800;color:#111827;">${price} DT</span>
          <span style="font-size:12px;color:#64748b;">/ mois</span>
        </div>
      </div>
    </div>
  `
}

function formatPrice(price) {
  const value = Number(price || 0)
  return `${value} DT / mois`
}

function capitalize(text) {
  if (!text) return 'Logement'
  return `${text}`.charAt(0).toUpperCase() + `${text}`.slice(1)
}

function handleMarkerClick(marker) {
  activeListingId.value = marker.id
}

async function fetchLogements() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.value.ville) params.append('ville', filters.value.ville)
    else params.append('all_villes', '1')
    if (filters.value.universite) params.append('universite', filters.value.universite)
    if (filters.value.budget_max) params.append('budget_max', String(filters.value.budget_max))
    if (filters.value.type) params.append('type', filters.value.type)

    const url = params.toString() ? `/api/logements?${params.toString()}` : '/api/logements'
    const response = await fetch(url, {
      headers: {
        ...authStore.authHeader
      }
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la recherche de logements.')
    }

    logements.value = Array.isArray(data.logements) ? data.logements : []
    searchContext.value = data.contexte || {
      filtreVille: null,
      universite: null,
      message: ''
    }
    activeListingId.value = logements.value[0]?.id || null
  } catch (err) {
    console.error(err)
    logements.value = []
    activeListingId.value = null
    searchContext.value = {
      filtreVille: null,
      universite: null,
      message: 'Impossible de charger les logements.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchLogements)
</script>

<style scoped>
.search-page {
  padding: 0;
  background: #f8f8f8;
}

.search-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #ffffff;
  border-bottom: 1px solid #ececec;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.top-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  font-weight: 600;
  background: #fff;
}

.top-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-input {
  min-width: 160px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 0 10px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.filter-input:focus-within {
  border-color: #94a3b8;
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
}

.reset-filters-btn {
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #fff;
}

.split-layout {
  display: grid;
  grid-template-columns: 52% 48%;
  min-height: calc(100vh - 74px);
}

.list-side {
  padding: 16px;
  overflow-y: auto;
}

.map-side {
  position: sticky;
  top: 74px;
  align-self: start;
  padding: 12px;
}

.list-head {
  margin-bottom: 12px;
}

.search-context {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 12px;
}

.context-message {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.context-meta {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: #64748b;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.card-link {
  text-decoration: none;
}

.listing-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.listing-card.active {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  border-color: #cbd5e1;
}

.listing-media {
  height: 172px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.price-chip {
  position: absolute;
  left: 10px;
  bottom: 10px;
  background: #ffffff;
  color: #111827;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.77rem;
  font-weight: 700;
}

.listing-body {
  padding: 10px;
}

.listing-title {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 700;
  color: #0f172a;
}

.listing-subtitle,
.listing-meta {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.84rem;
}

.listing-badge {
  margin: 6px 0 0;
  display: inline-flex;
  background: #ecfeff;
  color: #0f766e;
  border: 1px solid #99f6e4;
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 0.74rem;
  font-weight: 700;
}

.list-loading,
.list-empty {
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

@media (max-width: 1140px) {
  .split-layout {
    grid-template-columns: 1fr;
  }

  .map-side {
    position: relative;
    top: 0;
    order: -1;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .search-topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .top-filters {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
