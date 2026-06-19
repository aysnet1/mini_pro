import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { logementService } from '@/services/logement.service'
import { buildQuery } from '@/utils/buildQuery'


export const useLogementStore = defineStore('logement', () => {
  // State
  const loading = ref(false)
  const error = ref(null)
  const logements = ref([])
  const searchContext = ref({ filtreVille: null, universite: null, message: '' })

  // Filters state
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

  // Pagination state
  const pagination = ref({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Getters
  const hasActiveFilters = computed(() => {
    return Boolean(
      filters.value.q?.trim() ||
      filters.value.ville ||
      filters.value.types?.length ||
      filters.value.budget_min ||
      filters.value.budget_max ||
      filters.value.nb_places_min ||
      filters.value.universite?.trim() ||
      filters.value.adress?.trim()
    )
  })

  const hasResults = computed(() => logements.value.length > 0)

  const isEmptyState = computed(() => {
    return !loading.value && !error.value && logements.value.length === 0
  })

  const visiblePages = ref([])

  watch(
    () => ({ page: pagination.value.page, totalPages: pagination.value.totalPages }),
    ({ page, totalPages }) => {
      if (totalPages <= 1) {
        visiblePages.value = []
        return
      }

      const delta = 2
      const range = []


      for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
        range.push(i)
      }

      range.sort((a, b) => a - b)
      visiblePages.value = [...new Set(range)]
    },
    { immediate: true }
  )

  // Actions
  function resetFilters() {
    filters.value = {
      q: '',
      ville: null,
      types: [],
      budget_min: null,
      budget_max: null,
      nb_places_min: null,
      universite: '',
      adress: ''
    }
  }

  function resetPagination() {
    pagination.value.page = 1
  }

  function updateFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function updatePagination(newPagination) {
    if (newPagination) {
      // Update individual properties to maintain reactivity
      pagination.value.page = newPagination.page ?? pagination.value.page
      pagination.value.limit = newPagination.limit ?? pagination.value.limit
      pagination.value.total = newPagination.total ?? pagination.value.total
      pagination.value.totalPages = newPagination.totalPages ?? pagination.value.totalPages
      pagination.value.hasNext = newPagination.hasNext ?? pagination.value.hasNext
      pagination.value.hasPrev = newPagination.hasPrev ?? pagination.value.hasPrev
    }
  }

  function clearError() {
    error.value = null
  }

  function setError(message) {
    error.value = message
  }

  async function fetchLogements() {
    loading.value = true
    error.value = null

    try {
      const params = buildQuery(filters.value, pagination.value)
      const result = await logementService.fetchLogementsApi(params)

      logements.value = result.logements
      if (result.pagination) {
        updatePagination(result.pagination)
      }
      searchContext.value = result.contexte

      return result
    } catch (err) {
      console.error('Error fetching logements:', err)
      setError(err.message || 'Erreur lors de la recherche des logements')
      logements.value = []
      searchContext.value = {
        filtreVille: null,
        universite: null,
        message: 'Impossible de charger les logements.'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  async function search(resetPage = false) {
    if (resetPage) {
      resetPagination()
    }
    return await fetchLogements()
  }

  async function changePage(page) {
    if (page < 1 || page > pagination.value.totalPages) {
      return
    }

    pagination.value.page = page
    return await fetchLogements()
  }
  async function applyFilters(newFilters, resetPage = true) {
    updateFilters(newFilters)
    return await search(resetPage)
  }

  async function resetAll() {
    resetFilters()
    resetPagination()
    clearError()
    return await fetchLogements()
  }

  function setFilter(key, value) {
    filters.value[key] = value
  }

  return {
    // State
    loading,
    error,
    logements,
    searchContext,
    filters,
    pagination,

    // Getters
    hasActiveFilters,
    hasResults,
    isEmptyState,
    visiblePages,

    // Actions
    resetFilters,
    resetPagination,
    updateFilters,
    updatePagination,
    clearError,
    setError,
    fetchLogements,
    search,
    changePage,
    applyFilters,
    resetAll,
    setFilter
  }
})
