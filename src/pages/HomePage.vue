<template>
  <q-page class="home-page">
    <div class="page-container">


      <div v-if="loading" class="loading-state">
        <q-spinner-inner color="black" size="42px" />
        <p class="loading-text">Chargement du catalogue...</p>
      </div>

      <template v-else>
        <section v-for="section in sections" :key="section.key" class="section-block">
          <div class="section-header">
            <div>
              <h2 class="section-title">{{ section.title }}</h2>
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
              <q-card flat class="logement-card ">
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

                  <div class="card-footer ">
                    <div class="price-block">
                      <span class="price-value">{{ formatPrice(item.prix).split(' ')[0] }}</span>
                      <small>DT/mois</small>
                    </div>

                    <div class="rating-chip">
                      <Star :size="12" class="star-icon" />
                      <span>{{ formatRating(item.rating) }}</span>
                      <small>({{ item.avis_count || 0 }})</small>
                    </div>
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
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { MapPin, Star } from 'lucide-vue-next'

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
.home-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 0% 0%, rgba(15, 23, 42, 0.05), transparent 30%),
    radial-gradient(circle at 100% 100%, rgba(100, 116, 139, 0.08), transparent 34%),
    #f8fafc;
}

.page-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.page-header {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.page-title {
  margin: 0;
  font-size: clamp(1.5rem, 2.8vw, 2.2rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #475569;
  font-size: 0.95rem;
}

.loading-state {
  min-height: 40vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.loading-text {
  margin: 0;
  color: #64748b;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
}

.section-hint {
  margin: 3px 0 0;
  color: #64748b;
  font-size: 0.82rem;
}

.empty-state {
  background: #ffffff;
  border: 1px dashed #d4dbe4;
  border-radius: 14px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.empty-title {
  margin: 6px 0 0;
  font-weight: 700;
  color: #1e293b;
}

.empty-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.88rem;
}

.cards-strip {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
  scroll-snap-type: x mandatory;
  -ms-overflow-style: none;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.cards-strip::-webkit-scrollbar {
  display: none;
}

.card-link {
  text-decoration: none;
  color: inherit;
}

.logement-card {
  width: min(320px, 78vw);
  min-width: min(320px, 78vw);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  scroll-snap-align: start;
}

.logement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.1);
}

.logement-image-wrap {
  position: relative;
  height: 190px;
  background: #e2e8f0;
  overflow: hidden;
}

.logement-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay-top {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.places-chip {
  background: rgba(15, 23, 42, 0.88);
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 999px;
}

.logement-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.logement-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
}

.logement-type {
  font-weight: 700;
  color: #111827;
}

.dot-sep,
.logement-city {
  color: #64748b;
}

.detail-line {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.82rem;
}

.icon-muted {
  color: #64748b;
}

.desc-line {
  margin: 0;
  min-height: 34px;
  color: #475569;
  font-size: 0.82rem;
  line-height: 1.35;
}

.equipements-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.equip-chip {
  font-size: 0.7rem;
  color: #475569;
  background: #f1f5f9;
  border-radius: 999px;
  padding: 2px 8px;
}

.card-footer {
  border-top: 1px solid #eef2f7;
  padding-top: 9px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-block {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price-value {
  font-size: 1rem;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.price-block small {
  color: #64748b;
  font-size: 0.68rem;
}

.rating-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.76rem;
  color: #0f172a;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 3px 8px;
}

.star-icon {
  color: #0f172a;
  fill: #0f172a;
}

.rating-chip small {
  color: #64748b;
}

@media (max-width: 768px) {
  .page-container {
    padding: 12px;
    gap: 14px;
  }

  .page-header {
    padding: 12px;
    border-radius: 12px;
  }

  .page-title {
    font-size: 1.3rem;
  }

  .page-subtitle {
    font-size: 0.84rem;
    margin-top: 4px;
  }

  .section-block {
    gap: 10px;
  }

  .section-title {
    font-size: 1rem;
  }

  .section-hint {
    font-size: 0.76rem;
  }

  .cards-strip {
    gap: 12px;
  }

  .logement-card {
    width: min(260px, 72vw);
    min-width: min(260px, 72vw);
    border-radius: 12px;
  }

  .logement-image-wrap {
    height: 150px;
  }

  .overlay-top {
    top: 8px;
    left: 8px;
    right: 8px;
  }

  .places-chip {
    font-size: 0.64rem;
    padding: 3px 7px;
  }

  .logement-card-body {
    gap: 6px;
    padding: 10px;
  }

  .logement-meta {
    font-size: 0.8rem;
  }

  .detail-line {
    font-size: 0.76rem;
  }

  .desc-line {
    font-size: 0.76rem;
    min-height: 30px;
  }

  .equip-chip {
    font-size: 0.64rem;
    padding: 2px 7px;
  }

  .price-value {
    font-size: 0.9rem;
  }

  .rating-chip {
    font-size: 0.68rem;
    padding: 2px 7px;
  }

  .empty-state {
    min-height: 150px;
    border-radius: 12px;
  }

  .empty-title {
    font-size: 0.95rem;
  }

  .empty-subtitle {
    font-size: 0.8rem;
  }
}
</style>
