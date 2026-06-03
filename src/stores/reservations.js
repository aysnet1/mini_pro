import { defineStore, acceptHMRUpdate } from 'pinia'
import { useAuthStore } from './auth'

export const useReservationsStore = defineStore('reservations', {
    state: () => ({
        items: [],
        ownerItems: [],
        loading: false,
        saving: false,
        error: ''
    }),

    getters: {
        sortedItems: (state) => {
            return [...state.items].sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut))
        },
        sortedOwnerItems: (state) => {
            return [...state.ownerItems].sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut))
        }
    },

    actions: {
        getAuthHeaders(contentType = 'application/json') {
            const authStore = useAuthStore()
            return contentType
                ? { 'Content-Type': contentType, ...authStore.authHeader }
                : { ...authStore.authHeader }
        },

        async reserve(payload) {
            this.saving = true
            this.error = ''
            try {
                const response = await fetch('/api/reservations', {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(payload)
                })

                const data = await response.json().catch(() => ({}))
                if (!response.ok) throw new Error(data.error || 'Erreur lors de la réservation.')

                await this.fetchMine()
                return data
            } catch (err) {
                this.error = err.message || 'Erreur lors de la réservation.'
                throw err
            } finally {
                this.saving = false
            }
        },

        async fetchMine() {
            this.loading = true
            this.error = ''
            try {
                const response = await fetch('/api/reservations/me', {
                    headers: this.getAuthHeaders(null)
                })

                const data = await response.json().catch(() => ([]))
                if (!response.ok) throw new Error(data.error || 'Erreur de récupération des réservations.')

                this.items = Array.isArray(data) ? data : []
                return this.items
            } catch (err) {
                this.error = err.message || 'Erreur de récupération des réservations.'
                throw err
            } finally {
                this.loading = false
            }
        },

        async cancel(logementId) {
            this.saving = true
            this.error = ''
            try {
                const response = await fetch(`/api/reservations/${logementId}`, {
                    method: 'DELETE',
                    headers: this.getAuthHeaders(null)
                })

                const data = await response.json().catch(() => ({}))
                if (!response.ok) throw new Error(data.error || "Erreur lors de l'annulation.")

                await this.fetchMine()
                return data
            } catch (err) {
                this.error = err.message || "Erreur lors de l'annulation."
                throw err
            } finally {
                this.saving = false
            }
        },

        async fetchOwnerReservations() {
            this.loading = true
            this.error = ''
            try {
                const response = await fetch('/api/reservations/owner/me', {
                    headers: this.getAuthHeaders(null)
                })

                const data = await response.json().catch(() => ([]))
                if (!response.ok) throw new Error(data.error || 'Erreur de recuperation des demandes proprietaire.')

                this.ownerItems = Array.isArray(data) ? data : []
                return this.ownerItems
            } catch (err) {
                this.error = err.message || 'Erreur de recuperation des demandes proprietaire.'
                throw err
            } finally {
                this.loading = false
            }
        },

        async decideReservation(logementId, etudiantId, statut, note_proprietaire = '') {
            this.saving = true
            this.error = ''
            try {
                const response = await fetch(`/api/reservations/${logementId}/etudiant/${etudiantId}/status`, {
                    method: 'PATCH',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({ statut, note_proprietaire })
                })

                const data = await response.json().catch(() => ({}))
                if (!response.ok) throw new Error(data.error || 'Erreur lors de la mise a jour du statut.')

                await this.fetchOwnerReservations()
                return data
            } catch (err) {
                this.error = err.message || 'Erreur lors de la mise a jour du statut.'
                throw err
            } finally {
                this.saving = false
            }
        }
    }
})

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useReservationsStore, import.meta.hot))
}
