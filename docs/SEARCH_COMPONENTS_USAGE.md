# Search Components - Quick Start Guide

## How to Use the Refactored Search Components

### Basic Usage in a Page

```vue
<template>
  <q-page class="search-page">
    <SearchTopbar
      :filters="filters"
      :ville-options="villeOptions"
      :type-options="typeOptions"
      :places-options="placesOptions"
      :has-filters="hasFilters"
      :active-tab="activeTab"
      @update:filters="filters = $event"
      @update:active-tab="activeTab = $event"
      @search="handleSearch"
      @reset="handleReset"
      @open-filters="showFilters = true"
    />

    <SearchResults
      :logements="logements"
      :loading="loading"
      :context="searchContext"
      :pagination="pagination"
      :visible-pages="visiblePages"
      @hover="activeId = $event"
      @change-page="handlePageChange"
    />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import SearchTopbar from '@/components/search/SearchTopbar.vue'
import SearchResults from '@/components/search/SearchResults.vue'
import { useLogementFilters, useLogementSearch, usePagination } from '@/composables'

// Initialize composables
const { filters, villeOptions, typeOptions, placesOptions, hasActiveFilters } = useLogementFilters()
const { loading, logements, searchContext, fetchLogements } = useLogementSearch(filters)
const { pagination, visiblePages } = usePagination()

const activeTab = ref('liste')
const showFilters = ref(false)

function handleSearch() {
  fetchLogements()
}

function handleReset() {
  // Reset logic
}

function handlePageChange(page) {
  // Navigate to page
}
</script>
```

## Using Composables

### Filter Management

```javascript
import { useLogementFilters } from '@/composables'

const {
  filters, // Reactive filter object
  villeOptions, // City options
  typeOptions, // Type options
  placesOptions, // Places options
  filterVilleOptions, // Filter cities function
  resetFilters, // Reset all filters
  hasActiveFilters, // Check if filters are active
} = useLogementFilters()

// Access filter values
console.log(filters.value.ville)
console.log(filters.value.types)

// Update filters
filters.value.ville = 'Tunis'
filters.value.types = ['studio', 's+1']

// Reset filters
resetFilters()
```

### Search API

```javascript
import { useLogementSearch } from '@/composables'

const {
  loading, // Loading state
  logements, // Results array
  searchContext, // Search context/message
  fetchLogements, // Fetch function
} = useLogementSearch(filters, pagination)

// Fetch results
await fetchLogements()

// Access results
console.log(logements.value)
console.log(loading.value)
```

### Pagination

```javascript
import { usePagination } from '@/composables'

const {
  pagination, // Pagination state
  visiblePages, // Smart page numbers
  resetPagination, // Reset to page 1
  canChangePage, // Validate page change
} = usePagination({ initialPage: 1, limit: 12 })

// Access pagination
console.log(pagination.value.page)
console.log(pagination.value.totalPages)

// Change page
pagination.value.page = 2

// Reset
resetPagination()
```

### Route Synchronization

```javascript
import { useRouteFilters } from '@/composables'

const {
  applyRouteQuery, // Read from URL
  updateRouteQuery, // Update URL
  navigateToPage, // Navigate with page param
} = useRouteFilters(filters, pagination)

// Apply route on mount
applyRouteQuery()

// Navigate to page 3
navigateToPage(3) // URL: /recherche?page=3

// Update URL with filters
updateRouteQuery()
```

### Map Markers

```javascript
import { useMapMarkers } from '@/composables'

const {
  mapMarkers, // Computed markers array
  mapCenter, // Computed center
  buildMapCardHtml, // HTML builder for info cards
} = useMapMarkers(logements)

// Access markers
console.log(mapMarkers.value)
// [{ id, lat, lng, title, priceLabel, info }, ...]
```

### Responsive Map

```javascript
import { useResponsiveMap } from '@/composables'

const {
  topbarHeight, // Reactive height
  activeTab, // 'liste' | 'carte'
  mobileMapHeight, // Computed height string
  observeTopbar, // Start observer
  cleanupObserver, // Cleanup
} = useResponsiveMap()

// Access tab state
console.log(activeTab.value)

// Get mobile map height
console.log(mobileMapHeight.value) // "calc(100vh - 80px)"
```

## Component Props & Events

### SearchTopbar

**Props:**

- `filters` (Object) - Filter state
- `villeOptions` (Array) - City options
- `typeOptions` (Array) - Type options
- `placesOptions` (Array) - Places options
- `hasFilters` (Boolean) - Has active filters
- `activeTab` (String) - Current tab

**Events:**

- `update:filters` - Filter changed
- `update:activeTab` - Tab changed
- `search` - Search triggered
- `reset` - Reset clicked
- `open-filters` - Open filters dialog

### SearchFiltersDialog

**Props:**

- `show` (Boolean) - Dialog visibility
- `filters` (Object) - Filter state
- `villeOptions` (Array) - City options
- `typeOptions` (Array) - Type options
- `placesOptions` (Array) - Places options
- `loading` (Boolean) - Loading state

**Events:**

