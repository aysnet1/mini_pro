# Logement Pinia Store

## Overview

The `useLogementStore` Pinia store centralizes all logement search state management, replacing the previous composable-based approach.

## Migration from Composables

### Before (Composables)

```vue
<script setup>
import { useLogementFilters } from '@/composables/useLogementFilters'
import { useLogementSearch } from '@/composables/useLogementSearch'
import { usePagination } from '@/composables/usePagination'

const { filters, villeOptions, hasActiveFilters } = useLogementFilters()
const { pagination, visiblePages } = usePagination({ initialPage: 1, limit: 12 })
const { loading, logements, fetchLogements } = useLogementSearch(filters, pagination)
</script>
```

### After (Pinia Store)

```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useLogementStore } from '@/stores/logement'

const logementStore = useLogementStore()

// Destructure state (reactive with storeToRefs)
const { loading, logements, filters, pagination, hasActiveFilters, visiblePages } =
  storeToRefs(logementStore)

// Destructure actions
const { fetchLogements, search, changePage, applyFilters, resetAll } = logementStore
</script>
```

## Store Structure

### State

```javascript
{
  // Search state
  loading: boolean,
  error: string | null,
  logements: Array,
  searchContext: { filtreVille, universite, message },

  // Filters
  filters: {
    q: string,
    ville: string | null,
    types: Array,
    budget_min: number | null,
    budget_max: number | null,
    nb_places_min: number | null,
    universite: string,
    adress: string
  },

  // Pagination
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  }
}
```

### Getters (Computed)

- `hasActiveFilters` - Boolean indicating if any filters are active
- `hasResults` - Boolean indicating if there are search results
- `isEmptyState` - Boolean indicating if there's no data and no loading/error
- `visiblePages` - Array of page numbers to display in pagination

### Actions

#### Filter Management

- `resetFilters()` - Reset all filters to default
- `updateFilters(newFilters)` - Partial update of filters
- `setFilter(key, value)` - Set a single filter value
- `applyFilters(newFilters, resetPage)` - Apply filters and optionally reset page

#### Pagination

- `resetPagination()` - Reset to page 1
- `updatePagination(newPagination)` - Update pagination state from API
- `changePage(page)` - Change page and fetch results

#### Search

- `fetchLogements()` - Fetch results with current filters/pagination
- `search(resetPage)` - Search with optional page reset
- `resetAll()` - Reset everything and fetch

#### Error Handling

- `clearError()` - Clear error state
- `setError(message)` - Set error message

## Usage Example

### Basic Search Page

```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useLogementStore } from '@/stores/logement'

const logementStore = useLogementStore()
const { loading, logements, filters, pagination, hasActiveFilters } = storeToRefs(logementStore)
const { fetchLogements, changePage, applyFilters, resetAll } = logementStore

// Fetch on mount
onMounted(() => {
  fetchLogements()
})

// Handle filter changes
function onFilterChange(newFilters) {
  applyFilters(newFilters, true) // Reset to page 1
}

// Handle page change
function onPageChange(page) {
  changePage(page)
}
</script>

<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="!hasResults">No results</div>
    <div v-else>
      <div v-for="logement in logements" :key="logement.id">
        {{ logement.type }} - {{ logement.ville }}
      </div>

      <PaginationBar
        :page="pagination.page"
        :total-pages="pagination.totalPages"
        @change-page="changePage"
      />
    </div>
  </div>
</template>
```

### Accessing Store in Multiple Components

```vue
<!-- Component A -->
<script setup>
import { useLogementStore } from '@/stores/logement'
const store = useLogementStore()
</script>

<!-- Component B -->
<script setup>
import { useLogementStore } from '@/stores/logement'
const store = useLogementStore()
</script>

<!-- Both components share the same state! -->
```

### Watching State Changes

```vue
<script setup>
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useLogementStore } from '@/stores/logement'

const store = useLogementStore()
const { filters, pagination } = storeToRefs(store)

// Watch filters
watch(
  filters,
  (newFilters) => {
    console.log('Filters changed:', newFilters)
    store.search(true)
  },
  { deep: true },
)

// Watch pagination
watch(
  () => pagination.value.page,
  (newPage) => {
    console.log('Page changed to:', newPage)
  },
)
</script>
```

## Benefits

### ✅ Centralized State

- Single source of truth for all logement search state
- Easy to share state across components
- Predictable state management

### ✅ DevTools Integration

- Time-travel debugging
- State inspection
- Action tracking

### ✅ Reactivity

- Full reactivity with `storeToRefs`
- Automatic updates across components
- Computed properties (getters)

### ✅ Testability

- Easy to mock store in tests
- Isolated business logic
- Predictable actions

### ✅ TypeScript Ready

- Full type inference support
- Type-safe actions and state

## Deprecation Notice

The following composables are now **deprecated** in favor of the Pinia store:

- `useLogementFilters` - Use `store.filters` and `store.updateFilters`
- `useLogementSearch` - Use `store.fetchLogements` and `store.search`
- `usePagination` - Use `store.pagination` and `store.changePage`
- `useRouteFilters` - Implement route sync in component or create dedicated composable

Existing code using composables will continue to work, but new code should use the Pinia store.

## Migration Guide

1. Import the store: `import { useLogementStore } from '@/stores/logement'`
2. Get store instance: `const store = useLogementStore()`
3. Extract reactive state: `const { filters, pagination } = storeToRefs(store)`
4. Use actions directly: `store.fetchLogements()`
5. Remove old composable imports

## File Structure

```
src/
├── stores/
│   └── logement.js          # Pinia store (NEW)
├── composables/
│   ├── useLogementFilters.js # ⚠️ Deprecated
│   ├── useLogementSearch.js  # ⚠️ Deprecated
│   ├── usePagination.js      # ⚠️ Deprecated
│   └── useRouteFilters.js    # ⚠️ Deprecated
└── pages/
    └── logement/
        └── SearchPage.vue    # Updated to use store
```
