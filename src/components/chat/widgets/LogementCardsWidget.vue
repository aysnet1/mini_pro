<template>
    <div class="mt-3 space-y-2.5">
        <router-link v-for="item in widgetData" :key="item.id" :to="`/logements/${item.id}`"
            class="chat-card-link block group">
            <div
                class="bg-white rounded-xl border border-zinc-200/60 overflow-hidden text-zinc-900 max-w-65 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group-hover:border-zinc-300">
                <div class="relative aspect-16/10 bg-zinc-100 overflow-hidden">
                    <img :src="parsePhotos(item.photos)[0]"
                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div class="absolute top-2 left-2">
                        <span
                            class="text-[8px] font-black uppercase tracking-wider bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md">
                            {{ item.type }}
                        </span>
                    </div>
                </div>
                <div class="p-3 space-y-1.5">
                    <div class="text-xs font-bold truncate text-zinc-900">
                        {{ item.adress }}
                    </div>
                    <div class="text-[10px] text-zinc-500 font-medium">
                        {{ item.ville }} · {{ item.nb_places }} places
                    </div>
                    <div class="flex items-center justify-between pt-2 border-t border-zinc-100 mt-2">
                        <span class="text-xs font-black text-zinc-900">
                            {{ item.prix }} DT<span class="text-[9px] font-normal text-zinc-500">/m</span>
                        </span>
                        <span
                            class="text-[9px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded-md">
                            {{ item.statut }}
                        </span>
                    </div>
                </div>
            </div>
        </router-link>
    </div>
</template>

<script setup>
defineProps({
    widgetData: {
        type: Array,
        required: true
    },
    parsePhotos: {
        type: Function,
        required: true
    }
})
</script>

<style scoped>
.chat-card-link {
    text-decoration: none;
    color: inherit;
}

.chat-card-link:hover {
    text-decoration: none;
}
</style>
