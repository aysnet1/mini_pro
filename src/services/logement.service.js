import { safeJsonParse } from '@/utils/safeJsonParse'

/**
 * Normalize logement data from API
 * @param {Object} logement - Raw logement data
 * @returns {Object} Normalized logement data
 */
export function normalizeLogement(logement) {
  return {
    ...logement,
    latitude: logement.latitude == null ? null : Number(logement.latitude),
    longitude: logement.longitude == null ? null : Number(logement.longitude),
    prix: logement.prix == null ? null : Number(logement.prix),
    nb_places: logement.nb_places == null ? null : Number(logement.nb_places),
    equipemens: safeJsonParse(logement.equipemens, []),
    photos: safeJsonParse(logement.photos, [])
  }
}

/**
 * Fetch logements from API with filters and pagination
*/
export async function fetchLogementsApi(params) {
  const queryString = params.toString()
  const response = await fetch(`/api/logements?${queryString}`)

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Erreur lors de la recherche.')
  }

  const data = await response.json()

  return {
    logements: (Array.isArray(data.logements) ? data.logements : []).map(normalizeLogement),
    pagination: data.pagination || null,
    contexte: data.contexte || { filtreVille: null, universite: null, message: '' }
  }
}

/**
 * Logement service object
 */
export const logementService = {
  normalizeLogement,
  fetchLogementsApi
}
