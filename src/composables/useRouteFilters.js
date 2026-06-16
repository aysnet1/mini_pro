import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buildQuery } from '@/utils/buildQuery'

/**
 * Composable for synchronizing filters with route query parameters
 * @param {Object} filters - Reactive filters ref
 * @param {Object} pagination - Reactive pagination ref
 * @returns {Object} Route sync methods
 */
export function useRouteFilters(filters, pagination) {
  const route = useRoute()
  const router = useRouter()

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

  function updateRouteQuery(resetPage = false) {
    if (resetPage) {
      pagination.value.page = 1
    }

    const query = {}
    if (filters.value.q) query.q = filters.value.q
    if (filters.value.ville) query.ville = filters.value.ville
    if (filters.value.types?.length) query.types = filters.value.types.join(',')
    if (filters.value.budget_min) query.budget_min = String(filters.value.budget_min)
    if (filters.value.budget_max) query.budget_max = String(filters.value.budget_max)
    if (filters.value.nb_places_min) query.nb_places_min = String(filters.value.nb_places_min)
    if (filters.value.universite) query.universite = filters.value.universite
    if (filters.value.adress) query.adress = filters.value.adress

    // Only add page param if not on page 1
    const currentPage = resetPage ? 1 : pagination.value.page
    if (currentPage > 1) query.page = String(currentPage)

    router.replace({ query })
  }

  function navigateToPage(page) {
    const query = { ...route.query, page: String(page) }
    if (page === 1) delete query.page // Remove page param if it's page 1
    router.push({ query })
  }

  // Watch for route changes
  watch(() => route.query, (newQuery, oldQuery) => {
    // Only fetch if query actually changed (not just updating route)
    if (JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
      applyRouteQuery()
    }
  }, { deep: true })

  // Watch for filter changes - update route but don't auto-fetch
  // The parent component should call fetchLogements() after updating filters
  watch(
    filters,
    () => {
      updateRouteQuery(true) // Reset page when filters change
    },
    { deep: true }
  )

  return {
    applyRouteQuery,
    updateRouteQuery,
    navigateToPage
  }
}
