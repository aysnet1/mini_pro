<template>
    <div class="mt-3 p-3 rounded-xl border-2"
        :class="reservationResult.success ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'">
        <div class="flex items-center gap-2 mb-2">
            <CheckCircle v-if="reservationResult.success" :size="18" class="text-green-600" />
            <X v-else :size="18" class="text-red-600" />
            <span class="text-xs font-bold" :class="reservationResult.success ? 'text-green-900' : 'text-red-900'">
                {{ reservationResult.success ? 'Réservation Confirmée' : 'Échec de la Réservation' }}
            </span>
        </div>
        <p class="text-xs" :class="reservationResult.success ? 'text-green-800' : 'text-red-800'">
            {{ reservationResult.message }}
        </p>
        <div v-if="reservationResult.success && reservationResult.reservation_id"
            class="mt-2 text-[10px] text-green-700 font-medium">
            ID Réservation: #{{ reservationResult.reservation_id }}
        </div>
    </div>
</template>

<script setup>
import { CheckCircle, X } from 'lucide-vue-next'

defineProps({
    reservationResult: {
        type: Object,
        required: true,
        validator: (val) => {
            return val && 'success' in val && 'message' in val
        }
    }
})
</script>
