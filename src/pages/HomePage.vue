<template>
  <q-page class="p-4 md:p-8 bg-zinc-50/50">
    <div class="max-w-7xl mx-auto space-y-8">


      <div v-if="loading" class="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
        <q-spinner-inner color="dark" size="36px" />
        <span class="text-[10px] div text-zinc-400 uppercase tracking-widest">Chargement du catalogue</span>
      </div>

      <template v-else>
        <section v-for="section in sections" :key="section.key" class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-base md:text-lg  text-zinc-900 tracking-tight">
                {{ section.title }}
              </div>
              <p v-if="section.hint" class="text-[11px] text-zinc-400 font-medium">
                {{ section.hint }}
              </p>
            </div>

            <div class="text-[11px]  text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200">
              {{ section.items.length }} logements
            </div>
          </div>

          <div v-if="section.items.length === 0"
            class="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-dashed border-zinc-200">
            <div class="p-2 bg-zinc-50 rounded-lg text-zinc-400 mb-2">
              <Building :size="18" />
            </div>
            <p class="text-xs div text-zinc-800">Aucun logement trouvé</p>
          </div>

          <div v-else class="relative">
            <div class="scroll-container flex gap-5 overflow-x-auto pb-3 snap-x mandatory scrollbar-none">

              <router-link v-for="item in section.items" :key="`${section.key}-${item.id}`"
                :to="`/logements/${item.id}`" class="card-link">
                <article
                  class="flex-none w-70 md:w-75 snap-start bg-white rounded-xl border border-zinc-200 overflow-hidden group hover:shadow-md transition-all duration-200">
                  <div class="relative aspect-16/10 bg-zinc-100 overflow-hidden">
                    <img :src="getPrimaryImage(item)" :alt="item.type" loading="lazy"
                      class="w-full h-full object-cover transform scale-100 group-hover:scale-102 transition-transform duration-300 ease-out" />

                    <div class="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                      <span
                        class="inline-flex items-center text-[9px] font-black uppercase tracking-wider text-zinc-950 bg-white/95 px-2 py-0.5 rounded shadow-sm border border-zinc-200">
                        {{ formatStatus(item.statut) }}
                      </span>
                      <span
                        class="inline-flex items-center text-[9px] div text-white bg-zinc-950/90 px-2 py-0.5 rounded shadow-sm">
                        {{ formatPlaces(item.nb_places) }}
                      </span>
                    </div>
                  </div>

                  <div class="p-4 space-y-3">
                    <div class="space-y-0.5">
                      <div class="text-sm div text-zinc-900 truncate">
                        {{ capitalize(item.type) }} · {{ item.ville }}
                      </div>
                      <div class="flex items-center text-[11px] font-medium text-zinc-400 truncate">
                        <MapPin :size="12" class="mr-1 shrink-0 text-zinc-400" />
                        <span>{{ item.adress }}</span>
                      </div>
                    </div>

                    <p class="text-xs text-zinc-500 leading-normal line-clamp-2 min-h-8">
                      {{ getShortDescription(item.description) }}
                    </p>

                    <div v-if="getEquipmentPreview(item).length > 0" class="flex flex-wrap gap-1">
                      <span v-for="equipement in getEquipmentPreview(item)" :key="`${item.id}-${equipement}`"
                        class="inline-flex text-[10px] font-medium text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                        {{ equipement }}
                      </span>
                    </div>

                    <div class="h-px bg-zinc-100 pt-0.5"></div>

                    <div class="flex items-center justify-between pt-0.5">
                      <div class="flex items-baseline text-zinc-900">
                        <span class="text-sm font-black tracking-tight">{{ formatPrice(item.prix).split(' ')[0]
                          }}</span>
                        <span class="text-[10px]  text-zinc-400 ml-0.5">DT/mois</span>
                      </div>

                      <div
                        class="flex items-center text-[11px] div text-zinc-900 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100">
                        <Star :size="11" class="text-zinc-950 fill-zinc-950 mr-1" />
                        <span>{{ formatRating(item.rating) }}</span>
                        <span class="text-[9px] text-zinc-400 font-normal ml-0.5">({{ item.avis_count || 0 }})</span>
                      </div>
                    </div>
                  </div>
                </article>
              </router-link>

            </div>
          </div>
        </section>
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { MapPin, Star, Building } from 'lucide-vue-next'

