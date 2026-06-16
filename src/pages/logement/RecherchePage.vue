<template>
  <q-page class="search-page">
    <div class="search-topbar">
      <!-- Row 1: search bar + actions -->
      <div class="topbar-row1">
        <div class="search-bar-wrap">
          <q-icon name="search" class="search-bar-icon" />
          <input v-model="filters.q" type="text" placeholder="Type, ville, adresse…" class="search-bar-input"
            @keyup.enter="fetchLogements" />
          <button v-if="filters.q" class="search-bar-clear" @click="filters.q = ''; fetchLogements()">✕</button>
        </div>
        <div class="topbar-actions">
          <q-btn v-if="hasActiveFilters" no-caps flat color="dark" icon="restart_alt" class="reset-filters-btn"
            @click="clearFilters" />
          <q-btn no-caps flat icon="tune" :label="hasActiveFilters ? 'Filtres ●' : 'Filtres'" class="filter-sheet-btn"
            :class="{ 'filter-sheet-btn--active': hasActiveFilters }" @click="showFilters = true" />

        </div>
      </div>

      <!-- Row 2: horizontal scrollable filters -->
      <div class="filters-scroll-row">
        <q-select v-model="filters.ville" :options="villeOptions" dense borderless clearable emit-value map-options
          use-input fill-input hide-selected input-debounce="0" placeholder="Ville" class="filter-chip"
          @filter="filterVilleOptions" />

        <q-select v-model="filters.types" :options="typeOptions" dense borderless clearable emit-value map-options
          multiple use-chips placeholder="Type" class="filter-chip filter-chip--wide" />

        <q-input v-model.number="filters.budget_min" dense borderless type="number" placeholder="Budget min"
          class="filter-chip filter-chip--num" />

        <q-input v-model.number="filters.budget_max" dense borderless type="number" placeholder="Budget max"
          class="filter-chip filter-chip--num" />

        <q-select v-model="filters.nb_places_min" :options="placesOptions" dense borderless clearable emit-value
          map-options placeholder="Places min" class="filter-chip" />

        <q-input v-model="filters.universite" dense borderless placeholder="Université"
          class="filter-chip filter-chip--wide" />
      </div>

      <!-- Mobile tab switcher (inside topbar so --topbar-h includes it) -->
      <q-tabs v-model="activeTab" class="mobile-tabs md:hidden!" dense no-caps align="justify" active-color="negative"
        indicator-color="negative">
        <q-tab name="liste" icon="list" label="Liste" />
        <q-tab name="carte" icon="map" label="Carte" />
      </q-tabs>
    </div>
    <q-dialog v-model="showFilters" position="bottom" :full-width="true">
      <q-card class="filter-dialog-card">
        <div class="sheet-handle" />

        <q-card-section class="sheet-header q-pa-none">
          <span class="sheet-title">Filtres de recherche</span>
          <q-btn flat round dense icon="close" color="grey-7" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="sheet-body q-pa-none">
          <!-- Recherche libre -->
          <div class="sheet-field-label">Recherche libre</div>
          <div class="sheet-search-bar">
            <q-icon name="search" size="18px" color="grey-5" />
            <input v-model="filters.q" type="text" placeholder="Type, ville, adresse…" class="sheet-search-input"
              @keyup.enter="applyFiltersFromSheet" />
            <button v-if="filters.q" class="sheet-clear" @click="filters.q = ''">✕</button>
          </div>

          <!-- Ville -->
          <div class="sheet-field-label">Ville</div>
          <q-select v-model="filters.ville" :options="villeOptions" dense outlined clearable emit-value map-options
            use-input fill-input hide-selected input-debounce="0" placeholder="Sélectionner une ville"
            class="sheet-field" @filter="filterVilleOptions" />

          <!-- Type -->
          <div class="sheet-field-label">Type de logement</div>
          <q-select v-model="filters.types" :options="typeOptions" dense outlined clearable emit-value map-options
            multiple use-chips placeholder="Tous les types" class="sheet-field" />

          <!-- Budget -->
          <div class="sheet-field-label">Budget (DT / mois)</div>
          <div class="sheet-row">
            <q-input v-model.number="filters.budget_min" dense outlined type="number" placeholder="Min"
              class="sheet-field sheet-field--half" />
            <q-input v-model.number="filters.budget_max" dense outlined type="number" placeholder="Max"
              class="sheet-field sheet-field--half" />
          </div>

          <!-- Places -->
          <div class="sheet-field-label">Nombre de places minimum</div>
          <q-select v-model="filters.nb_places_min" :options="placesOptions" dense outlined clearable emit-value
            map-options placeholder="Indifférent" class="sheet-field" />

          <!-- Université -->
          <div class="sheet-field-label">Université à proximité</div>
          <q-input v-model="filters.universite" dense outlined placeholder="Nom de l'université" class="sheet-field" />
        </q-card-section>

        <q-separator />

        <q-card-actions class="sheet-footer">
          <q-btn no-caps flat color="grey-7" label="Réinitialiser" class="sheet-reset-btn" @click="clearFiltersSheet" />
          <q-btn no-caps unelevated color="negative" label="Voir les résultats" class="sheet-apply-btn"
            :loading="loading" @click="applyFiltersFromSheet" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Mobile map panel: shown only when carte tab is active on mobile -->
    <div class="mobile-map-panel md:hidden!" v-show="activeTab === 'carte'">
      <GoogleMapCanvas api-key="AIzaSyD0yI8RiNp5uxgZD7OasrMrDCcKLaGq0hA" :markers="mapMarkers"
        :active-marker-id="activeListingId" :fit-to-markers="true" :max-auto-zoom="9" :center="mapCenter" :zoom="9"
        :height="mobileMapHeight" @marker-click="handleMarkerClick" />
    </div>

    <!-- Desktop split: list always visible, map always visible -->
    <div class="split-layout">
      <section class="list-side" :class="activeTab === 'carte' ? 'hidden! md:block!' : ''">
        <div class="list-head">
          <h5 class="q-my-none">
            {{ pagination.total }} logement{{ pagination.total !== 1 ? 's' : '' }} trouvé{{ pagination.total !== 1 ? 's'
              : '' }}
            <span v-if="pagination.totalPages > 1" class="text-caption text-grey-7">
              (page {{ pagination.page }}/{{ pagination.totalPages }})
            </span>
          </h5>
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
            class="block no-underline">
            <article
              class="listing-card group flex flex-col max-sm:flex-row bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-slate-300 max-sm:min-h-24 max-sm:hover:translate-y-0"
              :class="{ 'ring-2 ring-slate-300 shadow-lg -translate-y-0.5': String(activeListingId) === String(logement.id) }"
              @mouseenter="activeListingId = logement.id" @touchstart="activeListingId = logement.id">
              <!-- Media -->
              <div
                class="card-media relative h-40 max-sm:h-auto max-sm:w-28 max-sm:min-w-28 max-sm:shrink-0 bg-slate-100 bg-cover bg-center shrink-0 max-sm:rounded-none max-sm:rounded-l-2xl"
                :style="{ backgroundImage: `url('${getPrimaryImage(logement)}')` }">
                <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <span
                  class="absolute left-2.5 bottom-2.5 bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm max-sm:text-[0.65rem] max-sm:px-2 max-sm:py-0.5">
                  {{ formatPrice(logement.prix) }}
                </span>
                <span v-if="logement.match_universite"
                  class="absolute right-2.5 bottom-2.5 bg-teal-700 text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full">
                  🎓 Univ.
                </span>
              </div>

              <!-- Body -->
              <div class="flex flex-col gap-1 p-2.5 max-sm:justify-center max-sm:flex-1 max-sm:min-w-0">
                <p class="m-0 text-sm font-bold text-slate-900 truncate leading-snug max-sm:text-xs">
                  {{ capitalize(logement.type) }} · {{ logement.ville }}
                </p>
                <p class="m-0 text-xs text-slate-500 truncate max-sm:text-[0.72rem]">
                  {{ logement.adress }}
                </p>
                <div class="flex flex-wrap gap-1 mt-0.5">
                  <span v-if="logement.nb_places"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.68rem] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                    {{ logement.nb_places }} pl.
                  </span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.68rem] font-semibold border"
                    :class="logement.statut === 'disponible'
                      ? 'bg-cyan-50 text-teal-700 border-teal-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200'">
                    {{ logement.statut || 'dispo' }}
                  </span>
                </div>
                <div v-if="equipmentPreview(logement).length" class="equip-row flex flex-wrap gap-1 mt-0.5">
                  <span v-for="eq in equipmentPreview(logement)" :key="eq"
                    class="text-[0.65rem] text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">{{
                      eq }}</span>
                </div>
              </div>
            </article>
          </router-link>
        </div>

        <!-- Pagination Controls -->
        <div v-if="pagination.totalPages > 1" class="pagination-controls q-mt-lg">
          <div class="pagination-info">
            Page {{ pagination.page }} sur {{ pagination.totalPages }} ({{ pagination.total }} résultats)
          </div>
          <div class="pagination-buttons">
            <q-btn flat color="dark" icon="first_page" :disable="!pagination.hasPrev" @click="changePage(1)"
              class="pagination-btn" />
            <q-btn flat color="dark" icon="chevron_left" :disable="!pagination.hasPrev"
              @click="changePage(pagination.page - 1)" class="pagination-btn" />
            <div class="pagination-pages">
              <template v-for="pageNum in visiblePages" :key="pageNum">
                <q-btn v-if="pageNum === pagination.page" unelevated color="negative" :label="pageNum"
                  class="pagination-page pagination-page--active" />
                <q-btn v-else flat color="dark" :label="pageNum" @click="changePage(pageNum)" class="pagination-page" />
              </template>
            </div>
            <q-btn flat color="dark" icon="chevron_right" :disable="!pagination.hasNext"
              @click="changePage(pagination.page + 1)" class="pagination-btn" />
            <q-btn flat color="dark" icon="last_page" :disable="!pagination.hasNext"
              @click="changePage(pagination.totalPages)" class="pagination-btn" />
          </div>
        </div>
      </section>

      <!-- Desktop map: always visible on md+, hidden on mobile via Tailwind -->
      <aside class="map-side hidden! md:block!">
        <GoogleMapCanvas api-key="AIzaSyD0yI8RiNp5uxgZD7OasrMrDCcKLaGq0hA" :markers="mapMarkers"
          :active-marker-id="activeListingId" :fit-to-markers="true" :max-auto-zoom="9" :center="mapCenter" :zoom="9"
          height="calc(100vh - 160px)" @marker-click="handleMarkerClick" />
      </aside>
    </div>
  </q-page>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GoogleMapCanvas from '@/components/maps/GoogleMapCanvas.vue'
