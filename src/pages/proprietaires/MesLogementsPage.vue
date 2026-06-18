<template>
  <q-page class="mes-logements-page">
    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">Mes Logements</h1>
            <p class="page-subtitle">Gérez vos propriétés et ajoutez de nouveaux logements</p>
          </div>
          <q-btn no-caps unelevated color="black" text-color="white" :icon="showForm ? 'close' : 'add'"
            :label="showForm ? 'Fermer' : 'Nouveau logement'" class="btn-add-logement" @click="showForm = !showForm" />
        </div>
      </header>

      <transition name="slide-form">
        <q-card v-if="showForm" flat class="form-card">
          <q-card-section class="form-card-header">
            <q-icon name="apartment" size="28px" color="black" />
            <span class="form-card-title">Ajouter un nouveau logement</span>
          </q-card-section>

          <q-separator color="grey-3" />

          <q-card-section>
            <q-form class="logement-form" @submit.prevent="createLogement">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">
                    <q-icon name="location_on" size="16px" />
                    Adresse
                  </label>
                  <q-input v-model="form.adress" placeholder="Ex: 15 Rue de la République" outlined dense color="black"
                    :rules="[requiredRule]" class="input-modern" />
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <q-icon name="location_city" size="16px" />
                    Ville
                  </label>
                  <q-input v-model="form.ville" placeholder="Ex: Kairouan" outlined dense color="black"
                    :rules="[requiredRule]" class="input-modern" />
                </div>
              </div>

              <div class="form-grid cols-3">
                <div class="form-group">
                  <label class="form-label">
                    <q-icon name="home_work" size="16px" />
                    Type
                  </label>
                  <q-select v-model="form.type" :options="typeOptions" placeholder="Choisir..." outlined dense
                    emit-value map-options color="black" :rules="[requiredRule]" class="input-modern" />
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <q-icon name="payments" size="16px" />
                    Prix mensuel (DT)
                  </label>
                  <q-input v-model.number="form.prix" type="number" placeholder="350" outlined dense color="black"
                    :rules="[requiredRule]" class="input-modern" />
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <q-icon name="group" size="16px" />
                    Nombre de places
                  </label>
                  <q-input v-model.number="form.nb_places" type="number" placeholder="2" outlined dense color="black"
                    class="input-modern" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <q-icon name="description" size="16px" />
                  Description
                </label>
                <q-input v-model="form.description" type="textarea" :rows="3"
                  placeholder="Décrivez votre logement: équipements, ambiance, proximité..." outlined dense
                  color="black" class="input-modern" />
              </div>

              <div class="form-group">
                <label class="form-label">
                  <q-icon name="photo_library" size="16px" />
                  Photos
                  <span class="photo-counter">{{ pendingPhotos.length }} / 5</span>
                </label>

                <div class="dropzone"
                  :class="{ 'dropzone-active': isDragging, 'dropzone-full': pendingPhotos.length >= 5 }"
                  @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false"
                  @drop.prevent="handleDrop" @click="pendingPhotos.length < 5 && $refs.fileInput.click()">
                  <input ref="fileInput" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif"
                    style="display: none" @change="handleFileSelect" />

                  <div v-if="pendingPhotos.length === 0" class="dropzone-placeholder">
                    <q-icon name="cloud_upload" size="48px" color="grey-8" />
                    <p class="dropzone-text">Glissez vos images ici ou <span class="dropzone-link">parcourir</span></p>
                    <p class="dropzone-hint">JPEG, PNG, WebP, GIF — Max 5 Mo chacune — Max 5 images</p>
                  </div>

                  <div v-else class="preview-grid">
                    <div v-for="(photo, index) in pendingPhotos" :key="index" class="preview-item">
                      <img :src="photo.preview" :alt="photo.file.name" class="preview-img" />
                      <div class="preview-overlay">
                        <q-btn round flat size="xs" icon="close" color="white" class="preview-remove-btn"
                          @click.stop="removePendingPhoto(index)" />
                      </div>
                      <div class="preview-name">{{ photo.file.name }}</div>
                    </div>

                    <div v-if="pendingPhotos.length < 5" class="preview-item preview-add"
                      @click.stop="$refs.fileInput.click()">
                      <q-icon name="add_photo_alternate" size="32px" color="grey-8" />
                      <span class="add-label">Ajouter</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <q-icon name="map" size="16px" />
                  Position sur la carte
                </label>
                <div class="map-position-banner" :class="{ 'has-position': selectedPosition }">
                  <q-icon :name="selectedPosition ? 'check_circle' : 'touch_app'" size="20px" />
                  <span>{{ positionText }}</span>
                </div>
              </div>
              <q-card flat class="map-card">
                <q-card-section class="map-card-header">
                  <q-icon name="explore" size="24px" color="black" />
                  <span class="map-card-title">Carte — Cliquez pour positionner votre logement</span>
                </q-card-section>
                <GoogleMapCanvas :markers="ownerMarkers" :center="mapCenter" :zoom="12" :selectable="true"
                  :selected-position="selectedPosition" height="420px" @map-click="handleMapClick" />
              </q-card>

              <div class="form-actions">
                <q-btn type="submit" no-caps unelevated color="black" text-color="white" icon="add_home"
                  label="Publier le logement" :loading="saving" class="btn-submit" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </transition>

      <!-- Search and Filters Section -->
      <q-card flat class="search-card" v-if="user && user.role === 'proprietaire'">
        <q-card-section class="search-section">
          <div class="search-row">
            <q-input v-model="searchQuery" outlined dense placeholder="Rechercher par adresse, ville ou description..."
              color="black" class="search-input" clearable @update:model-value="onSearchChange">
              <template v-slot:prepend>
                <q-icon name="search" color="black" />
              </template>
            </q-input>

            <q-btn v-if="hasActiveFilters" flat no-caps color="black" icon="filter_alt_off" label="Réinitialiser"
              @click="resetFilters" class="btn-reset-filters" />
          </div>

          <div class="filters-row">
            <q-select v-model="filterType" :options="typeFilterOptionsWithAll" outlined dense placeholder="Type"
              color="black" emit-value map-options clearable class="filter-select filter-dense"
              @update:model-value="onFilterChange" />

            <q-select v-model="filterStatut" :options="statutFilterOptionsWithAll" outlined dense placeholder="Statut"
              color="black" emit-value map-options clearable class="filter-select filter-dense"
              @update:model-value="onFilterChange" />

            <q-input v-model.number="filterPrixMin" type="number" outlined dense placeholder="Prix min" color="black"
              class="filter-input filter-dense" clearable @update:model-value="onFilterChange" />

            <q-input v-model.number="filterPrixMax" type="number" outlined dense placeholder="Prix max" color="black"
              class="filter-input filter-dense" clearable @update:model-value="onFilterChange" />
          </div>
        </q-card-section>
      </q-card>



      <section class="logements-section">
        <div class="section-header">
          <h2 class="section-title">
            <q-icon name="domain" size="24px" color="black" />
            Vos propriétés
          </h2>
          <q-badge v-if="ownerLogements.length" color="black" outline :label="`${ownerLogements.length} logement(s)`" />
        </div>

        <div v-if="ownerLogements.length === 0" class="empty-state">
          <q-icon name="holiday_village" size="64px" color="grey-5" />
          <p class="empty-title">Aucun logement ajouté</p>
          <p class="empty-subtitle">Commencez par publier votre premier logement ci-dessus.</p>
        </div>

        <div v-else>
          <div class="logements-grid">
            <div v-for="item in ownerLogements" :key="item.id" class="card-wrapper">
              <router-link :to="`/logements/${item.id}`" class="card-link">
                <q-card flat class="logement-card">
                  <div class="logement-photos">
                    <q-carousel v-if="getPhotos(item).length > 0" v-model="carouselSlides[item.id]" animated swipeable
                      navigation arrows navigation-icon="circle" control-color="white" height="200px"
                      class="logement-carousel">
                      <q-carousel-slide v-for="(photo, idx) in getPhotos(item)" :key="idx" :name="idx"
                        class="carousel-slide">
                        <img :src="photo" class="carousel-img" />
                        <q-btn round flat size="xs" icon="delete" color="white" class="carousel-delete-btn"
                          @click.stop="deletePhoto(item.id, photo)">
                          <q-tooltip class="bg-black text-white">Supprimer cette photo</q-tooltip>
                        </q-btn>
                      </q-carousel-slide>
                    </q-carousel>

                    <div v-else class="no-photo-placeholder">
                      <q-icon name="image" size="48px" color="grey-5" />
                      <span>Aucune photo</span>
                    </div>

                    <q-btn v-if="getPhotos(item).length < 5" round color="white" text-color="black" icon="add_a_photo"
                      size="sm" class="upload-btn-overlay" @click.stop="triggerUpload(item.id)">
                      <q-tooltip class="bg-black text-white">Ajouter des photos ({{ 5 - getPhotos(item).length }}
                        restantes)</q-tooltip>
                    </q-btn>
                  </div>

                  <q-card-section class="logement-card-body">
                    <div class="logement-meta">
                      <q-badge :color="item.statut === 'disponible' ? 'black' : 'grey-7'" text-color="white"
                        :label="item.statut || 'disponible'" />
                      <span class="logement-type-badge">{{ item.type }}</span>
                    </div>
                    <h3 class="logement-title">{{ item.adress }}</h3>
                    <div class="logement-details">
                      <div class="detail-item">
                        <q-icon name="location_city" size="16px" />
                        <span>{{ item.ville }}</span>
                      </div>
                      <div class="detail-item">
                        <q-icon name="payments" size="16px" />
                        <span class="price-value">{{ item.prix }} DT<small>/mois</small></span>
                      </div>
                      <div v-if="item.nb_places" class="detail-item">
                        <q-icon name="group" size="16px" />
                        <span>{{ item.nb_places }} place(s)</span>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </router-link>

              <div class="card-actions">
                <q-btn round flat size="sm" icon="edit" color="black" @click="openEditDialog(item)">
                  <q-tooltip>Modifier le logement</q-tooltip>
                </q-btn>
                <q-btn round flat size="sm" icon="delete" color="red" @click="confirmDelete(item)">
                  <q-tooltip>Supprimer le logement</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>

          <!-- Load More Button -->
          <div v-if="hasMoreLogements" class="load-more-container">
            <q-btn no-caps unelevated color="black" text-color="white" icon="refresh" label="Charger plus de logements"
              :loading="loadingMore" @click="loadMoreLogements" class="btn-load-more" />
            <p class="pagination-info">
              {{ ownerLogements.length }} sur {{ pagination.total }} logement(s)
            </p>
          </div>
        </div>
      </section>

      <input ref="existingFileInput" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif"
        style="display: none" @change="handleExistingFileUpload" />

      <!-- Edit Dialog -->
      <q-dialog v-model="editDialogOpen" persistent>
        <q-card class="edit-dialog-card" style="min-width: 600px; max-width: 900px;">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">Modifier le logement</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <q-form class="logement-form" @submit.prevent="updateLogement">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">
                    <q-icon name="location_on" size="16px" />
                    Adresse
                  </label>
                  <q-input v-model="editForm.adress" placeholder="Ex: 15 Rue de la République" outlined dense
                    color="black" :rules="[requiredRule]" class="input-modern" />
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <q-icon name="location_city" size="16px" />
                    Ville
                  </label>
                  <q-input v-model="editForm.ville" placeholder="Ex: Kairouan" outlined dense color="black"
                    :rules="[requiredRule]" class="input-modern" />
                </div>
              </div>

              <div class="form-grid cols-3">
                <div class="form-group">
                  <label class="form-label">
                    <q-icon name="home_work" size="16px" />
                    Type
                  </label>
                  <q-select v-model="editForm.type" :options="typeOptions" placeholder="Choisir..." outlined dense
                    emit-value map-options color="black" :rules="[requiredRule]" class="input-modern" />
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <q-icon name="payments" size="16px" />
                    Prix mensuel (DT)
                  </label>
                  <q-input v-model.number="editForm.prix" type="number" placeholder="350" outlined dense color="black"
                    :rules="[requiredRule]" class="input-modern" />
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <q-icon name="group" size="16px" />
                    Nombre de places
                  </label>
                  <q-input v-model.number="editForm.nb_places" type="number" placeholder="2" outlined dense
                    color="black" class="input-modern" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <q-icon name="description" size="16px" />
                  Description
                </label>
                <q-input v-model="editForm.description" type="textarea" :rows="3"
                  placeholder="Décrivez votre logement: équipements, ambiance, proximité..." outlined dense
                  color="black" class="input-modern" />
              </div>

              <div class="form-group">
                <label class="form-label">
                  <q-icon name="map" size="16px" />
                  Position sur la carte
                </label>
                <div class="map-position-banner" :class="{ 'has-position': editSelectedPosition }">
                  <q-icon :name="editSelectedPosition ? 'check_circle' : 'touch_app'" size="20px" />
                  <span>{{ editPositionText }}</span>
                </div>
              </div>
              <q-card flat class="map-card">
                <q-card-section class="map-card-header">
                  <q-icon name="explore" size="24px" color="black" />
                  <span class="map-card-title">Carte — Cliquez pour positionner votre logement</span>
                </q-card-section>
                <GoogleMapCanvas :markers="ownerMarkers" :center="editMapCenter" :zoom="12" :selectable="true"
                  :selected-position="editSelectedPosition" height="420px" @map-click="handleEditMapClick" />
              </q-card>

              <div class="form-actions">
                <q-btn type="submit" no-caps unelevated color="black" text-color="white" icon="save"
                  label="Enregistrer les modifications" :loading="saving" class="btn-submit" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import GoogleMapCanvas from '@/components/maps/GoogleMapCanvas.vue'

