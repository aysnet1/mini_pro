<template>
  <div class="search-topbar">
    <!-- Row 1: search bar + actions -->
    <div class="topbar-row1">
      <div class="search-bar-wrap">
        <q-icon name="search" class="search-bar-icon" />
        <input v-model="localFilters.q" type="text" placeholder="Type, ville, adresse…" class="search-bar-input"
          @keyup.enter="$emit('search')" />
        <button v-if="localFilters.q" class="search-bar-clear" @click="clearQuery">✕</button>
      </div>

      <div class="topbar-actions">
        <q-btn v-if="hasFilters" no-caps flat color="dark" icon="restart_alt" class="reset-filters-btn"
          @click="$emit('reset')" />
        <q-btn no-caps flat icon="tune" :label="hasFilters ? 'Filtres ●' : 'Filtres'" class="filter-sheet-btn"
          :class="{ 'filter-sheet-btn--active': hasFilters }" @click="$emit('open-filters')" />
      </div>
    </div>

    <!-- Row 2: horizontal scrollable filters -->
    <div class="filters-scroll-row">
      <q-select v-model="localFilters.ville" :options="filteredVilleOptions" dense borderless clearable emit-value
        map-options use-input fill-input hide-selected input-debounce="0" placeholder="Ville" class="filter-chip"
        @filter="filterVille" />

      <q-select v-model="localFilters.types" :options="typeOptions" dense borderless clearable emit-value map-options
        multiple use-chips placeholder="Type" class="filter-chip filter-chip--wide" />

      <q-input v-model.number="localFilters.budget_min" dense borderless type="number" placeholder="Budget min"
        class="filter-chip filter-chip--num" />

      <q-input v-model.number="localFilters.budget_max" dense borderless type="number" placeholder="Budget max"
        class="filter-chip filter-chip--num" />

      <q-select v-model="localFilters.nb_places_min" :options="placesOptions" dense borderless clearable emit-value
        map-options placeholder="Places min" class="filter-chip" />

      <q-input v-model="localFilters.universite" dense borderless placeholder="Université"
        class="filter-chip filter-chip--wide" />
    </div>

    <!-- Mobile tab switcher -->
    <q-tabs v-model="localActiveTab" class="mobile-tabs md:hidden!" dense no-caps align="justify"
      active-color="negative" indicator-color="negative">
      <q-tab name="liste" icon="list" label="Liste" />
      <q-tab name="carte" icon="map" label="Carte" />
    </q-tabs>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
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
  hasFilters: {
    type: Boolean,
    default: false
  },
  activeTab: {
    type: String,
    default: 'liste'
  }
})

const emit = defineEmits(['update:filters', 'search', 'reset', 'open-filters', 'update:activeTab'])

const localFilters = computed({
  get: () => props.filters,
  set: (value) => emit('update:filters', value)
})

const localActiveTab = computed({
  get: () => props.activeTab,
  set: (value) => emit('update:activeTab', value)
})

// Local filtered options for ville dropdown
const filteredVilleOptions = ref(props.villeOptions)

function clearQuery() {
  localFilters.value.q = ''
  emit('search')
}

function filterVille(val, update) {
  update(() => {
    const needle = (val || '').trim().toLowerCase()
    filteredVilleOptions.value = needle
      ? props.villeOptions.filter(o => o.label.toLowerCase().includes(needle))
      : props.villeOptions
  })
}
</script>

<style scoped>
/* Styles will be inherited from parent */
</style>
