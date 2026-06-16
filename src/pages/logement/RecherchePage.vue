<template>
  <q-page class="search-page">
    <!-- Topbar with filters -->
    <SearchTopbar :filters="filters" :ville-options="villeOptions" :type-options="typeOptions"
      :places-options="placesOptions" :has-filters="hasActiveFilters" :active-tab="activeTab"
      @update:filters="updateFilters" @update:active-tab="activeTab = $event" @search="handleSearch"
      @reset="handleReset" @open-filters="showFilters = true" />

    <!-- Filters dialog for mobile -->
    <SearchFiltersDialog v-model:show="showFilters" :filters="filters" :ville-options="villeOptions"
      :type-options="typeOptions" :places-options="placesOptions" :loading="loading" @update:filters="updateFilters"
      @apply="handleApplyFilters" @reset="handleReset" @filter-ville="filterVilleOptions" />

    <!-- Mobile map panel -->
    <div class="mobile-map-panel md:hidden!" v-show="activeTab === 'carte' && mapMarkers.length > 0">
      <GoogleMapCanvas api-key="AIzaSyD0yI8RiNp5uxgZD7OasrMrDCcKLaGq0hA" :markers="mapMarkers"
        :active-marker-id="activeListingId" :fit-to-markers="true" :max-auto-zoom="9" :center="mapCenter" :zoom="9"
        :height="mobileMapHeight" @marker-click="handleMarkerClick" />
    </div>

    <!-- Desktop split layout -->
    <div class="split-layout">
      <!-- Results section -->
      <SearchResults :logements="logements" :loading="loading" :context="displayedContext" :pagination="pagination"
        :visible-pages="visiblePages" :active-id="activeListingId" :hide-on-map="activeTab === 'carte'"
        @hover="activeListingId = $event" @change-page="handlePageChange" />

      <!-- Map section (desktop) -->
      <aside class="map-side hidden! md:block!" v-if="mapMarkers.length > 0">
        <GoogleMapCanvas api-key="AIzaSyD0yI8RiNp5uxgZD7OasrMrDCcKLaGq0hA" :markers="mapMarkers"
          :active-marker-id="activeListingId" :fit-to-markers="true" :max-auto-zoom="9" :center="mapCenter" :zoom="9"
          height="calc(100vh - 160px)" @marker-click="handleMarkerClick" />
      </aside>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import GoogleMapCanvas from '@/components/maps/GoogleMapCanvas.vue'
import SearchTopbar from '@/components/search/SearchTopbar.vue'
import SearchFiltersDialog from '@/components/search/SearchFiltersDialog.vue'
import SearchResults from '@/components/search/SearchResults.vue'
import { useLogementStore } from '@/stores/logement'
import { useMapMarkers } from '@/composables/useMapMarkers'
import { useResponsiveMap } from '@/composables/useResponsiveMap'
import { tunisianVilles } from '@/helpers/tunisiaCities'

// Use Pinia store
const logementStore = useLogementStore()
const route = useRoute()
const router = useRouter()

// Destructure store state and actions
const {
  loading,
  logements,
  searchContext,
  filters,
  pagination,
  hasActiveFilters,
  visiblePages
} = storeToRefs(logementStore)

const {
  fetchLogements,
  search,
  changePage,
  resetAll
} = logementStore

// Local state
const showFilters = ref(false)
const activeListingId = ref(null)
const isInitializing = ref(true)

// Ville options for filters
const villeOptions = tunisianVilles.map(v => ({ label: v, value: v }))

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

// Map and responsive
const { mapMarkers, mapCenter } = useMapMarkers(logements)
const { activeTab, mobileMapHeight } = useResponsiveMap()

// Computed
const displayedContext = computed(() => {
  const selectedVille = filters.value.ville?.trim()
  const selectedUniversite = filters.value.universite?.trim()

  return {
    ...searchContext.value,
    filtreVille: selectedVille || searchContext.value.filtreVille,
    universite: selectedUniversite || searchContext.value.universite
  }
})

// Methods
function updateFilters(newFilters) {
  // Update filters in store
  Object.keys(newFilters).forEach(key => {
    filters.value[key] = newFilters[key]
  })
  // Reset page and update URL
  pagination.value.page = 1
  updateRouteQuery()
  // Fetch results
  fetchLogements()
}

function handleSearch() {
  updateRouteQuery()
  search()
}

function handleReset() {
  resetAll()
  updateRouteQuery(true)
}

function handleApplyFilters() {
  showFilters.value = false
  updateRouteQuery()
  search()
}

function handlePageChange(page) {
  changePage(page).then(() => {
    updateRouteQuery()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

function handleMarkerClick(marker) {
  activeListingId.value = marker?.id || null
}

function filterVilleOptions(val, update) {
  update(() => {
    const needle = (val || '').trim().toLowerCase()
    villeOptions.value = needle
      ? villeOptions.filter(o => o.label.toLowerCase().includes(needle))
      : villeOptions
  })
}

// Route query synchronization
function updateRouteQuery(reset = false) {
  const query = {}

  if (filters.value.q) query.q = filters.value.q
  if (filters.value.ville) query.ville = filters.value.ville
  if (filters.value.types?.length) query.types = filters.value.types.join(',')
  if (filters.value.budget_min) query.budget_min = String(filters.value.budget_min)
  if (filters.value.budget_max) query.budget_max = String(filters.value.budget_max)
  if (filters.value.nb_places_min) query.nb_places_min = String(filters.value.nb_places_min)
  if (filters.value.universite) query.universite = filters.value.universite
  if (filters.value.adress) query.adress = filters.value.adress

  const currentPage = reset ? 1 : pagination.value.page
  if (currentPage > 1) query.page = String(currentPage)

  router.replace({ query })
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

// Watch for route changes and apply query params
watch(
  () => route.query,
  (newQuery, oldQuery) => {
    // Skip on initial load - handled by onMounted
    if (isInitializing.value) return

    // Only apply if query actually changed
    if (JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
      console.log('🔄 Route query changed, applying to filters...')
      applyRouteQuery()
      // Fetch with new filters from URL
      fetchLogements()
    }
  },
  { deep: true }
)

// Lifecycle
onMounted(() => {
  // Apply route query params on mount
  applyRouteQuery()
  // Then fetch logements
  fetchLogements().finally(() => {
    isInitializing.value = false
  })
})
</script>

<style scoped>
/* Import all styles from the original file */
</style>
