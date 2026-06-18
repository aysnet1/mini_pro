import { defineStore, acceptHMRUpdate } from 'pinia'
import * as chatService from '@/services/chat.service'

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
    mapData: null,
    reservationWidget: null,
    reservationResult: null,
    studentInfo: null,
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
        const rows = await chatService.getConversation(numericUserId, numericAgentId)
        const mapped = Array.isArray(rows)
          ? rows.map((row, index) => toUiMessage(row, numericUserId, index))
          : []
        this.conversations[key] = mapped
        return mapped
      } catch (error) {
        console.error('[chatStore] loadConversation error:', error)
        this.conversations[key] = []
        return []
      } finally {
        this.loadingByKey[key] = false
      }
    },

    async saveMessage({ expediteurId, destinataireId, contenu, role = 'user' }) {
      try {
        return await chatService.createMessage({
          expediteurId,
          destinataireId,
          contenu,
          role,
        })
      } catch (error) {
        console.error('[chatStore] saveMessage error:', error)
        throw error
      }
    },

    async saveWidgetData({ agentId, userId, data, role = 'tools' }) {
      try {
        return await chatService.createWidgetData({
          agentId,
          userId,
          data,
          role,
        })
      } catch (error) {
        console.error('[chatStore] saveWidgetData error:', error)
        throw error
      }
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
          await chatService.deleteConversation(numericUserId, numericAgentId)
        } catch (error) {
          console.error('[chatStore] clearConversation error:', error)
        }
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useChatStore, import.meta.hot))
}
