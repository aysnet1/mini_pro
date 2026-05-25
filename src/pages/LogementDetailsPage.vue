<template>
  <q-page class="detail-page">
    <div class="detail-container">
      <q-btn flat no-caps color="black" icon="arrow_back" label="Retour" to="/logements" class="q-mb-md" />

      <div v-if="loading" class="state-wrap">
        <q-spinner-dots size="36px" color="black" />
      </div>

      <div v-else-if="error" class="state-wrap error-wrap">
        {{ error }}
      </div>

      <q-card v-else flat class="detail-card">
        <div class="media" :style="{ backgroundImage: `url('${coverImage}')` }">
          <div class="price-chip">{{ formatPrice(logement.prix) }}</div>
        </div>

        <q-card-section class="content">
          <div class="title-row">
            <h1 class="title">{{ capitalize(logement.type) }} · {{ logement.ville }}</h1>
            <q-badge :label="logement.statut || 'disponible'" color="black" text-color="white" />
          </div>

          <p class="adress">{{ logement.adress }}</p>

          <div class="meta-grid">
            <div class="meta-item">
              <q-icon name="payments" size="16px" />
              <span>{{ formatPrice(logement.prix) }}</span>
            </div>
            <div class="meta-item">
              <q-icon name="group" size="16px" />
              <span>{{ logement.nb_places || 1 }} place(s)</span>
            </div>
            <div class="meta-item" v-if="hasCoords">
              <q-icon name="place" size="16px" />
              <span>{{ Number(logement.latitude).toFixed(5) }}, {{ Number(logement.longitude).toFixed(5) }}</span>
            </div>
          </div>

          <p class="description">{{ logement.description || 'Aucune description fournie.' }}</p>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')
const logement = ref({})

const hasCoords = computed(() => Number.isFinite(Number(logement.value.latitude)) && Number.isFinite(Number(logement.value.longitude)))

const coverImage = computed(() => {
  try {
    const photos = typeof logement.value.photos === 'string' ? JSON.parse(logement.value.photos) : logement.value.photos
    if (Array.isArray(photos) && photos[0]) return photos[0]
  } catch {
    // ignore
  }
  return 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
})

function formatPrice(price) {
  return `${Number(price || 0)} DT / mois`
}

function capitalize(text) {
  if (!text) return 'Logement'
  const value = `${text}`
  return value.charAt(0).toUpperCase() + value.slice(1)
}

async function loadLogement() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`/api/logements/${route.params.id}`, {
      headers: {
        ...authStore.authHeader,
      },
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Impossible de charger ce logement.')
    logement.value = data || {}
  } catch (err) {
    error.value = err.message || 'Erreur de chargement.'
  } finally {
    loading.value = false
  }
}

onMounted(loadLogement)
</script>

<style scoped>
.detail-page {
  background: #ffffff;
  min-height: 100vh;
}

.detail-container {
  max-width: 980px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.state-wrap {
  min-height: 260px;
  display: grid;
  place-items: center;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
}

.error-wrap {
  color: #7f1d1d;
}

.detail-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
}

.media {
  height: 310px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.price-chip {
  position: absolute;
  right: 12px;
  top: 12px;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 7px 12px;
}

.content {
  padding: 18px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: #111827;
}

.adress {
  margin: 10px 0 0;
  color: #374151;
}

.meta-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #111827;
  font-size: 0.9rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 10px;
}

.description {
  margin-top: 16px;
  color: #374151;
  line-height: 1.65;
}

@media (max-width: 900px) {
  .meta-grid {
    grid-template-columns: 1fr;
  }

  .media {
    height: 230px;
  }
}
</style>
