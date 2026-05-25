import { defineStore, acceptHMRUpdate } from 'pinia'
import { useAuthStore } from './auth'

export const useLogementsStore = defineStore('logements', {
    state: () => ({
        items: [],
        loading: false,
        saving: false,
    }),

    actions: {
        getAuthHeaders(contentType = 'application/json') {
            const authStore = useAuthStore()
            return contentType
                ? { 'Content-Type': contentType, ...authStore.authHeader }
                : { ...authStore.authHeader }
        },

        async fetchMine() {
            this.loading = true
            try {
                const response = await fetch('/api/logements/me', {
                    headers: this.getAuthHeaders(null)
                })
                const data = await response.json()
                if (!response.ok) throw new Error(data.error || 'Erreur de récupération.')
                this.items = Array.isArray(data) ? data : []
                return this.items
            } finally {
                this.loading = false
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
        }
    },
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useLogementsStore, import.meta.hot))
}
