<template>
  <div class="map-wrapper">
    <div v-if="error" class="map-error">
      {{ error }}
    </div>
    <div v-else ref="mapEl" class="map-canvas" :style="{ height }"></div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  apiKey: {
    type: String,
    default: ''
  },
  center: {
    type: Object,
    default: () => ({ lat: 36.8065, lng: 10.1815 })
  },
  zoom: {
    type: Number,
    default: 12
  },
  markers: {
    type: Array,
    default: () => []
  },
  activeMarkerId: {
    type: [String, Number],
    default: null
  },
  fitToMarkers: {
    type: Boolean,
    default: false
  },
  maxAutoZoom: {
    type: Number,
    default: 10
  },
  selectable: {
    type: Boolean,
    default: false
  },
  selectedPosition: {
    type: Object,
    default: null
  },
  height: {
    type: String,
    default: '420px'
  }
})

const emit = defineEmits(['map-click', 'marker-click'])

const mapEl = ref(null)
const error = ref('')

let map = null
let markerInstances = []
let selectedMarker = null
let loaderPromise = null

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps)
  }

  if (loaderPromise) {
    return loaderPromise
  }

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=beta`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('Impossible de charger Google Maps API.'))
    document.head.appendChild(script)
  })

  return loaderPromise
}

function clearMarkers() {
  markerInstances.forEach((markerObj) => {
    if (markerObj.marker) {
      markerObj.marker.map = null
    }
    if (markerObj.infoWindow) {
      markerObj.infoWindow.close()
    }
  })
  markerInstances = []
}

function fitMapToMarkers() {
  if (!map || !window.google?.maps) return
  if (!props.fitToMarkers || props.markers.length === 0) return

  if (props.markers.length === 1) {
    const item = props.markers[0]
    if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
      map.setCenter({ lat: item.lat, lng: item.lng })
      map.setZoom(props.maxAutoZoom)
    }
    return
  }

  const bounds = new window.google.maps.LatLngBounds()
  props.markers.forEach((item) => {
    if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
      bounds.extend({ lat: item.lat, lng: item.lng })
    }
  })

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds)
    window.google.maps.event.addListenerOnce(map, 'idle', () => {
      if (map.getZoom() > props.maxAutoZoom) {
        map.setZoom(props.maxAutoZoom)
      }
    })
  }
}

function renderMarkers() {
  if (!map || !window.google?.maps) return

  clearMarkers()

  props.markers.forEach((item) => {
    if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) return

    const isActive = props.activeMarkerId !== null && String(props.activeMarkerId) === String(item.id)
    const marker = new window.google.maps.Marker({
      map,
      position: { lat: item.lat, lng: item.lng },
      title: item.title || 'Logement',
      label: item.priceLabel
        ? {
          text: item.priceLabel,
          color: isActive ? '#ffffff' : '#0f172a',
          fontWeight: '500',
          fontSize: '12px'
        }
        : null,
      icon: item.priceLabel
        ? {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isActive ? 24 : 21,
          fillColor: isActive ? '#0f172a' : '#ffffff',
          fillOpacity: 1,
          strokeColor: '#0f172a',
          strokeWeight: 1.5
        }
        : undefined,
      zIndex: isActive ? 999 : 1
    })

    if (item.info) {
      const infoWindow = new window.google.maps.InfoWindow({ content: item.info })
      marker.addListener('click', () => infoWindow.open({ anchor: marker, map }))
    }

    marker.addListener('click', () => {
      emit('marker-click', item)
    })

    markerInstances.push(marker)
  })
}

function renderSelectedMarker() {
  if (!map || !window.google?.maps || !props.selectable) return

  if (selectedMarker) {
    selectedMarker.setMap(null)
    selectedMarker = null
  }

  if (!props.selectedPosition) return

  const { lat, lng } = props.selectedPosition
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

  selectedMarker = new window.google.maps.Marker({
    map,
    position: { lat, lng },
    title: 'Position choisie'
  })
}

onMounted(async () => {
  try {
    const key = props.apiKey || process.env.GOOGLE_MAPS_API_KEY
    if (!key) {
      error.value = 'Ajoutez GOOGLE_MAPS_API_KEY dans votre .env pour afficher la carte.'
      return
    }

    await loadGoogleMaps(key)

    map = new window.google.maps.Map(mapEl.value, {
      center: props.center,
      zoom: props.zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    })

    if (props.selectable) {
      map.addListener('click', (event) => {
        const lat = event.latLng?.lat()
        const lng = event.latLng?.lng()
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
        emit('map-click', { lat, lng })
      })
    }

    renderMarkers()
    fitMapToMarkers()
    renderSelectedMarker()
  } catch (err) {
    error.value = err.message || 'Erreur lors du chargement de la carte.'
  }
})

watch(
  () => props.markers,
  () => {
    renderMarkers()
    fitMapToMarkers()
  },
  { deep: true }
)

watch(
  () => props.activeMarkerId,
  () => {
    renderMarkers()
  }
)

watch(
  () => props.selectedPosition,
  () => {
    renderSelectedMarker()
  },
  { deep: true }
)

watch(
  () => props.center,
  (center) => {
    if (!map || !center) return
    map.setCenter(center)
  },
  { deep: true }
)
</script>

<style scoped>
.map-wrapper {
  width: 100%;
}

.map-canvas {
  width: 100%;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #e2e8f0;
}

.map-error {
  padding: 0.9rem;
  border-radius: 12px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.92rem;
}
</style>
