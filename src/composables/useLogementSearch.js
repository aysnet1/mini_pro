import { ref } from 'vue'
import { logementService } from '@/services/logement.service'
import { buildQuery } from '@/utils/buildQuery'

/**
 * Composable for managing logement search API calls and state
 * @param {Object} filters - Reactive filters ref
 * @param {Object} pagination - Reactive pagination ref
 * @param {Function} updatePagination - Function to update pagination state
 * @returns {Object} Search state and methods
 */
export function useLogementSearch(filters, pagination, updatePagination) {
    const loading = ref(false)
    const logements = ref([])
    const searchContext = ref({ filtreVille: null, universite: null, message: '' })

    async function fetchLogements() {
        loading.value = true
        try {
            const params = buildQuery(filters.value, pagination.value)
            console.log('🔍 Fetching with params:', params.toString())
            const result = await logementService.fetchLogementsApi(params)

            console.log('📦 Received result:', {
                logementsCount: result.logements.length,
                pagination: result.pagination
            })

            logements.value = result.logements
            if (result.pagination) {
                console.log('✅ Updating pagination:', result.pagination)
                updatePagination(result.pagination)
            }
            searchContext.value = result.contexte
        } catch (err) {
            console.error('Error fetching logements:', err)
            logements.value = []
            searchContext.value = {
                filtreVille: null,
                universite: null,
                message: 'Impossible de charger les logements.'
            }
        } finally {
            loading.value = false
        }
    }

    function clearLogements() {
        logements.value = []
        searchContext.value = { filtreVille: null, universite: null, message: '' }
    }

    return {
        loading,
        logements,
        searchContext,
        fetchLogements,
        clearLogements
    }
}
