/**
 * Build URL query parameters from filters object
 * @param {Object} filters - The filters object
 * @param {Object} pagination - The pagination object
 * @returns {URLSearchParams} URLSearchParams instance
 */
export function buildQuery(filters, pagination = null) {
  const params = new URLSearchParams()

  const q = filters.q?.trim()
  if (q) params.append('q', q)

  if (filters.ville) params.append('ville', filters.ville)
  else if (!q) params.append('all_villes', '1')

  if (filters.types?.length) params.append('types', filters.types.join(','))
  if (filters.budget_min) params.append('budget_min', String(filters.budget_min))
  if (filters.budget_max) params.append('budget_max', String(filters.budget_max))
  if (filters.nb_places_min) params.append('nb_places_min', String(filters.nb_places_min))
  if (filters.universite?.trim()) params.append('universite', filters.universite.trim())
  if (filters.adress?.trim()) params.append('adress', filters.adress.trim())

  // Add pagination params if provided
  if (pagination) {
    params.append('page', String(pagination.page))
    params.append('limit', String(pagination.limit))
  }

  return params
}
