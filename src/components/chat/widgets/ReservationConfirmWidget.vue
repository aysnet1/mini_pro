<template>
  <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 my-3">
    <!-- En-tête -->
    <div class="flex items-center gap-2 mb-3">
      <AlertCircle :size="20" :class="iconColor" />
      <h4 class="font-semibold text-amber-900">
        {{ title }}
      </h4>
    </div>

    <!-- Résumé du logement -->
    <div class="bg-white rounded-lg p-3 mb-3">
      <div class="flex items-start gap-3">
        <img :src="thumbnail" :alt="logement.adresse" class="w-20 h-20 object-cover rounded-lg shrink-0">
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 truncate">
            {{ logement.adresse }}
          </p>
          <p class="text-sm text-gray-600">
            {{ logement.ville }}
          </p>
          <p class="text-lg font-bold text-amber-700 mt-1">
            {{ logement.prix }} DT<span class="text-sm font-normal text-gray-500">/mois</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Dates sélectionnées -->
    <div class="grid grid-cols-2 gap-3 mb-3">
      <div class="bg-white rounded-lg p-2">
        <p class="text-xs text-gray-600 mb-1">Date de début</p>
        <p class="font-medium text-gray-900">
          {{ formatDate(dates.date_debut) }}
        </p>
      </div>
      <div class="bg-white rounded-lg p-2">
        <p class="text-xs text-gray-600 mb-1">Date de fin</p>
        <p class="font-medium text-gray-900">
          {{ formatDate(dates.date_fin) }}
        </p>
      </div>
    </div>

    <!-- Durée et montant total -->
    <div class="bg-white rounded-lg p-3 mb-3">
      <div class="flex justify-between items-center">
        <div>
          <p class="text-xs text-gray-600">Durée</p>
          <p class="font-medium text-gray-900">
            {{ dates.duree }} {{ dates.duree > 1 ? 'mois' : 'mois' }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs text-gray-600">Montant total</p>
          <p class="text-xl font-bold text-amber-700">
            {{ dates.montant_total }} DT
          </p>
        </div>
      </div>
    </div>

    <!-- Question de confirmation -->
    <p class="text-sm text-amber-800 mb-3">
      {{ question }}
    </p>

    <!-- Boutons d'action -->
    <div class="flex gap-2">
      <button @click="handleConfirm"
        class="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
        <Check :size="18" />
        Confirmer
      </button>
      <button @click="handleCancel"
        class="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-300 transition-colors duration-200 flex items-center justify-center gap-2">
        <X :size="18" />
        Annuler
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Check, X, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  reservationConfirm: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.question &&
        value.logement &&
        value.dates &&
        typeof value.logement.id === 'number' &&
        typeof value.logement.prix === 'number' &&
        typeof value.dates.duree === 'number'
    },
  },
})

const emit = defineEmits(['confirm', 'cancel'])

// Icône et couleur
const iconColor = 'text-amber-600'
const title = 'Confirmez votre réservation'

// Extrait les données
const logement = computed(() => props.reservationConfirm.logement)
const dates = computed(() => props.reservationConfirm.dates)
const question = computed(() => props.reservationConfirm.question || 'Voulez-vous confirmer cette réservation ?')

// Thumbnail (première photo ou fallback)
const thumbnail = computed(() => {
  const photos = logement.value.photos
  if (!photos) return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=200&q=80'

  try {
    const photoArray = typeof photos === 'string' ? JSON.parse(photos) : photos
    return Array.isArray(photoArray) && photoArray.length > 0
      ? photoArray[0]
      : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=200&q=80'
  } catch {
    return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=200&q=80'
  }
})

// Formate une date ISO en format lisible
function formatDate(isoDate) {
  if (!isoDate) return 'Non définie'
  try {
    return new Date(isoDate).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return isoDate
  }
}

// Gère la confirmation
function handleConfirm() {
  emit('confirm', {
    confirmed: true,
    logement_id: logement.value.id,
    date_debut: dates.value.date_debut,
    date_fin: dates.value.date_fin,
    duree: dates.value.duree,
  })
}

// Gère l'annulation
function handleCancel() {
  emit('cancel', {
    confirmed: false,
  })
}
</script>