const $q = useQuasar()
const authStore = useAuthStore()

const loading = ref(false)
const feed = ref({
  recommended: [],
  nearUniversity: [],
  sameStudyWilaya: [],
  popular: [],
  context: {
    universite: null,
    recherche_ville: null
  }
})

const sections = computed(() => [

  {
    key: 'nearUniversity',
    title: 'Proches de votre université',
    hint: feed.value.context.universite
      ? `À proximité de : ${feed.value.context.universite}`
      : null,
    items: feed.value.nearUniversity || []
  },
  {
    key: 'sameStudyWilaya',
    title: 'Dans la même zone d’étude',
    hint: feed.value.context.recherche_ville
      ? `Secteur : ${feed.value.context.recherche_ville}`
      : null,
    items: feed.value.sameStudyWilaya || []
  },
  {
    key: 'popular',
    title: 'Logements populaires',
    hint: 'Les résidences étudiantes les plus consultées',
    items: feed.value.popular || []
  }
])

function getPrimaryImage(logement) {
  if (Array.isArray(logement.photos) && logement.photos[0]) return logement.photos[0]
  try {
    const photos = typeof logement.photos === 'string' ? JSON.parse(logement.photos) : logement.photos
    if (Array.isArray(photos) && photos[0]) return photos[0]
  } catch {
    // noop
  }
  return 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
}

function formatPrice(price) {
  return `${Number(price || 0)} DT/mois`
}

function formatRating(rating) {
  return Number(rating || 0).toFixed(1)
}

function formatPlaces(nbPlaces) {
  const total = Number(nbPlaces || 1)
  return `${total} place${total > 1 ? 's' : ''}`
}

function formatStatus(status) {
  if (!status) return 'Disponible'
  const target = `${status}`.toLowerCase().trim()
  if (target === 'disponible') return 'Disponible'
  if (target === 'occupe' || target === 'occupé') return 'Occupé'
  if (target === 'en attente') return 'En attente'
  return capitalize(status)
}

function getEquipmentPreview(logement) {
  if (!Array.isArray(logement.equipemens)) return []
  return logement.equipemens.filter(Boolean).slice(0, 3)
}

function getShortDescription(description) {
  if (!description) return 'Logement étudiant prêt à emménager.'
  return description.length > 80 ? `${description.slice(0, 80)}...` : description
}

function capitalize(text) {
  if (!text) return 'Logement'
  return `${text}`.charAt(0).toUpperCase() + `${text}`.slice(1)
}

async function loadFeed() {
  loading.value = true
  try {
    const response = await fetch('/api/logements/home-feed', {
      headers: { ...authStore.authHeader }
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Erreur réseau')
    feed.value = {
      recommended: Array.isArray(data.recommended) ? data.recommended : [],
      nearUniversity: Array.isArray(data.nearUniversity) ? data.nearUniversity : [],
      sameStudyWilaya: Array.isArray(data.sameStudyWilaya) ? data.sameStudyWilaya : [],
      popular: Array.isArray(data.popular) ? data.popular : [],
      context: data.context || { universite: null, recherche_ville: null }
    }
  } catch (err) {
    $q.notify({
      message: err.message || 'Erreur de chargement du feed logement',
      color: 'negative',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

onMounted(loadFeed)
</script>

<style scoped>
.scroll-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.scroll-container::-webkit-scrollbar {
  display: none;
}

.card-link {
  text-decoration: none;
}
</style>
