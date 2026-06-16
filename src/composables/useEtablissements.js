import { ref } from 'vue'
import { useQuasar } from 'quasar'

/**
 * Composable pour charger et gérer les établissements d'enseignement
 * @returns {Object} Methods and state for etablissements
 */
export function useEtablissements() {
  const $q = useQuasar()
  const etablissements = ref([])
  const loading = ref(false)
  const error = ref(null)
  const searchQuery = ref('')

  /**
   * Recherche les établissements avec un terme de recherche (LIVE SEARCH)
   * @param {string} query - Terme de recherche (min 2 caractères)
   * @returns {Promise<Array>} Liste des établissements filtrés
   */
  async function searchEtablissements(query) {
    if (!query || query.length < 2) {
      etablissements.value = []
      return []
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetch(`/api/admin/etablissements?search=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche des établissements')
      }

      const data = await response.json()
      etablissements.value = data
      searchQuery.value = query

      return data
    } catch (err) {
      error.value = err.message
      console.error('Erreur searchEtablissements:', err)
      etablissements.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Charge tous les établissements depuis l'API (pour usage limité)
   * @param {boolean} showLoading - Afficher un loader Quasar
   * @returns {Promise<Array>} Liste des établissements
   */
  async function fetchAllEtablissements(showLoading = false) {
    loading.value = true
    error.value = null

    let loadingDialog
    if (showLoading) {
      loadingDialog = $q.loading.show({
        message: 'Chargement des établissements...',
        spinnerColor: 'dark'
      })
    }

    try {
      const response = await fetch('/api/admin/etablissements', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des établissements')
      }

      const data = await response.json()
      etablissements.value = data

      if (showLoading && loadingDialog) {
        loadingDialog()
      }

      return data
    } catch (err) {
      error.value = err.message
      console.error('Erreur fetchAllEtablissements:', err)

      if (showLoading && loadingDialog) {
        loadingDialog()
      }

      $q.notify({
        type: 'negative',
        message: 'Impossible de charger les établissements',
        icon: 'error'
      })

      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Formate les établissements pour un usage dans q-select
   * @returns {Array} Format: [{ label: 'Nom', value: id, ... }]
   */
  function getEtablissementsOptions() {
    return etablissements.value.map(etab => ({
      label: etab.label_fr,
      value: etab.id,
      etablissement_code: etab.etablissement_code,
      university_code: etab.university_code,
      type: etab.type,
      gouvernorat: etab.gouvernorat
    }))
  }

  /**
   * Trouve un établissement par son ID
   * @param {number} id - ID de l'établissement
   * @returns {Object|null} Établissement trouvé ou null
   */
  function getEtablissementById(id) {
    return etablissements.value.find(etab => etab.id === id) || null
  }

  /**
   * Trouve un établissement par son code
   * @param {string} code - Code de l'établissement
   * @returns {Object|null} Établissement trouvé ou null
   */
  function getEtablissementByCode(code) {
    return etablissements.value.find(etab => etab.etablissement_code === code) || null
  }

  /**
   * Filtre les établissements par gouvernorat
   * @param {string} gouvernorat - Gouvernorat à filtrer
   * @returns {Array} Établissements filtrés
   */
  function filterByGouvernorat(gouvernorat) {
    return etablissements.value.filter(etab => etab.gouvernorat === gouvernorat)
  }

  /**
   * Filtre les établissements par type
   * @param {string} type - Type à filtrer (ex: 'université', 'institut')
   * @returns {Array} Établissements filtrés
   */
  function filterByType(type) {
    return etablissements.value.filter(etab => etab.type === type)
  }

  return {
    etablissements,
    loading,
    error,
    searchQuery,
    searchEtablissements,
    fetchAllEtablissements,
    getEtablissementsOptions,
    getEtablissementById,
    getEtablissementByCode,
    filterByGouvernorat,
    filterByType
  }
}
