<template>
    <article
        class="listing-card group flex flex-col max-sm:flex-row bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-slate-300 max-sm:min-h-24 max-sm:hover:translate-y-0"
        :class="{ 'ring-2 ring-slate-300 shadow-lg -translate-y-0.5': isActive }"
        @mouseenter="$emit('hover', logement.id)" @touchstart="$emit('hover', logement.id)">
        <!-- Media -->
        <div class="card-media relative h-40 max-sm:h-auto max-sm:w-28 max-sm:min-w-28 max-sm:shrink-0 bg-slate-100 bg-cover bg-center shrink-0 max-sm:rounded-none max-sm:rounded-l-2xl"
            :style="{ backgroundImage: `url('${imageUrl}')` }">
            <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <span
                class="absolute left-2.5 bottom-2.5 bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm max-sm:text-[0.65rem] max-sm:px-2 max-sm:py-0.5">
                {{ formatPrice(logement.prix) }}
            </span>
            <span v-if="logement.match_universite"
                class="absolute right-2.5 bottom-2.5 bg-teal-700 text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full">
                🎓 Univ.
            </span>
        </div>

        <!-- Body -->
        <div class="flex flex-col gap-1 p-2.5 max-sm:justify-center max-sm:flex-1 max-sm:min-w-0">
            <p class="m-0 text-sm font-bold text-slate-900 truncate leading-snug max-sm:text-xs">
                {{ capitalize(logement.type) }} · {{ logement.ville }}
            </p>
            <p class="m-0 text-xs text-slate-500 truncate max-sm:text-[0.72rem]">
                {{ logement.adress }}
            </p>
            <div class="flex flex-wrap gap-1 mt-0.5">
                <span v-if="logement.nb_places"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.68rem] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                    {{ logement.nb_places }} pl.
                </span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.68rem] font-semibold border"
                    :class="statusClass">
                    {{ logement.statut || 'dispo' }}
                </span>
            </div>
            <div v-if="equipmentPreview.length" class="equip-row flex flex-wrap gap-1 mt-0.5">
                <span v-for="eq in equipmentPreview" :key="eq"
                    class="text-[0.65rem] text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                    {{ eq }}
                </span>
            </div>
        </div>
    </article>
</template>

<script setup>
import { computed } from 'vue'
import { safeJsonParse } from '@/utils/safeJsonParse'

const props = defineProps({
    logement: {
        type: Object,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['hover'])

function capitalize(text) {
    if (!text) return 'Logement'
    return `${text}`.charAt(0).toUpperCase() + `${text}`.slice(1)
}

function formatPrice(price) {
    const value = Number(price || 0)
    return `${value} DT / mois`
}

const imageUrl = computed(() => {
    try {
        const photos = safeJsonParse(props.logement.photos, [])
        if (Array.isArray(photos) && photos[0]) return photos[0]
    } catch {
        // noop
    }
    return 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
})

const statusClass = computed(() => {
    return props.logement.statut === 'disponible'
        ? 'bg-cyan-50 text-teal-700 border-teal-200'
        : 'bg-slate-50 text-slate-400 border-slate-200'
})

const equipmentPreview = computed(() => {
    const equipements = safeJsonParse(props.logement.equipemens, [])
    return Array.isArray(equipements)
        ? equipements.filter(Boolean).slice(0, 3)
        : []
})
</script>

<style scoped>
/* Styles will be inherited from parent */
</style>
