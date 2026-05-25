<template>
  <q-page class="detail-page">
    <div class="container">
      <q-btn flat no-caps color="dark" icon="arrow_back" label="Retour" to="/logements" class="q-mb-md" />

      <div v-if="loading" class="state-box">
        <q-spinner-dots size="36px" color="black" />
      </div>

      <div v-else-if="error" class="state-box state-error">
        {{ error }}
      </div>

      <q-card v-else flat class="detail-card">
        <div class="hero" :style="{ backgroundImage: `url('${primaryImage}')` }"></div>

        <q-card-section>
          <div class="head-row">
            <div>
              <h1 class="title">{{ capitalize(logement.type) }} · {{ logement.ville }}</h1>
              <p class="sub">{{ logement.adress }}</p>
            </div>
            <q-badge :label="logement.statut || 'disponible'" color="black" text-color="white" />
          </div>

          <div class="meta-grid q-mt-md">
            <div class="meta-item">
              <span class="label">Prix</span>
              <span class="value">{{ Number(logement.prix || 0) }} DT / mois</span>
            </div>
            <div class="meta-item">
              <span class="label">Places</span>
              <span class="value">{{ logement.nb_places || 1 }} place(s)</span>
            </div>
            <div class="meta-item">
              <span class="label">Ville</span>
              <span class="value">{{ logement.ville }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Type</span>
              <span class="value">{{ capitalize(logement.type) }}</span>
            </div>
          </div>

          <div class="q-mt-lg">
            <h2 class="section-title">Description</h2>
            <p class="desc">{{ logement.description || 'Aucune description fournie.' }}</p>
          </div>

          <div v-if="photos.length > 0" class="q-mt-lg">
            <h2 class="section-title">Photos</h2>
            <div class="photos-grid">
              <img v-for="(photo, idx) in photos" :key="idx" :src="photo" class="photo" />
            </div>
          </div>
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

const photos = computed(() => {
  try {
    const value = logement.value?.photos
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})

const primaryImage = computed(() => {
  return photos.value[0] || 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80'
})

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
      headers: { ...authStore.authHeader }
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Logement introuvable.')
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
  background: #f8fafc;
  min-height: 100vh;
}

.container {
  max-width: 1050px;
  margin: 0 auto;
  padding: 24px 16px 56px;
}

.state-box {
  min-height: 260px;
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #334155;
  background: #fff;
}

.state-error {
  color: #991b1b;
}

.detail-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
}

.hero {
  height: 320px;
  background-size: cover;
  background-position: center;
}

.head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

.sub {
  margin: 6px 0 0;
  color: #64748b;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.meta-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
}

.label {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.value {
  display: block;
  margin-top: 4px;
  font-weight: 700;
  color: #111827;
}

.section-title {
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
}

.desc {
  margin: 0;
  color: #334155;
  line-height: 1.55;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.photo {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

@media (max-width: 760px) {
  .hero {
    height: 220px;
  }

  .meta-grid,
  .photos-grid {
    grid-template-columns: 1fr;
  }
}
</style>