import { useLogementsStore } from '@/stores/logements'
import { useLogementsFilters } from '@/composables/useLogementsFilters'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const logementsStore = useLogementsStore()
const { user } = storeToRefs(authStore)

// Use filters composable
const {
  searchQuery,
  filterType,
  filterStatut,
  filterPrixMin,
  filterPrixMax,
  typeFilterOptionsWithAll,
  statutFilterOptionsWithAll,
  hasActiveFilters,
  pagination,
  hasMoreLogements,
  loadingMore,
  onSearchChange,
  onFilterChange,
  resetFilters,
  loadMoreLogements,
  dispose
} = useLogementsFilters()

// Cleanup on unmount
onUnmounted(() => {
  dispose()
})

const saving = computed(() => logementsStore.saving)
const showForm = ref(false)
const isDragging = ref(false)
const pendingPhotos = ref([])
const uploadTargetId = ref(null)
const carouselSlides = reactive({})

// Form state
const editDialogOpen = ref(false)
const editingLogementId = ref(null)
const editForm = ref({
  adress: '',
  ville: '',
  type: null,
  prix: null,
  nb_places: null,
  description: '',
  latitude: null,
  longitude: null
})

const form = ref({
  adress: '',
  ville: '',
  type: null,
  prix: null,
  nb_places: null,
  description: '',
  latitude: null,
  longitude: null
})

