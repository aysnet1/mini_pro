import { onBeforeUnmount, ref, watch } from 'vue'
import { tunisianVilles } from '@/helpers/tunisiaCities'

export function useAddressGeocoding(form) {
    const filteredVilleOptions = ref([...tunisianVilles])
    const filteredAdressOptions = ref([])
    const geocodeLoading = ref(false)
    const adressSuggestLoading = ref(false)
    const geocodeError = ref('')
    let geocodeDebounce = null

    function normalizeText(value) {
        return (value || '')
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
    }

    function filterVilles(val, update) {
        update(() => {
            if (!val) {
                filteredVilleOptions.value = [...tunisianVilles]
                return
            }
            const needle = normalizeText(val)
            filteredVilleOptions.value = tunisianVilles.filter((ville) => normalizeText(ville).includes(needle))
        })
    }

    async function fetchAdressSuggestions(input) {
        const ville = form.value.ville?.trim()
        const base = (input || '').trim()
        if (base.length < 3) return []

        const query = ville ? `${base}, ${ville}, Tunisie` : `${base}, Tunisie`
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=tn&addressdetails=1&q=${encodeURIComponent(query)}`,
            { headers: { 'Accept-Language': 'fr' } }
        )

        if (!response.ok) {
            throw new Error('Service de suggestion indisponible.')
        }

        const rows = await response.json()
        if (!Array.isArray(rows)) return []

        const suggestions = rows
            .map((item) => {
                const label = item.display_name || ''
                if (!label) return null
                return label.split(', Tunisie')[0] || label
            })
            .filter((value) => !!value)

        return [...new Set(suggestions)].slice(0, 6)
    }

    function filterAdresses(val, update) {
        update(async () => {
            const input = (val || '').trim()
            if (input.length < 3) {
                filteredAdressOptions.value = []
                return
            }

            adressSuggestLoading.value = true
            try {
                filteredAdressOptions.value = await fetchAdressSuggestions(input)
            } catch {
                filteredAdressOptions.value = []
            } finally {
                adressSuggestLoading.value = false
            }
        })
    }

    async function geocodeFromAdresseVille() {
        const ville = form.value.ville?.trim()
        const adress = form.value.adress?.trim()

        if (!ville) {
            geocodeError.value = ''
            return
        }

        geocodeLoading.value = true
        geocodeError.value = ''

        try {
            const query = adress ? `${adress}, ${ville}, Tunisie` : `${ville}, Tunisie`
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=tn&q=${encodeURIComponent(query)}`,
                { headers: { 'Accept-Language': 'fr' } }
            )

            if (!response.ok) {
                throw new Error('Service de géolocalisation indisponible.')
            }

            const results = await response.json()
            if (!Array.isArray(results) || results.length === 0) {
                if (adress) {
                    geocodeError.value = 'Adresse introuvable pour cette ville.'
                }
                return
            }

            const first = results[0]
            const lat = Number(first.lat)
            const lng = Number(first.lon)

            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                form.value.latitude = lat
                form.value.longitude = lng
                geocodeError.value = ''
            }
        } catch (err) {
            geocodeError.value = err.message || 'Impossible de récupérer la position.'
        } finally {
            geocodeLoading.value = false
        }
    }

    watch(
        () => [form.value.adress, form.value.ville],
        ([adress, ville], [prevAdress, prevVille] = []) => {
            if (adress === prevAdress && ville === prevVille) return
            if (geocodeDebounce) {
                clearTimeout(geocodeDebounce)
            }

            if (!ville) {
                geocodeError.value = ''
                return
            }

            geocodeDebounce = setTimeout(() => {
                geocodeFromAdresseVille()
            }, 550)
        }
    )

    watch(
        () => form.value.ville,
        () => {
            filteredAdressOptions.value = []
        }
    )

    onBeforeUnmount(() => {
        if (geocodeDebounce) {
            clearTimeout(geocodeDebounce)
        }
    })

    return {
        filteredVilleOptions,
        filteredAdressOptions,
        geocodeLoading,
        adressSuggestLoading,
        geocodeError,
        filterVilles,
        filterAdresses,
    }
}