import { tunisianVilles } from '@/helpers/tunisiaCities'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const logements = ref([])
const pagination = ref({
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
})
const activeListingId = ref(null)
const searchContext = ref({ filtreVille: null, universite: null, message: '' })
const activeTab = ref('liste')
const showFilters = ref(false)
const topbarHeight = ref(80)

const mobileMapHeight = computed(() => `calc(100vh - ${topbarHeight.value}px)`)

const filters = ref({
  q: '',
  ville: null,
  types: [],
  budget_min: null,
  budget_max: null,
  nb_places_min: null,
  universite: '',
  adress: ''
})

const baseVilleOptions = tunisianVilles.map(v => ({ label: v, value: v }))
const villeOptions = ref(baseVilleOptions)

const typeOptions = [
  { label: 'Studio', value: 'studio' },
  { label: 'S+1', value: 's+1' },
  { label: 'S+2', value: 's+2' },
  { label: 'S+3', value: 's+3' },
  { label: 'S+4', value: 's+4' },
  { label: 'Chambre', value: 'chambre' },
  { label: 'Colocation', value: 'colocation' },
  { label: 'Appartement', value: 'appartement' },
  { label: 'Maison', value: 'maison' }
]

const placesOptions = [
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 }
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

const hasActiveFilters = computed(() =>
  Boolean(
    filters.value.q?.trim() ||
    filters.value.ville ||
    filters.value.types?.length ||
    filters.value.budget_min ||
    filters.value.budget_max ||
    filters.value.nb_places_min ||
    filters.value.universite?.trim() ||
    filters.value.adress?.trim()
  )
)

