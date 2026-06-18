<template>
  <div class="mt-3 p-4 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl shadow-lg">
    <div class="flex items-center gap-2 mb-4">
      <Calendar :size="18" class="text-white" />
      <span class="text-sm font-bold text-white">Sélectionnez vos dates de séjour</span>
    </div>

    <div class="space-y-3">
      <!-- Date Range -->
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-[10px] font-bold text-gray-300 uppercase mb-1">
            Date de début
          </label>
          <input type="date" v-model="dateDebut"
            @input="handleDateDebutChange"
            :min="minDate"
            class="w-full text-xs bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 cursor-pointer" />
        </div>

        <div>
          <label class="block text-[10px] font-bold text-gray-300 uppercase mb-1">
            Date de fin
          </label>
          <input type="date" v-model="dateFin"
            @input="handleDateFinChange"
            :min="dateDebut || minDate"
            class="w-full text-xs bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 cursor-pointer" />
        </div>
      </div>

      <!-- Durée calculée automatiquement -->
      <div class="bg-gray-800/50 rounded-lg p-2.5 border border-gray-600">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-1.5">
            <Clock :size="14" class="text-white" />
            <span class="text-[10px] font-bold text-gray-300 uppercase">Durée</span>
          </div>
          <div class="text-right">
            <span class="text-base font-bold text-white">{{ duree }}</span>
            <span class="text-[10px] text-gray-400 ml-0.5">mois</span>
          </div>
        </div>
        <!-- Barre de progression -->
        <div class="bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div
            class="bg-gradient-to-r from-white to-gray-300 h-full rounded-full transition-all duration-300 ease-out"
            :style="{ width: `${Math.min((duree / 12) * 100, 100)}%` }"
          ></div>
        </div>
      </div>

      <button @click="handleConfirm" :disabled="!isValid"
        class="w-full mt-2 bg-white hover:bg-gray-100 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 text-xs font-bold py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg">
        <CheckCircle :size="14" />
        Confirmer la réservation
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Calendar, Clock, CheckCircle } from 'lucide-vue-next'

const props = defineProps({
  reservationWidget: {
    type: Object,
    required: true,
    validator: (val) => {
      return val && 'logement_id' in val
    }
  }
})

const emit = defineEmits(['update:date', 'confirm'])

// Dates locales - initialisation avec les valeurs du widget ou valeurs vides
const dateDebut = ref(props.reservationWidget?.date_debut || '')
const dateFin = ref(props.reservationWidget?.date_fin || '')

// Watch pour synchroniser avec les changements externes
watch(() => props.reservationWidget?.date_debut, (newVal) => {
  if (newVal) dateDebut.value = newVal
})
watch(() => props.reservationWidget?.date_fin, (newVal) => {
  if (newVal) dateFin.value = newVal
})

// Date minimale (aujourd'hui)
const minDate = new Date().toISOString().split('T')[0]

// Calcule automatiquement la durée en mois
const duree = computed(() => {
  if (!dateDebut.value || !dateFin.value) return 0

  const start = new Date(dateDebut.value)
  const end = new Date(dateFin.value)

  // Différence en mois
  const months = (end.getFullYear() - start.getFullYear()) * 12 +
                 (end.getMonth() - start.getMonth())

  // Ajoute les jours restants comme fraction de mois
  const days = end.getDate() - start.getDate()
  const totalMonths = months + (days / 30)

  return Math.max(0, Math.round(totalMonths * 10) / 10)
})

// Validation
const isValid = computed(() => {
  if (!dateDebut.value || !dateFin.value) return false
  if (duree.value < 1 || duree.value > 12) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(dateDebut.value)
  const end = new Date(dateFin.value)

  return start >= today && end > start
})

function handleDateDebutChange(event) {
  dateDebut.value = event.target.value
  emit('update:date', { field: 'date_debut', value: dateDebut.value })
}

function handleDateFinChange(event) {
  dateFin.value = event.target.value
  emit('update:date', { field: 'date_fin', value: dateFin.value })
}

function handleConfirm() {
  if (!isValid.value) return
  emit('confirm', props.reservationWidget.logement_id)
}
</script>
