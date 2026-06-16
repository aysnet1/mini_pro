<template>
    <q-dialog v-model="localShow" position="bottom" :full-width="true">
        <q-card class="filter-dialog-card">
            <div class="sheet-handle" />

            <q-card-section class="sheet-header q-pa-none">
                <span class="sheet-title">Filtres de recherche</span>
                <q-btn flat round dense icon="close" color="grey-7" v-close-popup />
            </q-card-section>

            <q-separator />

            <q-card-section class="sheet-body q-pa-none">
                <!-- Recherche libre -->
                <div class="sheet-field-label">Recherche libre</div>
                <div class="sheet-search-bar">
                    <q-icon name="search" size="18px" color="grey-5" />
                    <input v-model="localFilters.q" type="text" placeholder="Type, ville, adresse…"
                        class="sheet-search-input" @keyup.enter="$emit('apply')" />
                    <button v-if="localFilters.q" class="sheet-clear" @click="localFilters.q = ''">✕</button>
                </div>

                <!-- Ville -->
                <div class="sheet-field-label">Ville</div>
                <q-select v-model="localFilters.ville" :options="villeOptions" dense outlined clearable emit-value
                    map-options use-input fill-input hide-selected input-debounce="0"
                    placeholder="Sélectionner une ville" class="sheet-field" @filter="filterVille" />

                <!-- Type -->
                <div class="sheet-field-label">Type de logement</div>
                <q-select v-model="localFilters.types" :options="typeOptions" dense outlined clearable emit-value
                    map-options multiple use-chips placeholder="Tous les types" class="sheet-field" />

                <!-- Budget -->
                <div class="sheet-field-label">Budget (DT / mois)</div>
                <div class="sheet-row">
                    <q-input v-model.number="localFilters.budget_min" dense outlined type="number" placeholder="Min"
                        class="sheet-field sheet-field--half" />
                    <q-input v-model.number="localFilters.budget_max" dense outlined type="number" placeholder="Max"
                        class="sheet-field sheet-field--half" />
                </div>

                <!-- Places -->
                <div class="sheet-field-label">Nombre de places minimum</div>
                <q-select v-model="localFilters.nb_places_min" :options="placesOptions" dense outlined clearable
                    emit-value map-options placeholder="Indifférent" class="sheet-field" />

                <!-- Université -->
                <div class="sheet-field-label">Université à proximité</div>
                <q-input v-model="localFilters.universite" dense outlined placeholder="Nom de l'université"
                    class="sheet-field" />
            </q-card-section>

            <q-separator />

            <q-card-actions class="sheet-footer">
                <q-btn no-caps flat color="grey-7" label="Réinitialiser" class="sheet-reset-btn"
                    @click="$emit('reset')" />
                <q-btn no-caps unelevated color="negative" label="Voir les résultats" class="sheet-apply-btn"
                    :loading="loading" @click="$emit('apply')" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    filters: {
        type: Object,
        required: true
    },
    villeOptions: {
        type: Array,
        required: true
    },
    typeOptions: {
        type: Array,
        required: true
    },
    placesOptions: {
        type: Array,
        required: true
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:show', 'update:filters', 'apply', 'reset', 'filter-ville'])

// Local state for show dialog
const localShow = ref(props.show)

watch(() => props.show, (newShow) => {
    localShow.value = newShow
})

watch(localShow, (newShow) => {
    emit('update:show', newShow)
})

// Local state for filters - deep copy to avoid mutating props
const localFilters = ref({ ...props.filters })

// Watch for prop changes and update local state
watch(() => props.filters, (newFilters) => {
    localFilters.value = { ...newFilters }
}, { deep: true })

// Watch for local changes and emit updates
watch(localFilters, (newFilters) => {
    emit('update:filters', { ...newFilters })
}, { deep: true })

function filterVille(val, update) {
    // Delegate to parent component for filtering
    emit('filter-ville', val, update)
}
</script>

<style scoped>
/* Styles will be inherited from parent */
</style>
