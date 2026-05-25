<template>
  <div class="form-grid">
    <div class="form-group span-2">
      <label class="form-label">
        <q-icon name="place" size="16px" />
        Adresse complète
      </label>
      <q-select :model-value="adress" :options="filteredAdressOptions" use-input fill-input hide-selected
        input-debounce="250" @filter="onFilterAdresses" @update:model-value="(val) => emit('update:adress', val)"
        placeholder="Ex: 15 Rue Ibn Khaldoun" outlined dense color="black" :rules="[requiredRule]" class="input-modern"
        :loading="adressSuggestLoading" />
    </div>

    <div class="form-group">
      <label class="form-label">
        <q-icon name="location_city" size="16px" />
        Ville
      </label>
      <q-select :model-value="ville" :options="filteredVilleOptions" use-input fill-input hide-selected
        input-debounce="0" @filter="onFilterVilles" @update:model-value="(val) => emit('update:ville', val)"
        placeholder="Ex: Kairouan" outlined dense color="black" :rules="[requiredRule]" class="input-modern" />

      <div v-if="geocodeLoading" class="geocode-hint">
        Recherche automatique de la position en cours...
      </div>
      <div v-else-if="geocodeError" class="geocode-hint geocode-hint-error">
        {{ geocodeError }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  adress: { type: String, default: '' },
  ville: { type: String, default: '' },
  filteredVilleOptions: { type: Array, default: () => [] },
  filteredAdressOptions: { type: Array, default: () => [] },
  geocodeLoading: { type: Boolean, default: false },
  adressSuggestLoading: { type: Boolean, default: false },
  geocodeError: { type: String, default: '' },
  requiredRule: { type: Function, required: true },
})

const emit = defineEmits(['update:adress', 'update:ville', 'filter-villes', 'filter-adresses'])

function onFilterVilles(val, update) {
  emit('filter-villes', val, update)
}

function onFilterAdresses(val, update) {
  emit('filter-adresses', val, update)
}
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-modern :deep(.q-field__control) {
  border-radius: 0px !important;
  border: 1px solid #000000;
}

.geocode-hint {
  font-size: 0.76rem;
  font-weight: 600;
  color: #444444;
  margin-top: 4px;
}

.geocode-hint-error {
  color: #7f1d1d;
}
</style>