const typeOptions = [
  { label: 'Studio', value: 'studio' },
  { label: 'Appartement', value: 'appartement' },
  { label: 'Maison', value: 'maison' },
  { label: 'Chambre', value: 'chambre' }
]

const requiredRule = (val) => !!val || 'Champ obligatoire'

const ownerLogements = computed(() => logementsStore.items)
const ownerMarkers = computed(() => {
  return ownerLogements.value
    .map((item) => ({
      lat: Number(item.latitude),
      lng: Number(item.longitude),
      title: `${item.type} - ${item.ville}`,
      info: `<div><strong>${item.type}</strong><br/>${item.adress}<br/>${item.prix} DT / mois</div>`
    }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
})

const selectedPosition = computed(() => {
  if (!Number.isFinite(form.value.latitude) || !Number.isFinite(form.value.longitude)) return null
  return { lat: form.value.latitude, lng: form.value.longitude }
})

const mapCenter = computed(() => {
  if (selectedPosition.value) return selectedPosition.value
  if (ownerMarkers.value.length > 0) {
    return { lat: ownerMarkers.value[0].lat, lng: ownerMarkers.value[0].lng }
  }
  return { lat: 36.8065, lng: 10.1815 }
})

const positionText = computed(() => {
  if (!selectedPosition.value) return 'Cliquez sur la carte ci-dessous pour choisir la position.'
  return `${form.value.latitude.toFixed(6)}, ${form.value.longitude.toFixed(6)}`
})

// Edit dialog computed properties
const editSelectedPosition = computed(() => {
  if (!Number.isFinite(editForm.value.latitude) || !Number.isFinite(editForm.value.longitude)) return null
  return { lat: editForm.value.latitude, lng: editForm.value.longitude }
})

const editMapCenter = computed(() => {
  if (editSelectedPosition.value) return editSelectedPosition.value
  if (ownerMarkers.value.length > 0) {
    return { lat: ownerMarkers.value[0].lat, lng: ownerMarkers.value[0].lng }
  }
  return { lat: 36.8065, lng: 10.1815 }
})

const editPositionText = computed(() => {
  if (!editSelectedPosition.value) return 'Cliquez sur la carte ci-dessous pour choisir la position.'
  return `${editForm.value.latitude.toFixed(6)}, ${editForm.value.longitude.toFixed(6)}`
})

function getPhotos(item) {
  if (!item.photos) return []
  if (typeof item.photos === 'string') {
    try { return JSON.parse(item.photos) } catch { return [] }
  }
  return Array.isArray(item.photos) ? item.photos : []
}

function handleMapClick(position) {
  form.value.latitude = Number(position.lat)
  form.value.longitude = Number(position.lng)
}

function handleEditMapClick(position) {
  editForm.value.latitude = Number(position.lat)
  editForm.value.longitude = Number(position.lng)
}

function openEditDialog(item) {
  editingLogementId.value = item.id
  editForm.value = {
    adress: item.adress || '',
    ville: item.ville || '',
    type: item.type || null,
    prix: Number(item.prix) || null,
    nb_places: Number(item.nb_places) || null,
    description: item.description || '',
    latitude: Number(item.latitude) || null,
    longitude: Number(item.longitude) || null
  }
  editDialogOpen.value = true
}

async function updateLogement() {
  if (!editingLogementId.value) return

  if (!Number.isFinite(editForm.value.latitude) || !Number.isFinite(editForm.value.longitude)) {
    $q.notify({ message: 'Veuillez choisir une position sur la carte.', color: 'black', position: 'top' })
    return
  }

  try {
    const payload = {
      adress: editForm.value.adress,
      ville: editForm.value.ville,
      latitude: editForm.value.latitude,
      longitude: editForm.value.longitude,
      type: editForm.value.type,
      prix: editForm.value.prix,
      nb_places: editForm.value.nb_places,
      description: editForm.value.description
    }

    await logementsStore.update(editingLogementId.value, payload)

    $q.notify({ message: 'Logement modifié avec succès !', color: 'black', position: 'top', icon: 'check' })
    editDialogOpen.value = false
    await fetchLogements()
  } catch (err) {
    $q.notify({ message: err.message || 'Erreur lors de la modification.', color: 'black', position: 'top' })
  }
}

async function confirmDelete(item) {
  $q.dialog({
    title: 'Confirmer la suppression',
    message: `Êtes-vous sûr de vouloir supprimer ce logement à ${item.adress} ?`,
    cancel: true,
    persistent: true,
    color: 'black'
  }).onOk(async () => {
    try {
      const authStore = useAuthStore()
      const response = await fetch(`/api/logements/${item.id}`, {
        method: 'DELETE',
        headers: authStore.authHeader
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur de suppression')
      }

      $q.notify({ message: 'Logement supprimé avec succès.', color: 'black', position: 'top' })
      await fetchLogements()
    } catch (err) {
      $q.notify({ message: err.message || 'Erreur lors de la suppression.', color: 'black', position: 'top' })
    }
  })
}

function addFiles(files) {
  const remaining = 5 - pendingPhotos.value.length
  const toAdd = Array.from(files).slice(0, remaining)

  for (const file of toAdd) {
    if (!file.type.startsWith('image/')) continue
    if (file.size > 5 * 1024 * 1024) {
      $q.notify({ message: `${file.name} dépasse 5 Mo.`, color: 'black', position: 'top' })
      continue
    }
    pendingPhotos.value.push({ file, preview: URL.createObjectURL(file) })
  }

  if (pendingPhotos.value.length >= 5 && Array.from(files).length > remaining) {
    $q.notify({ message: 'Maximum 5 images autorisées.', color: 'black', position: 'top' })
  }
}

function handleFileSelect(event) {
  addFiles(event.target.files)
  event.target.value = ''
}

function handleDrop(event) {
  isDragging.value = false
  if (pendingPhotos.value.length >= 5) return
  addFiles(event.dataTransfer.files)
}

function removePendingPhoto(index) {
  URL.revokeObjectURL(pendingPhotos.value[index].preview)
  pendingPhotos.value.splice(index, 1)
}

function triggerUpload(logementId) {
  uploadTargetId.value = logementId
  const el = document.querySelector('.mes-logements-page input[type="file"][style*="none"]:last-of-type')
  if (el) { el.click() }
}

async function handleExistingFileUpload(event) {
  const files = event.target.files
  if (!files.length || !uploadTargetId.value) return

  const id = uploadTargetId.value

  try {
    await logementsStore.uploadPhotos(id, Array.from(files).slice(0, 5))

    $q.notify({ message: 'Photos ajoutées !', color: 'black', position: 'top' })
    await fetchLogements()
  } catch (err) {
    $q.notify({ message: err.message || "Erreur d'upload.", color: 'black', position: 'top' })
  } finally {
    event.target.value = ''
    uploadTargetId.value = null
  }
}

async function deletePhoto(logementId, photoUrl) {
  try {
    await logementsStore.deletePhoto(logementId, photoUrl)

    $q.notify({ message: 'Photo supprimée.', color: 'black', position: 'top' })
    await fetchLogements()
  } catch (err) {
    $q.notify({ message: err.message || 'Erreur de suppression.', color: 'black', position: 'top' })
  }
}

async function fetchLogements(append = false) {
  try {
    const currentPage = append ? logementsStore.pagination.page + 1 : 1
    await logementsStore.fetchMine(currentPage, append)

    for (const item of logementsStore.items) {
      if (!(item.id in carouselSlides)) {
        carouselSlides[item.id] = 0
      }
    }
  } catch (err) {
    console.error(err)
    if (!append) {
      logementsStore.items = []
    }
  }
}

async function createLogement() {
  if (!user.value?.id) return

  if (!Number.isFinite(form.value.latitude) || !Number.isFinite(form.value.longitude)) {
    $q.notify({ message: 'Veuillez choisir une position sur la carte.', color: 'black', position: 'top' })
    return
  }

  try {
    const payload = {
      proprietaire_id: user.value.id,
      adress: form.value.adress,
      ville: form.value.ville,
      latitude: form.value.latitude,
      longitude: form.value.longitude,
      type: form.value.type,
      prix: form.value.prix,
      nb_places: form.value.nb_places,
      description: form.value.description
    }

    const data = await logementsStore.create(payload)

    const newId = data.id

    if (pendingPhotos.value.length > 0 && newId) {
      try {
        await logementsStore.uploadPhotos(newId, pendingPhotos.value.map((p) => p.file))
      } catch (uploadErr) {
        console.warn('Photo upload warning:', uploadErr.message)
      }
    }

    $q.notify({ message: 'Logement publié avec succès !', color: 'black', position: 'top', icon: 'check' })

    for (const p of pendingPhotos.value) URL.revokeObjectURL(p.preview)
    pendingPhotos.value = []
    form.value = { adress: '', ville: '', type: null, prix: null, nb_places: null, description: '', latitude: null, longitude: null }
    showForm.value = false

    await fetchLogements()
  } catch (err) {
    $q.notify({ message: err.message || 'Erreur lors de la création.', color: 'black', position: 'top' })
  }
}

onMounted(async () => {
  const valid = await authStore.fetchProfile()
  if (!valid) {
    router.replace('/auth/login')
    return
  }

  if (user.value?.role !== 'proprietaire') {
    $q.notify({ message: 'Cette page est réservée aux propriétaires.', color: 'black', position: 'top' })
    router.replace('/')
    return
  }

  await fetchLogements()
})
</script>

<style scoped>
/* ═══════════ PAGE LAYOUT ═══════════ */
.mes-logements-page {
  background: #ffffff;
  min-height: 100vh;
}

.page-container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 16px 64px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* ═══════════ HEADER ═══════════ */
.page-header {
  padding: 12px 0;
  border-bottom: 2px solid #000000;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 16px;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: #000000;
  margin: 0;
  letter-spacing: -0.03em;
  text-transform: uppercase;
}

.page-subtitle {
  margin: 4px 0 0;
  color: #666666;
  font-size: 0.95rem;
  font-weight: 500;
}

.btn-add-logement {
  border-radius: 4px !important;
  padding: 10px 24px !important;
  font-weight: 700;
  letter-spacing: 0.02em;
  border: 2px solid #000000;
}

/* ═══════════ FORM CARD ═══════════ */
.form-card {
  border-radius: 4px !important;
  border: 2px solid #000000 !important;
  background: #ffffff;
}

.form-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px !important;
  background: #f9f9f9;
  border-bottom: 2px solid #000000;
}

.form-card-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.logement-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px;
}

/* ═══════════ FORM GRID ═══════════ */
.form-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.form-grid.cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 768px) {

  .form-grid,
  .form-grid.cols-3 {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.photo-counter {
  margin-left: auto;
  font-size: 0.8rem;
  font-weight: 700;
  color: #666666;
}

.input-modern :deep(.q-field__control) {
  border-radius: 0px !important;
  border: 1px solid #000000;
}

/* ═══════════ DROPZONE ═══════════ */
.dropzone {
  border: 2px dashed #999999;
  border-radius: 4px;
  padding: 32px 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropzone:hover {
  border-color: #000000;
  background: #f9f9f9;
}

.dropzone-active {
  border-style: solid;
  border-color: #000000 !important;
  background: #f0f0f0 !important;
}

.dropzone-full {
  cursor: default;
  opacity: 0.8;
}

.dropzone-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.dropzone-text {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #000000;
}

.dropzone-link {
  color: #000000;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.dropzone-hint {
  margin: 0;
  font-size: 0.8rem;
  color: #666666;
}

/* ═══════════ PREVIEW GRID ═══════════ */
.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  width: 100%;
}

.preview-item {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 1;
  background: #e0e0e0;
  border: 1px solid #000000;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, transparent 40%);
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  justify-content: flex-end;
  padding: 8px;
}

.preview-item:hover .preview-overlay {
  opacity: 1;
}

.preview-remove-btn {
  background: #000000 !important;
  border: 1px solid #ffffff !important;
  width: 28px !important;
  height: 28px !important;
}

.preview-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #000000;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 8px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.preview-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border: 2px dashed #999999;
  background: transparent;
  transition: all 0.2s;
}

.preview-add:hover {
  border-color: #000000;
  background: #f9f9f9;
}

.add-label {
  font-size: 0.8rem;
  color: #000000;
  font-weight: 700;
  text-transform: uppercase;
}

/* ═══════════ MAP POSITION BANNER ═══════════ */
.map-position-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: 4px;
  background: #f5f5f5;
  border: 1px solid #cccccc;
  color: #333333;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;
}

