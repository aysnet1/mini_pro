<template>
  <q-page class="search-page">
    <!-- Topbar with filters -->
    <SearchTopbar :filters="filters" :ville-options="villeOptions" :type-options="typeOptions"
      :places-options="placesOptions" :has-filters="hasActiveFilters()" :active-tab="activeTab"
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
  applyFilters, 
  resetAll
} = logementStore

// Local state
const showFilters = ref(false)
const activeListingId = ref(null)

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
  applyFilters(newFilters, true) // Apply filters and reset page
}

function handleSearch() {
  search()
}

function handleReset() {
  resetAll()
}

function handleApplyFilters() {
  showFilters.value = false
  search()
}

function handlePageChange(page) {
  changePage(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
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

// Watch for filter changes and trigger search
watch(
  filters,
  (newFilters, oldFilters) => {
    // Only trigger search if filters actually changed (not on initial load)
    if (oldFilters && JSON.stringify(newFilters) !== JSON.stringify(oldFilters)) {
      console.log('🔄 Filters changed in store, fetching...')
      applyFilters(newFilters, true) // Apply filters and reset page
    }
  },
  { deep: true }
)

// Lifecycle
onMounted(() => {
  fetchLogements()
})
</script>

<style scoped>
/* Import all styles from the original file */
</style>
