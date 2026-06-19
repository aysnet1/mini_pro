<template>
  <div class="mt-3 p-4 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl shadow-lg">
    <div class="flex items-center gap-2 mb-4">
      <Calendar :size="18" class="text-white" />
      <span class="text-sm font-bold text-white">Sélectionnez votre période de location</span>
    </div>

    <div class="space-y-3">
      <!-- Date de début -->
      <div>
        <label class="block text-[10px] font-bold text-gray-300 uppercase mb-1">
          Date de début
        </label>
        <input type="date" v-model="dateDebut" @input="handleDateDebutChange" :min="minDate"
          class="w-full text-xs bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 cursor-pointer" />
      </div>

      <!-- Durée en mois : stepper -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="block text-[10px] font-bold text-gray-300 uppercase">
            Durée de location
          </label>
          <span class="text-[10px] text-gray-500">1 - 99 mois</span>
        </div>

        <div class="flex items-center gap-2">
          <button type="button" @click="decrementMonths" :disabled="dureeMonths <= 1"
            class="w-9 h-9 flex items-center justify-center bg-gray-700 border border-gray-500 rounded-lg text-white text-lg font-bold leading-none select-none disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 active:scale-95 transition-all duration-150 cursor-pointer">
            −
          </button>

          <div class="flex-1 bg-gray-800/50 border border-gray-600 rounded-lg py-1.5 text-center">
            <span class="text-base font-bold text-white">{{ dureeMonths }}</span>
            <span class="text-[10px] text-gray-400 ml-1">mois</span>
          </div>

          <button type="button" @click="incrementMonths" :disabled="dureeMonths >= 99"
            class="w-9 h-9 flex items-center justify-center bg-gray-700 border border-gray-500 rounded-lg text-white text-lg font-bold leading-none select-none disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 active:scale-95 transition-all duration-150 cursor-pointer">
            +
          </button>
        </div>

        <!-- Quick presets -->
        <div class="flex gap-1.5 mt-2">
          <button type="button" v-for="preset in presets" :key="preset" @click="selectPreset(preset)" :class="[
            'flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition-all duration-150 cursor-pointer',
            dureeMonths === preset
              ? 'bg-white text-gray-900 border-white'
              : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
          ]">
            {{ preset }} mois
          </button>
        </div>
      </div>

      <!-- Récapitulatif période -->
      <div class="bg-gray-800/50 rounded-lg p-2.5 border border-gray-600">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-1.5">
            <Clock :size="14" class="text-white" />
            <span class="text-[10px] font-bold text-gray-300 uppercase">Période</span>
          </div>
          <span class="text-[11px] font-semibold text-white">
            {{ dateDebut ? formatDate(dateDebut) : '—' }} → {{ dateFin ? formatDate(dateFin) : '—' }}
          </span>
        </div>
        <!-- Barre de progression -->
        <div class="bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div class="bg-gradient-to-r from-white to-gray-300 h-full rounded-full transition-all duration-300 ease-out"
            :style="{ width: `${Math.min((dureeMonths.value / 99) * 100, 100)}%` }"></div>
        </div>
      </div>

      <button type="button" @click="handleConfirm" :disabled="!isValid"
        class="w-full mt-2 bg-white hover:bg-gray-100 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 text-xs font-bold py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer">
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

const presets = [1, 3, 6, 12]

// Date minimale (aujourd'hui)
const minDate = new Date().toISOString().split('T')[0]

// Calcule le nombre de mois entre deux dates (arrondi vers le bas)
function monthsBetween(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  return e.getDate() >= s.getDate() ? months : months - 1
}

function initialDuree() {
  const { date_debut, date_fin } = props.reservationWidget || {}
  if (date_debut && date_fin) {
    return Math.min(12, Math.max(1, monthsBetween(date_debut, date_fin)))
  }
  return 1
}

// État local
const dateDebut = ref(props.reservationWidget?.date_debut || '')
const dureeMonths = ref(initialDuree())

// Ajoute N mois à une date, en gérant les fins de mois
// (ex: 31 jan + 1 mois -> 28/29 fév, pas 3 mars)
function addMonths(dateStr, months) {
  const d = new Date(dateStr)
  const day = d.getDate()
  d.setMonth(d.getMonth() + months)
  if (d.getDate() !== day) {
    d.setDate(0)
  }
  return d
}

function toISODate(date) {
  return date.toISOString().split('T')[0]
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Date de fin calculée automatiquement à partir du début + durée
const dateFin = computed(() => {
  if (!dateDebut.value) return ''
  return toISODate(addMonths(dateDebut.value, dureeMonths.value))
})

// Validation
const isValid = computed(() => {
  if (!dateDebut.value) return false
  if (dureeMonths.value < 1) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dateDebut.value) >= today
})

// Émet les changements dès que le début ou la durée change
watch([dateDebut, dateFin], () => {
  if (dateDebut.value) emit('update:date', { field: 'date_debut', value: dateDebut.value })
  if (dateFin.value) emit('update:date', { field: 'date_fin', value: dateFin.value })
})

// Synchronisation avec les changements externes du widget
watch(() => props.reservationWidget?.date_debut, (newVal) => {
  if (newVal && newVal !== dateDebut.value) dateDebut.value = newVal
})

function handleDateDebutChange(event) {
  dateDebut.value = event.target.value
}

function incrementMonths() {
  if (dureeMonths.value < 99) dureeMonths.value++
}

function decrementMonths() {
  if (dureeMonths.value > 1) dureeMonths.value--
}

function selectPreset(months) {
  dureeMonths.value = months
}

function handleConfirm() {
  if (!isValid.value) {
    console.warn('Réservation invalide', { dateDebut: dateDebut.value, duree: dureeMonths.value })
    return
  }

  // Émet les données complètes de réservation
  emit('confirm', {
    logement_id: props.reservationWidget.logement_id,
    date_debut: dateDebut.value,
    date_fin: dateFin.value,
    duree: dureeMonths.value
  })
}
</script>