.map-position-banner.has-position {
  background: #ffffff;
  border: 2px solid #000000;
  color: #000000;
}

/* ═══════════ FORM ACTIONS ═══════════ */
.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.btn-submit {
  border-radius: 4px !important;
  padding: 12px 32px !important;
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  border: 2px solid #000000;
}

/* ═══════════ MAP CARD ═══════════ */
.map-card {
  border-radius: 4px !important;
  overflow: hidden;
  border: 2px solid #000000 !important;
  background: #ffffff;
}

.map-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px !important;
  border-bottom: 2px solid #000000;
  background: #f9f9f9;
}

.map-card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #000000;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ═══════════ SEARCH CARD ═══════════ */
.search-card {
  border-radius: 4px !important;
  border: 2px solid #000000 !important;
  background: #ffffff;
  margin-bottom: 16px;
}

.search-section {
  padding: 20px 24px !important;
}

.search-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
}

.search-input :deep(.q-field__control) {
  border-radius: 0px !important;
  border: 1px solid #000000;
}

.btn-reset-filters {
  border-radius: 4px !important;
  padding: 8px 16px !important;
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  border: 2px solid #000000;
  white-space: nowrap;
}

.filters-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  min-width: 160px;
  flex: 1;
}

.filter-select :deep(.q-field__control) {
  border-radius: 0px !important;
  border: 1px solid #000000;
}

