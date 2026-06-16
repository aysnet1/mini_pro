<template>
  <q-page class="home-page ">

    <div class="">

      <div v-if="loading" class="loading-state">
        <q-spinner-dots color="black" size="42px" />
        <p class="loading-text">Chargement du catalogue...</p>
      </div>

      <template v-else>
        <!-- Hero Section -->
        <section
          class="relative min-h-120 flex items-center justify-center bg-[url('/images/hero.png')] bg-cover bg-center text-center text-white py-10 px-5 max-sm:min-h-80 max-sm:py-8 max-sm:px-4">
          <div class="absolute inset-0 bg-black/40"></div>

          <div class="relative z-30 w-full max-w-200 flex flex-col items-center gap-4">
            <div class="text-[clamp(1rem,5vw,3.5rem)] font-black m-0 leading-[1.15] max-sm:text-2xl">Un chez-soi loin de
              chez vous</div>
            <p class="text-[clamp(0.88rem,2vw,1.2rem)] m-0 mb-4 opacity-95 max-sm:text-sm max-sm:mb-2">Réservez des
              logements étudiants près des meilleures universités et villes du Tunisie</p>

            <div class="flex flex-wrap gap-3 justify-center mb-6 max-sm:gap-2 max-sm:mb-4">
              <div
                class="flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-4 py-1.5 rounded-full border border-white/20 text-[0.9rem] max-sm:px-3 max-sm:py-1 max-sm:text-xs">
                <CheckCircle2 :size="16" class="text-white" />
                <span>Logements vérifiés</span>
              </div>
              <div
                class="flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-4 py-1.5 rounded-full border border-white/20 text-[0.9rem] max-sm:px-3 max-sm:py-1 max-sm:text-xs">
                <Headphones :size="16" class="text-white" />
                <span>Assistance 24h/24 et 7j/7</span>
              </div>
              <div
                class="flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-4 py-1.5 rounded-full border border-white/20 text-[0.9rem] max-sm:px-3 max-sm:py-1 max-sm:text-xs">
                <Banknote :size="16" class="text-white" />
                <span>Garantie du meilleur prix</span>
              </div>
            </div>

            <div class="w-full max-w-162.5 relative z-50">
              <!-- Main Search Input Bar -->
              <div :class="[
                'flex items-center bg-white h-15 pl-6 pr-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 relative z-20 max-sm:h-12 max-sm:pl-4',
                showInline && inlineResults.length > 0 ? 'rounded-t-3xl rounded-b-none border-b border-gray-100' : 'rounded-full'
              ]">
                <Search :size="22" class="text-gray-400 mr-3 shrink-0 max-sm:hidden" />
                <input v-model="searchQuery" type="text" placeholder="Rechercher par type (studio, s+1) ou Gouvernorat"
                  class="flex-1 bg-transparent border-none outline-none text-[1.1rem] max-sm:text-sm text-dark placeholder:text-gray-400 text-gray-900 w-full"
                  @focus="showInline = true" @blur="handleSearchBlur" @keyup.enter="doSearch" />
                <button @click="doSearch"
                  class="bg-red-500 hover:bg-red-600 transition-colors text-white rounded-full px-5 py-2 font-semibold text-sm max-sm:text-xs max-sm:px-3 h-11 max-sm:h-9 flex items-center justify-center shrink-0 ml-2 shadow-md hover:shadow-lg">
                  Rechercher
                </button>
              </div>

              <!-- Inline Results Dropdown -->
              <transition name="dropdown">
                <div v-show="showInline && inlineResults.length > 0"
                  class="absolute top-full left-0 right-0 bg-white shadow-[0_15px_40px_rgb(0,0,0,0.15)] z-10 flex flex-col rounded-b-3xl overflow-hidden -mt-px">
                  <div class="max-h-90 overflow-y-auto px-2 py-3 custom-scrollbar">
                    <div v-for="logement in inlineResults" :key="logement.id"
                      @mousedown.prevent="goToProperty(logement.id)"
                      class="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-all duration-200 text-left cursor-pointer group">

                      <div class="relative w-15 h-15 shrink-0 overflow-hidden rounded-[10px] shadow-sm">
                        <img :src="getPrimaryImage(logement)"
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>

                      <div class="flex-1 min-w-0 flex flex-col justify-center">
                        <div class="flex justify-between items-start mb-1 gap-2">
                          <div class="m-0 text-[15px] font-extrabold text-gray-900 truncate">{{
                            capitalize(logement.type) }}
                          </div>
                          <span
                            class="text-[14px] font-black text-red-500 whitespace-nowrap bg-red-50 px-2 py-0.5 rounded-lg">
                            {{ formatPrice(logement.prix).split(' ')[0] }} <span
                              class="text-[11px] text-red-400 font-bold">DT</span>
                          </span>
                        </div>
                        <p class="m-0 text-[13px] text-gray-500 flex items-center gap-1.5 truncate">
                          <MapPin :size="13" class="text-gray-400 shrink-0" />
                          <span class="font-medium text-gray-700">{{ logement.ville }}</span>
                          <span class="text-gray-400">•</span>
                          <span class="truncate">{{ logement.adress }}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Sticky Footer -->
                  <div class="p-3 bg-gray-50 border-t border-gray-100 mt-2">
                    <button @mousedown.prevent="doSearch"
                      class="flex items-center justify-center gap-2 text-[14px] text-gray-700 font-bold hover:text-black hover:bg-gray-200 transition-colors w-full py-2.5 rounded-xl">
                      Voir les <span class="text-red-500">{{ inlineResults.length }}+</span> résultats pour "{{
                        searchQuery
                      }}"
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </section>

        <!-- Cities Quick Search Section -->
        <section class="bg-white border-b border-gray-100">
          <div class="max-w-7xl mx-auto px-5 py-6">
            <div class="text-lg max-sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin :size="20" class="text-red-500" />
              Explorer par gouvernorat
            </div>
            <div
              class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 overflow-x-auto pb-4 scrollbar-none pt-2 [&::-webkit-scrollbar]:hidden"
              style="-ms-overflow-style: none; scrollbar-width: none;">
              <button v-for="ville in tunisianWilayas" :key="ville" @click="searchByCity(ville)"
                class="group relative flex items-center justify-center whitespace-nowrap px-6 py-3 max-sm:px-4 max-sm:py-2 min-w-30 max-sm:min-w-24 border border-gray-200 rounded-xl hover:border-black hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white cursor-pointer overflow-hidden">
                <div class="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span
                  class="text-sm max-sm:text-xs font-semibold text-gray-700 group-hover:text-black transition-colors z-10">{{
                    ville
                  }}</span>
              </button>
            </div>
          </div>
        </section>

        <!-- Dynamic Feed Sections Loop -->
        <section v-for="section in sections" :key="section.key"
          class="section-block q-mt-md relative w-full h-full sm:max-w-7xl mx-auto px-5 py-6">
          <div class="section-header">
            <div>
              <div class="section-title">{{ section.title }}</div>
              <p v-if="section.hint" class="section-hint">{{ section.hint }}</p>
            </div>
            <q-badge color="black" outline :label="`${section.items.length} logement(s)`" />
          </div>

          <div v-if="section.items.length === 0" class="empty-state">
            <q-icon name="holiday_village" size="58px" color="grey-5" />
            <p class="empty-title">Aucun logement trouvé</p>
            <p class="empty-subtitle">Ajustez vos préférences pour obtenir plus de résultats.</p>
          </div>

          <div v-else class="cards-strip">
            <router-link v-for="item in section.items" :key="`${section.key}-${item.id}`" :to="`/logements/${item.id}`"
              class="card-link">
              <q-card flat class="logement-card">
                <div class="logement-image-wrap">
                  <img :src="getPrimaryImage(item)" :alt="item.type" loading="lazy" class="logement-image" />

                  <div class="overlay-top">
                    <q-badge color="black" text-color="white" :label="formatStatus(item.statut)" />
                    <span class="places-chip">{{ formatPlaces(item.nb_places) }}</span>
                  </div>
                </div>

                <q-card-section class="logement-card-body">
                  <div class="logement-meta">
                    <span class="logement-type">{{ capitalize(item.type) }}</span>
                    <span class="dot-sep">•</span>
                    <span class="logement-city">{{ item.ville }}</span>
                  </div>

                  <div class="detail-line">
                    <MapPin :size="14" class="icon-muted" />
                    <span class="truncate">{{ item.adress }}</span>
                  </div>

                  <p class="desc-line h-full">{{ getShortDescription(item.description) }}</p>

                  <div v-if="getEquipmentPreview(item).length > 0" class="equipements-row">
                    <span v-for="equipement in getEquipmentPreview(item)" :key="`${item.id}-${equipement}`"
                      class="equip-chip">
                      {{ equipement }}
                    </span>
                  </div>

                  <div class="card-footer">
                    <div class="price-block">
                      <span class="price-value mx-1">{{ formatPrice(item.prix).split(' ')[0] }}</span>
                      <small>DT/mois</small>
                    </div>

                    <div class="rating-chip">
                      <Star :size="12" class="star-icon" />
                      <span>{{ formatRating(item.rating) }}</span>
                      <small>({{ item.avis_count || 0 }})</small>
                    </div>
                  </div>
                  <!-- Distance from university -->
                  <div v-if="item.distance"
                    class="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-sm text-green-600">
                    <MapPin :size="12" class="text-green-400" />
                    <span>{{ item.distance }}</span>
                    <span>de l'université</span>
                  </div>
                </q-card-section>
              </q-card>
            </router-link>
          </div>
        </section>
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { MapPin, Star, CheckCircle2, Headphones, Banknote, Search } from 'lucide-vue-next'
import { tunisianWilayas } from '@/helpers/tunisiaCities'

