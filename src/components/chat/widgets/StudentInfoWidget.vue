<template>
    <div class="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
        <div class="flex items-center gap-2 mb-2">
            <CheckCircle :size="18" class="text-purple-600" />
            <span class="text-xs font-bold text-purple-900">Informations Étudiant</span>
        </div>
        <div class="space-y-1">
            <div class="flex items-center gap-2 text-xs">
                <span class="font-bold text-purple-700">Nom:</span>
                <span class="text-purple-900">{{ studentInfo.nom }} {{ studentInfo.prenom }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
                <span class="font-bold text-purple-700">Budget:</span>
                <span class="text-purple-900">{{ studentInfo.budget || 'Non spécifié' }} DT/mois</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
                <span class="font-bold text-purple-700">Université:</span>
                <span class="text-purple-900">{{ studentInfo.universite || 'Non spécifié' }}</span>
            </div>
            <div v-if="studentInfo.hasActiveReservation"
                class="mt-2 p-2 bg-orange-100 border border-orange-300 rounded-lg">
                <div class="flex items-center gap-1 text-[10px] font-bold text-orange-800">
                    <Loader2 :size="12" class="animate-spin" />
                    <span>Réservation active en cours ({{ studentInfo.activeReservationsCount }})</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { CheckCircle, Loader2 } from 'lucide-vue-next'

defineProps({
    studentInfo: {
        type: Object,
        required: true,
        validator: (val) => {
            return val &&
                'nom' in val &&
                'prenom' in val &&
                'budget' in val &&
                'hasActiveReservation' in val
        }
    }
})
</script>