.filter-dense :deep(.q-field__control) {
  min-height: 36px !important;
  padding: 2px 8px !important;
}

.filter-dense :deep(.q-field__control .q-field__label) {
  font-size: 0.8rem;
}

.filter-dense :deep(.q-field__append) {
  padding: 4px !important;
}

.filter-input {
  min-width: 120px;
  flex: 1;
  max-width: 140px;
}

.filter-input :deep(.q-field__control) {
  border-radius: 0px !important;
  border: 1px solid #000000;
}

@media (max-width: 768px) {
  .search-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filters-row {
    flex-direction: column;
  }

  .filter-select,
  .filter-input {
    max-width: 100%;
  }
}

/* ═══════════ LOGEMENTS SECTION ═══════════ */
.logements-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.4rem;
  font-weight: 800;
  color: #000000;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* ═══════════ EMPTY STATE ═══════════ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 24px;
  text-align: center;
  border: 2px dashed #cccccc;
  background: #f9f9f9;
}

.empty-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #000000;
}

.empty-subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: #666666;
}

/* ═══════════ LOAD MORE BUTTON ═══════════ */
.load-more-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 24px;
  margin-top: 16px;
  border-top: 2px solid #f0f0f0;
}

.btn-load-more {
  border-radius: 4px !important;
  padding: 12px 32px !important;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  border: 2px solid #000000;
  min-width: 280px;
}