// Import your global authentication store context (Pinia / Vuex / custom)
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()


const { isAuthenticated } = storeToRefs(authStore)

const searchQuery = ref('')
const showInline = ref(false)
const inlineResults = ref([])
let searchDebounceTimer = null

watch(searchQuery, (val) => {
  clearTimeout(searchDebounceTimer)
  const q = val.trim()
  if (!q || q.length < 2) {
    inlineResults.value = []
    return
  }
  if (tunisianWilayas.some(w => w.toLowerCase() === q.toLowerCase())) {
    inlineResults.value = []
    return
  }
  searchDebounceTimer = setTimeout(async () => {
    try {
      const params = new URLSearchParams({ q })
      const res = await fetch(`/api/logements/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        inlineResults.value = Array.isArray(data.logements) ? data.logements : []
      }
    } catch {
      inlineResults.value = []
    }
  }, 300)
})

const loading = ref(false)
const publicFeed = ref({ popular: [], latest: [] })
const userRecommendations = ref({ sameStudyWilaya: [], nearUniversityByDistance: [], recommended: [], context: {} })

const sections = computed(() => {
  const baseList = [
    {
      key: 'popular',
      title: 'Logements populaires',
      hint: 'Les résidences étudiantes les plus consultées',
      items: publicFeed.value.popular
    },
    {
      key: 'latest',
      title: 'Dernières annonces',
      hint: 'Les logements ajoutés récemment',
      items: publicFeed.value.latest
    }
  ]

  // Prepend personalized recommendations only if authenticated
  if (isAuthenticated.value) {
    const ctx = userRecommendations.value.context || {}
    baseList.unshift(

      {
        key: 'nearUniversityByDistance',
        title: 'Proches de votre université',
        hint: ctx.universite ? `À proximité de : ${ctx.universite}` : null,
        items: userRecommendations.value.nearUniversityByDistance || []
      },
      {
        key: 'sameStudyWilaya',
        title: 'Dans la même zone d’étude',
        hint: ctx.recherche_ville ? `Secteur : ${ctx.recherche_ville}` : null,
        items: userRecommendations.value.sameStudyWilaya || []
      }
    )
  }

  return baseList
})

function getPrimaryImage(logement) {
  if (Array.isArray(logement.photos) && logement.photos[0]) return logement.photos[0]
  try {
    const photos = typeof logement.photos === 'string' ? JSON.parse(logement.photos) : logement.photos
    if (Array.isArray(photos) && photos[0]) return photos[0]
  } catch (e) {
    console.log(e)
  }
  return 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
}

function formatPrice(price) { return `${Number(price || 0)} DT/mois` }

function formatRating(rating) { return Number(rating || 0).toFixed(1) }

function formatPlaces(nbPlaces) {
  const total = Number(nbPlaces || 1)
  return `${total} place${total > 1 ? 's' : ''}`
}

function formatStatus(status) {
  if (!status) return 'Disponible'
  const target = `${status}`.toLowerCase().trim()
  if (target === 'disponible') return 'Disponible'
  if (target === 'occupe' || target === 'occupé') return 'Occupé'
  return capitalize(status)
}

function getEquipmentPreview(logement) {
  if (!Array.isArray(logement.equipements)) return []
  return logement.equipements.filter(Boolean).slice(0, 3)
}

function getShortDescription(description) {
  if (!description) return 'Logement étudiant prêt à emménager.'
  return description.length > 80 ? `${description.slice(0, 80)}...` : description
}

function capitalize(text) {
  if (!text) return 'Logement'
  return `${text}`.charAt(0).toUpperCase() + `${text}`.slice(1)
}

function handleSearchBlur() { setTimeout(() => { showInline.value = false }, 200) }

function goToProperty(id) { router.push(`/logements/${id}`) }

function doSearch() {
  if (!searchQuery.value.trim()) return
  showInline.value = false
  router.push({ path: '/recherche', query: { q: searchQuery.value } })
}

function searchByCity(ville) { router.push({ path: '/recherche', query: { q: ville } }) }

async function loadFeed() {
  loading.value = true
  try {
    const apiTasks = [
      fetch('/api/logements/public-feed').then(res => res.json())
    ]

    // Concurrent evaluation optimization for authenticated profiles
    if (isAuthenticated.value) {
      apiTasks.push(
        fetch('/api/logements/recommendations', {
          headers: { ...authStore.authHeader }
        }).then(res => res.json())
      )
    }

    const [publicData, authData] = await Promise.all(apiTasks)

    if (publicData) {
      publicFeed.value = {
        popular: Array.isArray(publicData.popular) ? publicData.popular : [],
        latest: Array.isArray(publicData.latest) ? publicData.latest : []
      }
    }

    if (authData && !authData.error) {
      userRecommendations.value = {
        sameStudyWilaya: Array.isArray(authData.sameStudyWilaya) ? authData.sameStudyWilaya : [],
        nearUniversityByDistance: Array.isArray(authData.nearUniversityByDistance) ? authData.nearUniversityByDistance : [],
        recommended: Array.isArray(authData.recommended) ? authData.recommended : [],
        context: authData.context || {}
      }
    }
  } catch {
    $q.notify({
      message: 'Erreur de chargement des flux de la page d\'accueil',
      color: 'negative',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFeed()
})
</script>
