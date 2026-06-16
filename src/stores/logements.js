import { defineStore, acceptHMRUpdate } from 'pinia'
import { useAuthStore } from './auth'

export const useLogementsStore = defineStore('logements', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    pagination: {
      page: 1,
      limit: 6,
      total: 0,
      totalPages: 0,
      hasMore: false
    },
    filters: {
      q: '',
      type: null,
      statut: null,
      ville: null,
      prix_min: null,
      prix_max: null
    }
  }),

  actions: {
    getAuthHeaders(contentType = 'application/json') {
      const authStore = useAuthStore()
      return contentType
        ? { 'Content-Type': contentType, ...authStore.authHeader }
        : { ...authStore.authHeader }
    },

    async fetchMine(page = 1, append = false, customFilters = null) {
      this.loading = true
      try {
        // Update filters if provided
        if (customFilters) {
          this.filters = { ...this.filters, ...customFilters }
        }

        // Build query params
        const params = new URLSearchParams({
          page: page.toString(),
          limit: this.pagination.limit.toString()
        })

        // Add filters to params
        Object.entries(this.filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            params.append(key, value.toString())
          }
        })

        const response = await fetch(`/api/logements/me?${params.toString()}`, {
          headers: this.getAuthHeaders(null)
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Erreur de récupération.')
        
        if (append) {
          // Append new items to existing list
          this.items = [...this.items, ...(data.logements || [])]
        } else {
          // Replace all items (first page or refresh)
          this.items = Array.isArray(data.logements) ? data.logements : []
        }
        
        // Update pagination and filters info
        this.pagination = data.pagination || this.pagination
        if (data.filters) {
          this.filters = { ...this.filters, ...data.filters }
        }
        
        return this.items
      } finally {
        this.loading = false
      }
    },

    async fetchMore() {
      if (!this.pagination.hasMore || this.loading) return
      
      const nextPage = this.pagination.page + 1
      await this.fetchMine(nextPage, true)
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
    },

    resetFilters() {
      this.filters = {
        q: '',
        type: null,
        statut: null,
        ville: null,
        prix_min: null,
        prix_max: null
      }
    },

    async create(payload) {
      this.saving = true
      try {
        const response = await fetch('/api/logements', {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Erreur lors de la création.')
        return data
      } finally {
        this.saving = false
      }
    },

    async uploadPhotos(logementId, files) {
      const formData = new FormData()
      files.forEach((file) => formData.append('photos', file))

      const response = await fetch(`/api/logements/${logementId}/photos`, {
        method: 'POST',
        headers: this.getAuthHeaders(null),
        body: formData
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Erreur d'upload.")
      return data
    },

    async deletePhoto(logementId, photoUrl) {
      const response = await fetch(`/api/logements/${logementId}/photos`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ url: photoUrl })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur de suppression.')
      return data
    },

    async update(logementId, payload) {
      this.saving = true
      try {
        const response = await fetch(`/api/logements/${logementId}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Erreur lors de la mise à jour.')
        return data
      } finally {
        this.saving = false
      }
    }
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLogementsStore, import.meta.hot))
}
