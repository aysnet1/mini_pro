import { ref } from 'vue'
import { tunisianVilles } from '@/helpers/tunisiaCities'

/**
 * Composable for managing logement search filters
 * @returns {Object} Filters state and methods
 */
export function useLogementFilters() {
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

    function filterVilleOptions(val, update) {
        update(() => {
            const needle = (val || '').trim().toLowerCase()
            villeOptions.value = needle
                ? baseVilleOptions.filter(o => o.label.toLowerCase().includes(needle))
                : baseVilleOptions
        })
    }

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

    function hasActiveFilters() {
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
    }

    return {
        filters,
        villeOptions,
        typeOptions,
        placesOptions,
        filterVilleOptions,
        resetFilters,
        hasActiveFilters
    }
}