const visiblePages = computed(() => {
  const current = pagination.value.page
  const total = pagination.value.totalPages
  const delta = 2 // Number of pages to show on each side of current page

  const range = []
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }

  // Always include first page
  if (current - delta > 2) {
    range.unshift(1)
  }

  // Always include last page
  if (current + delta < total - 1) {
    range.push(total)
  }

  range.sort((a, b) => a - b)

  // Remove duplicates
  return [...new Set(range)]
})

function filterVilleOptions(val, update) {
  update(() => {
    const needle = (val || '').trim().toLowerCase()
    villeOptions.value = needle
      ? baseVilleOptions.filter(o => o.label.toLowerCase().includes(needle))
      : baseVilleOptions
  })
}

function clearFilters() {
  filters.value = { q: '', ville: null, types: [], budget_min: null, budget_max: null, nb_places_min: null, universite: '', adress: '' }
  router.replace({ query: {} })
  fetchLogements()
}

function clearFiltersSheet() {
  filters.value = { q: '', ville: null, types: [], budget_min: null, budget_max: null, nb_places_min: null, universite: '', adress: '' }
  router.replace({ query: {} })
}

function applyFiltersFromSheet() {
  showFilters.value = false
  fetchLogements()
}

function equipmentPreview(logement) {
  if (!Array.isArray(logement.equipemens)) return []
  return logement.equipemens.filter(Boolean).slice(0, 3)
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

    const q = filters.value.q?.trim()
    if (q) params.append('q', q)

    if (filters.value.ville) params.append('ville', filters.value.ville)
    else if (!q) params.append('all_villes', '1')

    if (filters.value.types?.length) params.append('types', filters.value.types.join(','))
    if (filters.value.budget_min) params.append('budget_min', String(filters.value.budget_min))
    if (filters.value.budget_max) params.append('budget_max', String(filters.value.budget_max))
    if (filters.value.nb_places_min) params.append('nb_places_min', String(filters.value.nb_places_min))
    if (filters.value.universite?.trim()) params.append('universite', filters.value.universite.trim())
    if (filters.value.adress?.trim()) params.append('adress', filters.value.adress.trim())

    // Add pagination params
    params.append('page', String(pagination.value.page))
    params.append('limit', String(pagination.value.limit))

    const response = await fetch(`/api/logements?${params.toString()}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Erreur lors de la recherche.')

    logements.value = Array.isArray(data.logements) ? data.logements : []
    if (data.pagination) {
      pagination.value = data.pagination
    }
    searchContext.value = data.contexte || { filtreVille: null, universite: null, message: '' }
    activeListingId.value = logements.value[0]?.id || null
  } catch (err) {
    console.error(err)
    logements.value = []
    activeListingId.value = null
    searchContext.value = { filtreVille: null, universite: null, message: 'Impossible de charger les logements.' }
  } finally {
    loading.value = false
  }
}

function changePage(page) {
  if (page < 1 || page > pagination.value.totalPages || page === pagination.value.page) return
  pagination.value.page = page

  // Update URL with new page
  const query = { ...route.query, page: String(page) }
  if (page === 1) delete query.page // Remove page param if it's page 1

  router.push({ query })
  // Scroll to top of list
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function applyRouteQuery() {
  const rq = route.query
  if (rq.q) filters.value.q = String(rq.q)
  if (rq.ville) filters.value.ville = String(rq.ville)
  if (rq.type) filters.value.types = [String(rq.type)]
  if (rq.types) filters.value.types = String(rq.types).split(',').map(t => t.trim()).filter(Boolean)
  if (rq.budget_min) filters.value.budget_min = Number(rq.budget_min)
  if (rq.budget_max) filters.value.budget_max = Number(rq.budget_max)
  if (rq.nb_places_min) filters.value.nb_places_min = Number(rq.nb_places_min)
  if (rq.universite) filters.value.universite = String(rq.universite)
  if (rq.adress) filters.value.adress = String(rq.adress)
  if (rq.page) pagination.value.page = Number(rq.page)
}

watch(() => route.query, () => {
  applyRouteQuery()
  fetchLogements()
}, { deep: true })

// Auto-fetch when filters change
watch(
  filters,
  () => {
    // Reset to first page when filters change
    pagination.value.page = 1

    // Update URL query params without triggering another fetch
    const query = {}
    if (filters.value.q) query.q = filters.value.q
    if (filters.value.ville) query.ville = filters.value.ville
    if (filters.value.types?.length) query.types = filters.value.types.join(',')
    if (filters.value.budget_min) query.budget_min = String(filters.value.budget_min)
    if (filters.value.budget_max) query.budget_max = String(filters.value.budget_max)
    if (filters.value.nb_places_min) query.nb_places_min = String(filters.value.nb_places_min)
    if (filters.value.universite) query.universite = filters.value.universite
    if (filters.value.adress) query.adress = filters.value.adress
    if (pagination.value.page > 1) query.page = String(pagination.value.page)

    router.replace({ query })
    fetchLogements()
  },
  { deep: true }
)

let topbarObserver = null

onMounted(() => {
  applyRouteQuery()
  fetchLogements()
  nextTick(() => {
    const topbar = document.querySelector('.search-topbar')
    if (topbar) {
      topbarHeight.value = topbar.offsetHeight
      document.documentElement.style.setProperty('--topbar-h', `${topbar.offsetHeight}px`)
      topbarObserver = new ResizeObserver(() => {
        topbarHeight.value = topbar.offsetHeight
        document.documentElement.style.setProperty('--topbar-h', `${topbar.offsetHeight}px`)
      })
      topbarObserver.observe(topbar)
    }
  })
})

onUnmounted(() => {
  topbarObserver?.disconnect()
})
</script>
