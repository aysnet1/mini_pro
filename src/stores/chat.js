import { defineStore, acceptHMRUpdate } from 'pinia'
import { useAuthStore } from './auth'

function makeKey(userId, agentId) {
  return `${userId}:${agentId}`
}

function toUiMessage(row, userId, index) {
  const senderId = String(row.expediteur_id)
  const knownRoles = new Set(['user', 'model', 'tools'])
  const backendRole = knownRoles.has(row.role)
    ? row.role
    : (senderId === String(userId) ? 'user' : 'model')
  const uiRole = backendRole === 'user' ? 'user' : 'bot'
  let parsedWidgetData = null
  let parsedToolsPayload = null

  if (typeof row.contenu === 'string') {
    try {
      parsedToolsPayload = JSON.parse(row.contenu)
    } catch {
      parsedToolsPayload = null
    }
  }

  const isToolsPayload =
    backendRole === 'tools' ||
    (backendRole === 'model' && parsedToolsPayload?.kind === 'tools_results')

  if (isToolsPayload) {
    const parsed = parsedToolsPayload
    parsedWidgetData = Array.isArray(parsed) ? parsed : parsed?.data
    if (!Array.isArray(parsedWidgetData)) {
      parsedWidgetData = null
    }
  }

  return {
    id: `${row.id ?? Date.now()}_${index}`,
    role: uiRole,
    backendRole,
    text: isToolsPayload ? '' : (row.contenu ?? ''),
    createdAt: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
    thinking: '',
    showThinking: false,
    isThinking: false,
    toolStatus: null,
    toolLoading: false,
    widgetData: parsedWidgetData,
  }
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: {},
    loadingByKey: {},
    sendingByKey: {},
  }),

  getters: {
    getConversation: (state) => (userId, agentId) => {
      const key = makeKey(userId, agentId)
      return state.conversations[key] || []
    },
    isLoadingConversation: (state) => (userId, agentId) => {
      const key = makeKey(userId, agentId)
      return !!state.loadingByKey[key]
    },
    isSendingConversation: (state) => (userId, agentId) => {
      const key = makeKey(userId, agentId)
      return !!state.sendingByKey[key]
    },
  },

  actions: {
    getAuthHeaders() {
      const authStore = useAuthStore()
      return {
        'Content-Type': 'application/json',
        ...authStore.authHeader,
      }
    },

    setConversation(userId, agentId, messages) {
      const key = makeKey(userId, agentId)
      this.conversations[key] = Array.isArray(messages) ? messages : []
    },

    appendMessage(userId, agentId, message) {
      const key = makeKey(userId, agentId)
      if (!Array.isArray(this.conversations[key])) {
        this.conversations[key] = []
      }
      this.conversations[key].push(message)
      return message
    },

    patchMessage(userId, agentId, messageId, patch) {
      const key = makeKey(userId, agentId)
      const list = this.conversations[key] || []
      const idx = list.findIndex((m) => m.id === messageId)
      if (idx < 0) return
      list[idx] = { ...list[idx], ...patch }
    },

    async loadConversation(userId, agentId) {
      const numericUserId = Number(userId)
      const numericAgentId = Number(agentId)
      if (!Number.isFinite(numericUserId) || !Number.isFinite(numericAgentId)) {
        this.setConversation(userId, agentId, [])
        return []
      }

      const key = makeKey(userId, agentId)
      this.loadingByKey[key] = true

      try {
        const response = await fetch(
          `/api/messages/conversation/${numericUserId}/${numericAgentId}`,
          { headers: this.getAuthHeaders() }
        )

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload?.error || 'Erreur de chargement des messages')
        }

        const rows = await response.json()
        const mapped = Array.isArray(rows)
          ? rows.map((row, index) => toUiMessage(row, numericUserId, index))
          : []
        this.conversations[key] = mapped
        return mapped
      } finally {
        this.loadingByKey[key] = false
      }
    },

    async saveMessageToApi({ expediteurId, destinataireId, contenu, role = 'user' }) {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          expediteur_id: Number(expediteurId),
          destinataire_id: Number(destinataireId),
          role,
          contenu,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || "Erreur lors de l'envoi du message")
      }

      return response.json().catch(() => ({}))
    },

    async saveWidgetDataToApi({ agentId, userId, data, role = 'tools' }) {
      const payload = Array.isArray(data) ? data : []
      const primaryResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          expediteur_id: Number(agentId),
          destinataire_id: Number(userId),
          role,
          contenu: JSON.stringify(payload),
        }),
      })

      if (primaryResponse.ok) {
        return primaryResponse.json().catch(() => ({}))
      }

      // Fallback for environments where DB enum does not yet include `tools`.
      const fallbackResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          expediteur_id: Number(agentId),
          destinataire_id: Number(userId),
          role: 'model',
          contenu: JSON.stringify({ kind: 'tools_results', data: payload }),
        }),
      })

      if (!fallbackResponse.ok) {
        const payloadError = await fallbackResponse.json().catch(() => ({}))
        throw new Error(payloadError?.error || "Erreur lors de la sauvegarde des widgets")
      }

      return fallbackResponse.json().catch(() => ({}))
    },

    setSending(userId, agentId, value) {
      const key = makeKey(userId, agentId)
      this.sendingByKey[key] = !!value
    },

    async clearConversation(userId, agentId) {
      const numericUserId = Number(userId)
      const numericAgentId = Number(agentId)

      // Clear local state first
      const key = makeKey(userId, agentId)
      this.conversations[key] = []

      // Call API to delete messages if user and agent IDs are valid
      if (Number.isFinite(numericUserId) && Number.isFinite(numericAgentId)) {
        try {
          const response = await fetch(
            `/api/messages/conversation/${numericUserId}/${numericAgentId}`,
            {
              method: 'DELETE',
              headers: this.getAuthHeaders(),
            }
          )

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}))
            console.error('[chat] clear conversation failed:', payload?.error)
          }
        } catch (err) {
          console.error('[chat] clear conversation error:', err)
        }
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChatStore, import.meta.hot))
}
