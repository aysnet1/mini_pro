import { ref, computed } from 'vue'
import { useLogementsStore } from '@/stores/logements'

/**
 * Composable pour gérer la recherche et les filtres des logements
 * @returns {Object} État et méthodes pour la recherche/filtrage
 */
export function useLogementsFilters() {
  const logementsStore = useLogementsStore()

  // État de recherche
  const searchQuery = ref('')
  const filterType = ref(null)
  const filterStatut = ref(null)
  const filterPrixMin = ref(null)
  const filterPrixMax = ref(null)

  let searchTimeout = null

  // Options de filtres
  const typeFilterOptions = [
    { label: 'Studio', value: 'studio' },
    { label: 'Appartement', value: 'appartement' },
    { label: 'Maison', value: 'maison' },
    { label: 'Chambre', value: 'chambre' }
  ]

  const statutFilterOptions = [
    { label: 'Disponible', value: 'disponible' },
    { label: 'Indisponible', value: 'indisponible' },
    { label: 'Désactivé', value: 'desactive' }
  ]

  // Options avec placeholder "Tous"
  const typeFilterOptionsWithAll = [
    { label: 'Tous les types', value: '', disable: true },
    ...typeFilterOptions
  ]

  const statutFilterOptionsWithAll = [
    { label: 'Tous les statuts', value: '', disable: true },
    ...statutFilterOptions
  ]

  // Computed
  const hasActiveFilters = computed(() => {
    return searchQuery.value || filterType.value || filterStatut.value ||
      filterPrixMin.value || filterPrixMax.value
  })

  const pagination = computed(() => logementsStore.pagination)
  const hasMoreLogements = computed(() => logementsStore.pagination.hasMore)
  const loadingMore = computed(() => logementsStore.loading)

  /**
   * Applique les filtres actuels
   */
  function applyFilters() {
    const filters = {
      q: searchQuery.value || null,
      type: filterType.value || null,
      statut: filterStatut.value || null,
      prix_min: filterPrixMin.value || null,
      prix_max: filterPrixMax.value || null
    }

    // Reset pagination quand les filtres changent
    logementsStore.pagination.page = 1
    logementsStore.fetchMine(1, false, filters)
  }

  /**
   * Gestionnaire de changement de recherche (avec debounce)
   */
  function onSearchChange() {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      applyFilters()
    }, 300)
  }

  /**
   * Gestionnaire de changement de filtre
   */
  function onFilterChange() {
    applyFilters()
  }

  /**
   * Réinitialise tous les filtres
   */
  function resetFilters() {
    searchQuery.value = ''
    filterType.value = null
    filterStatut.value = null
    filterPrixMin.value = null
    filterPrixMax.value = null
    logementsStore.resetFilters()
    logementsStore.pagination.page = 1
    logementsStore.fetchMine(1, false, {})
  }

  /**
   * Charge plus de logements
   */
  async function loadMoreLogements() {
    await logementsStore.fetchMore()
  }

  // Cleanup
  function dispose() {
    clearTimeout(searchTimeout)
  }

  return {
    // État
    searchQuery,
    filterType,
    filterStatut,
    filterPrixMin,
    filterPrixMax,

    // Options
    typeFilterOptions,
    statutFilterOptions,
    typeFilterOptionsWithAll,
    statutFilterOptionsWithAll,

    // Computed
    hasActiveFilters,
    pagination,
    hasMoreLogements,
    loadingMore,

    // Méthodes
    applyFilters,
    onSearchChange,
    onFilterChange,
    resetFilters,
    loadMoreLogements,
    dispose
  }
}