.pagination-info {
  margin: 0;
  font-size: 0.85rem;
  color: #666666;
  font-weight: 500;
}

/* ═══════════ LOGEMENTS GRID ═══════════ */
.logements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.card-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 8px;
}

.card-link {
  text-decoration: none;
}

@media (max-width: 700px) {
  .logements-grid {
    grid-template-columns: 1fr;
  }
}

.logement-card {
  border-radius: 4px !important;
  overflow: hidden;
  border: 2px solid #000000 !important;
  background: #ffffff;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.logement-card:hover {
  transform: translateY(-4px);
  box-shadow: 6px 6px 0px #000000 !important;
}

/* ═══════════ LOGEMENT PHOTOS ═══════════ */
.logement-photos {
  position: relative;
  height: 220px;
  background: #e0e0e0;
  border-bottom: 2px solid #000000;
}

.logement-carousel {
  border-radius: 0 !important;
}

.carousel-slide {
  padding: 0 !important;
}

.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(0%);
  /* Optional: Make images B&W as well if needed, omitted here to preserve user image content */
}

.carousel-delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #000000 !important;
  border: 1px solid #ffffff !important;
  opacity: 0;
  transition: opacity 0.2s;
}

.carousel-slide:hover .carousel-delete-btn {
  opacity: 1;
}

.no-photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: #666666;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
}

.upload-btn-overlay {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 2;
  border: 2px solid #000000 !important;
}

/* ═══════════ LOGEMENT CARD BODY ═══════════ */
.logement-card-body {
  padding: 20px 24px !important;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.logement-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logement-type-badge {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #000000;
  background: #f0f0f0;
  padding: 4px 10px;
  border: 1px solid #000000;
}

.logement-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #000000;
  line-height: 1.4;
}

.logement-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid #eeeeee;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #333333;
  font-weight: 500;
}

.price-value {
  font-weight: 800;
  color: #000000;
}

.price-value small {
  font-weight: 500;
  color: #666666;
}

/* ═══════════ FORM TRANSITION ═══════════ */
.slide-form-enter-active,
.slide-form-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: top;
}

.slide-form-enter-from,
.slide-form-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}

.slide-form-enter-to,
.slide-form-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 2000px;
}
</style>
