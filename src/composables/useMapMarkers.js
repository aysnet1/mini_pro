import { computed } from 'vue'
import { escapeHtml } from '@/utils/escapeHtml'

/**
 * Composable for generating Google Maps markers from logements
 * @param {Object} logements - Reactive logements ref
 * @returns {Object} Map markers computed property and helpers
 */
export function useMapMarkers(logements) {
  function capitalize(text) {
    if (!text) return 'Logement'
    return `${text}`.charAt(0).toUpperCase() + `${text}`.slice(1)
  }

  function getPrimaryImage(logement) {
    try {
      const photos = typeof logement.photos === 'string'
        ? JSON.parse(logement.photos)
        : logement.photos
      if (Array.isArray(photos) && photos[0]) return photos[0]
    } catch {
      // noop
    }
    return 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
  }

  function buildMapCardHtml(logement) {
    const imageUrl = escapeHtml(getPrimaryImage(logement))
    const title = escapeHtml(`${capitalize(logement.type)} · ${logement.ville || ''}`)
    const address = escapeHtml(logement.adress || 'Adresse non renseignée')
    const status = escapeHtml(logement.statut || 'Disponible')
    const places = Number(logement.nb_places || 1)
    const price = Number(logement.prix || 0)

    return `
      <div style="width:280px;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 12px 30px rgba(15,23,42,.18);font-family:Inter,Segoe UI,Arial,sans-serif;">
        <div style="height:160px;background:#e5e7eb;">
          <img src="${imageUrl}" alt="Logement" style="width:100%;height:100%;object-fit:cover;display:block;" />
        </div>
        <div style="padding:12px 14px 14px;">
          <p style="margin:0 0 4px;font-size:20px;line-height:1.2;font-weight:700;color:#0f172a;">${title}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#475569;line-height:1.35;">${address}</p>
          <p style="margin:0 0 10px;font-size:12px;color:#0f766e;font-weight:700;">${places} place(s) · ${status}</p>
          <div style="display:flex;align-items:baseline;gap:6px;">
            <span style="font-size:22px;font-weight:800;color:#111827;">${price} DT</span>
            <span style="font-size:12px;color:#64748b;">/ mois</span>
          </div>
        </div>
      </div>
    `
  }

  const mapMarkers = computed(() => {
    if (!logements.value || !Array.isArray(logements.value)) {
      return []
    }

    return logements.value
      .map((item) => {
        const lat = Number(item.latitude)
        const lng = Number(item.longitude)

        // Skip if coordinates are invalid
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null
        }

        return {
          id: item.id,
          lat,
          lng,
          title: `${capitalize(item.type)} · ${item.ville}`,
          priceLabel: `${Number(item.prix || 0)} DT`,
          info: buildMapCardHtml(item)
        }
      })
      .filter(Boolean) // Remove null entries
  })

  const mapCenter = computed(() => {
    if (mapMarkers.value.length > 0) {
      return { lat: mapMarkers.value[0].lat, lng: mapMarkers.value[0].lng }
    }
    return { lat: 36.8065, lng: 10.1815 } // Default: Tunis
  })

  return {
    mapMarkers,
    mapCenter,
    buildMapCardHtml
  }
}
