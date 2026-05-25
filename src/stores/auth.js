import { defineStore } from 'pinia'
import { LocalStorage } from 'quasar'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: LocalStorage.getItem('user_profile') || null,
    token: LocalStorage.getItem('auth_token') || null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role || null,
    fullName: (state) => {
      if (!state.user) return ''
      return `${state.user.prenom} ${state.user.nom}`
    },
    authHeader: (state) => state.token ? { Authorization: `Bearer ${state.token}` } : {}
  },

  actions: {
    decodeJwtPayload(token) {
      if (!token) return null
      try {
        const payloadBase64 = token.split('.')[1]
        if (!payloadBase64) return null
        const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          atob(normalized)
            .split('')
            .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
            .join('')
        )
        return JSON.parse(jsonPayload)
      } catch {
        return null
      }
    },

    setAuthToken(token) {
      this.token = token || null
      if (token) {
        LocalStorage.set('auth_token', token)
      } else {
        LocalStorage.remove('auth_token')
      }
    },

    async login(email, mot_de_passe) {
      this.loading = true
      this.error = null
      try {
        const response = await fetch('/api/users/signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, mot_de_passe })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erreur de connexion')
        }

        if (!data.token) {
          throw new Error('Token JWT manquant dans la réponse serveur')
        }

        this.user = data.user
        LocalStorage.set('user_profile', data.user)
        this.setAuthToken(data.token)

        // Fetch full profile info (including role-specific details) immediately after login
        await this.fetchProfile()

        return this.user
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async register(userData) {
      this.loading = true
      this.error = null
      try {
        const response = await fetch('/api/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors de l'inscription")
        }

        if (!data.token) {
          throw new Error('Token JWT manquant dans la réponse serveur')
        }

        // Auto-login: store user data from register response
        this.user = data.user
        LocalStorage.set('user_profile', data.user)
        this.setAuthToken(data.token)

        // Fetch full profile info
        await this.fetchProfile()

        return data
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      try {
        await fetch('/api/users/logout', {
          method: 'POST',
          headers: {
            ...this.authHeader
          }
        })
      } catch (err) {
        console.error('Erreur lors de la déconnexion backend', err)
      } finally {
        this.user = null
        this.error = null
        this.loading = false
        LocalStorage.remove('user_profile')
        this.setAuthToken(null)
      }
    },

    async fetchProfile() {
      if (!this.token) {
        const storedToken = LocalStorage.getItem('auth_token')
        if (storedToken) {
          this.token = storedToken
        }
      }

      if (!this.user) {
        const storedUser = LocalStorage.getItem('user_profile')
        if (storedUser) {
          this.user = storedUser
        }
      }

      if (!this.token) {
        return false
      }

      let userId = this.user?.id
      if (!userId) {
        const tokenPayload = this.decodeJwtPayload(this.token)
        if (tokenPayload?.id) {
          userId = tokenPayload.id
          this.user = {
            ...(this.user || {}),
            id: userId,
            email: tokenPayload.email || this.user?.email || '',
            role: tokenPayload.role || this.user?.role || ''
          }
          LocalStorage.set('user_profile', this.user)
        }
      }

      if (!userId) {
        this.user = null
        LocalStorage.remove('user_profile')
        this.setAuthToken(null)
        return false
      }

      try {
        const response = await fetch(`/api/users/${userId}`, {
          headers: {
            ...this.authHeader
          }
        })

        if (response.status === 401) {
          this.user = null
          LocalStorage.remove('user_profile')
          this.setAuthToken(null)
          return false
        }

        if (response.ok) {
          const profileData = await response.json()
          this.user = { ...this.user, ...profileData }
          LocalStorage.set('user_profile', this.user)
          return true
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du profil:', err)
      }

      return !!this.user
    }
  }
})