- `update:show` - Visibility changed
- `update:filters` - Filter changed
- `apply` - Apply clicked
- `reset` - Reset clicked
- `filter-ville` - Filter cities

### SearchResults

**Props:**

- `logements` (Array) - Results array
- `loading` (Boolean) - Loading state
- `context` (Object) - Search context
- `pagination` (Object) - Pagination state
- `visiblePages` (Array) - Page numbers
- `activeId` (Number|String) - Active listing ID
- `hideOnMap` (Boolean) - Hide on map tab

**Events:**

- `hover` - Listing hovered
- `change-page` - Page changed

### ListingCard

**Props:**

- `logement` (Object) - Listing data
- `isActive` (Boolean) - Is active state

**Events:**

- `hover` - Card hovered

### PaginationBar

**Props:**

- `page` (Number) - Current page
- `totalPages` (Number) - Total pages
- `total` (Number) - Total results
- `hasPrev` (Boolean) - Has previous
- `hasNext` (Boolean) - Has next
- `visiblePages` (Array) - Page numbers

**Events:**

- `change-page` - Page selected

## Service Layer

### Using logementService

```javascript
import { logementService } from '@/services'

// Normalize data
const normalized = logementService.normalizeLogement(rawData)

// Fetch from API
const { logements, pagination, contexte } = await logementService.fetchLogementsApi(params)
```

## Utilities

### buildQuery

```javascript
import { buildQuery } from '@/utils'

const params = buildQuery(filters, pagination)
// Returns URLSearchParams
```

### escapeHtml

```javascript
import { escapeHtml } from '@/utils'

const safe = escapeHtml(userInput)
// Escapes &, <, >, ", '
```

### safeJsonParse

```javascript
import { safeJsonParse } from '@/utils'

const data = safeJsonParse(jsonString, [])
// Returns parsed JSON or fallback
```

## Complete Example

```vue
<template>
  <q-page>
    <SearchTopbar v-bind="topbarProps" @search="fetchLogements" @reset="handleReset" />

    <SearchResults v-bind="resultsProps" @change-page="handlePageChange" />
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import {
  useLogementFilters,
  useLogementSearch,
  usePagination,
  useRouteFilters,
} from '@/composables'
import SearchTopbar from '@/components/search/SearchTopbar.vue'
import SearchResults from '@/components/search/SearchResults.vue'

// Initialize
const filtersComposable = useLogementFilters()
const paginationComposable = usePagination()
const searchComposable = useLogementSearch(
  filtersComposable.filters,
  paginationComposable.pagination,
)
const routeComposable = useRouteFilters(filtersComposable.filters, paginationComposable.pagination)

// Computed props
const topbarProps = computed(() => ({
  filters: filtersComposable.filters,
  villeOptions: filtersComposable.villeOptions,
  typeOptions: filtersComposable.typeOptions,
  placesOptions: filtersComposable.placesOptions,
  hasFilters: filtersComposable.hasActiveFilters(),
  activeTab: 'liste',
}))

const resultsProps = computed(() => ({
  logements: searchComposable.logements,
  loading: searchComposable.loading,
  context: searchComposable.searchContext,
  pagination: paginationComposable.pagination,
  visiblePages: paginationComposable.visiblePages,
}))

// Methods
function handleReset() {
  filtersComposable.resetFilters()
  paginationComposable.resetPagination()
  searchComposable.fetchLogements()
}

function handlePageChange(page) {
  routeComposable.navigateToPage(page)
}

// Lifecycle
onMounted(() => {
  routeComposable.applyRouteQuery()
  searchComposable.fetchLogements()
})
</script>
```

## Tips & Best Practices

1. **Always use composables** - Don't recreate state management
2. **Keep components dumb** - Pass data via props, emit events
3. **Use service layer** - Don't call API directly in components
4. **Leverage route sync** - Let `useRouteFilters` handle URL
5. **Memoize with computed** - Use computed properties for derived state
6. **Clean up observers** - Use `onUnmounted` for cleanup
7. **Handle loading states** - Always show loading indicators
8. **Error handling** - Catch errors in service layer

## Common Patterns

### Reset All State

```javascript
function handleReset() {
  resetFilters()
  resetPagination()
  navigateToPage(1)
  fetchLogements()
}
```

### Page Navigation

```javascript
function handlePageChange(page) {
  navigateToPage(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
```

### Filter Change

```javascript
watch(
  filters,
  () => {
    resetPagination()
    updateRouteQuery()
    fetchLogements()
  },
  { deep: true },
)
```

## Troubleshooting

### Filters not updating

- Check if you're using `v-model` or `@update:filters`
- Ensure filters are reactive (ref)

### Pagination not working

- Verify pagination object is passed correctly
- Check `visiblePages` computed property

### Map not showing

- Ensure Google Maps API key is valid
- Check `activeTab` state

### Route not syncing

- Call `applyRouteQuery()` on mount
- Use `navigateToPage()` instead of direct pagination change

## Additional Resources

- [Vue 3 Composition API](https://vuejs.org/guide/reusability/composables.html)
- [Quasar Components](https://quasar.dev/vue-components/)
- [Tailwind CSS](https://tailwindcss.com/docs)
