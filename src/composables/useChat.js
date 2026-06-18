import { ref, computed, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { streamAgentFlow } from '@/services/chat.service'
import MarkdownIt from 'markdown-it'

/**
 * Composable pour la logique de chat IA
 * Gère l'envoi de messages, le streaming de réponses, et l'état de la conversation
 */
export function useChat({ userId, agentId }) {
  const chatStore = useChatStore()

  // État local
  const draft = ref('')
  const isOpen = ref(false)
  const messagesContainer = ref(null)
  const isStreaming = ref(false)

  // État dérivé du store
  const messages = computed(() => chatStore.getConversation(userId, agentId))
  const isLoading = computed(() => chatStore.isLoadingConversation(userId, agentId))
  const isSending = computed(() => chatStore.isSendingConversation(userId, agentId))

  // Renderer Markdown
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
  })

  /**
   * Formate un timestamp ISO en heure locale
   */
  function formatTime(isoString) {
    return new Date(isoString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /**
   * Parse les photos d'un logement
   */
  function parsePhotos(photoInput) {
    const fallback = ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80']
    if (!photoInput) return fallback

    try {
      return typeof photoInput === 'string' ? JSON.parse(photoInput) : photoInput
    } catch {
      return [photoInput]
    }
  }

  /**
   * Rend du texte Markdown en HTML
   */
  function renderMarkdown(text) {
    if (!text || typeof text !== 'string') return ''
    return md.render(text)
  }

  /**
   * Scroll en bas des messages
   */
  async function scrollToBottom() {
    await nextTick()
    const el = messagesContainer.value?.$el ?? messagesContainer.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }

  /**
   * Charge la conversation depuis le store
   */
  async function loadConversation() {
    try {
      await chatStore.loadConversation(userId, agentId)
    } catch (error) {
      console.error('loadConversation error:', error)
    }
  }

  /**
   * Efface la conversation courante
   */
  async function clearConversation() {
    await chatStore.clearConversation(userId, agentId)
  }

  /**
   * Prépare l'historique pour l'IA (filtre les messages tools)
   */
  function prepareChatHistory() {
    return messages.value
      .filter(m => (m.role === 'user' || m.role === 'bot') && m.backendRole !== 'tools')
      .slice(-6)
      .map(m => ({
        role: m.role === 'bot' ? 'model' : 'user',
        content: m.text ?? '',
      }))
  }

  /**
   * Envoie un message et stream la réponse de l'IA
   */
  async function sendMessage(text = null, resumeData = null) {
    // S'assure que text est une chaîne de caractères
    let messageText
    if (text === null || text === undefined) {
      messageText = draft.value.trim()
    } else if (typeof text === 'string') {
      messageText = text.trim()
    } else {
      // Si text est un objet Event ou autre, utilise draft.value
      messageText = draft.value.trim()
    }

    if (!messageText || isSending.value) return

    // Prépare l'historique
    const chatHistory = prepareChatHistory()

    // Crée le message utilisateur
    const userMessage = {
      id: `${Date.now()}_u`,
      role: 'user',
      backendRole: 'user',
      text: messageText,
      createdAt: new Date().toISOString(),
      thinking: '',
      showThinking: false,
      isThinking: false,
      toolStatus: null,
      toolLoading: false,
      widgetData: null,
      mapData: null,
    }

    chatStore.appendMessage(userId, agentId, userMessage)
    draft.value = ''
    chatStore.setSending(userId, agentId, true)

    // Sauvegarde le message utilisateur en DB
    try {
      await chatStore.saveMessage({
        expediteurId: Number(userId),
        destinataireId: Number(agentId),
        role: 'user',
        contenu: messageText,
      })
    } catch (error) {
      console.error('[useChat] save user message error:', error)
    }

    // Crée le message bot (réponse)
    const botMessageId = `${Date.now()}_b`
    const botMessage = {
      id: botMessageId,
      role: 'bot',
      backendRole: 'model',
      text: '',
      thinking: '',
      showThinking: true,
      isThinking: true,
      toolStatus: null,
      toolLoading: false,
      widgetData: null,
      mapData: null,
      createdAt: new Date().toISOString(),
    }

    chatStore.appendMessage(userId, agentId, botMessage)
    await scrollToBottom()

    // Référence réactive vers le message bot
    const botMessageRef = messages.value.find(m => m.id === botMessageId)

    try {
      isStreaming.value = true

      // Stream la réponse de l'IA (avec support resumeData pour les interrupts)
      for await (const payload of streamAgentFlow({
        message: messageText,
        userId: String(userId),
        chatHistory,
        resumeData, // Support pour reprendre après interrupt
      })) {
        if (!payload) continue

        switch (payload.type) {
          case 'thinking':
            botMessageRef.isThinking = true
            botMessageRef.thinking += payload.content
            break

          case 'text': {
            if (botMessageRef.isThinking) {
              botMessageRef.isThinking = false
              botMessageRef.showThinking = false
            }
            botMessageRef.text += payload.content

            // Détecte si l'IA demande les dates pour une réservation
            const text = botMessageRef.text.toLowerCase()
            const asksForDates = text.includes('date de début') || text.includes('date de fin') || text.includes('durée') || text.includes('format aaaa-mm-jj') || text.includes('merci de me fournir')

            // Cherche un logement dans les messages précédents (exclut le message actuel)
            const previousMessages = messages.value.filter(m => m.id !== botMessageRef.id)
            const hasLogement = previousMessages.some(m => m.widgetData && m.widgetData.length > 0)

            // Si l'IA demande les dates et qu'il y a un logement, affiche le widget
            if (asksForDates && hasLogement && !botMessageRef.reservationWidget) {
              const lastLogement = previousMessages.find(m => m.widgetData && m.widgetData.length > 0)
              if (lastLogement && lastLogement.widgetData[0]) {
                botMessageRef.reservationWidget = {
                  logement_id: lastLogement.widgetData[0].id,
                  date_debut: '',
                  date_fin: '',
                  duree: '',
                }
              }
            }
            break
          }

          case 'tool_call':
            if (botMessageRef.isThinking) {
              botMessageRef.isThinking = false
              botMessageRef.showThinking = false
            }
            botMessageRef.toolStatus = 'Recherche en cours dans la base de données…'
            botMessageRef.toolLoading = true
            break

          case 'tool_result': {
            if (botMessageRef.isThinking) {
              botMessageRef.isThinking = false
              botMessageRef.showThinking = false
            }
            botMessageRef.toolLoading = false

            const { data, count } = payload.result ?? {}

            // Vérifie si c'est des données POI (latitude/longitude)
            if (data && data.data && Array.isArray(data.data)) {
              const points = data.data.map((poi, idx) => ({
                id: `poi-${idx}`,
                name: poi.name,
                lat: poi.latitude,
                lng: poi.longitude,
                color: idx === 0 ? '#10b981' : '#3b82f6',
              }))

              // Ajoute la position de l'utilisateur si disponible
              if (data.input && data.input.latitude && data.input.longitude) {
                points.unshift({
                  id: 'user-location',
                  name: '📍 Position actuelle',
                  lat: data.input.latitude,
                  lng: data.input.longitude,
                  color: '#f59e0b',
                })
              }

              botMessageRef.mapData = { points }
              botMessageRef.toolStatus = `${count} point(s) d'intérêt trouvé(s)`
            }
            // Vérifie si c'est des données logement
            else if (Array.isArray(data)) {
              botMessageRef.widgetData = data
              botMessageRef.toolStatus = count === 0
                ? 'Aucun logement trouvé'
                : `${count} logement${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`
            }
            // Vérifie si c'est un résultat de réservation
            else if (data && typeof data === 'object' && 'success' in data) {
              // Résultat de createReservation
              if ('reservation_id' in data || 'message' in data) {
                botMessageRef.toolStatus = data.success
                  ? 'Réservation créée avec succès!'
                  : 'Échec de la réservation'
                botMessageRef.reservationResult = data
              }
              // Résultat de getStudentInfo
              else if ('student' in data && 'reservations' in data) {
                botMessageRef.studentInfo = {
                  ...data.student,
                  hasActiveReservation: data.hasActiveReservation,
                  activeReservationsCount: data.activeReservationsCount,
                  reservations: data.reservations,
                }
                botMessageRef.toolStatus = data.success
                  ? 'Informations étudiant récupérées'
                  : 'Échec de la récupération des informations'
              }
              // Autre résultat (fallback)
              else {
                botMessageRef.toolStatus = data.success
                  ? 'Opération réussie'
                  : 'Échec de l\'opération'
                botMessageRef.reservationResult = data
              }
            }
            // Vérifie si c'est une demande de confirmation de réservation
            else if (data && data.kind === 'reservation_confirmation') {
              botMessageRef.reservationWidget = {
                logement_id: data.logement_id,
                date_debut: data.date_debut || '',
                date_fin: data.date_fin || '',
                duree: data.duree || '',
              }
              botMessageRef.toolStatus = 'Veuillez sélectionner les dates'
            }
            else {
              botMessageRef.toolStatus = 'Résultats reçus'
            }
            break
          }

          case 'error':
            console.error('[agent] error chunk:', payload.message)
            botMessageRef.isThinking = false
            botMessageRef.showThinking = false
            botMessageRef.text += '\n\n⚠️ Une erreur est survenue lors de la recherche.'
            botMessageRef.toolLoading = false
            break
        }

        await scrollToBottom()
      }

      // Sauvegarde la réponse du bot
      if (botMessageRef?.text) {
        try {
          await chatStore.saveMessage({
            expediteurId: Number(agentId),
            destinataireId: Number(userId),
            role: 'model',
            contenu: botMessageRef.text,
          })
        } catch (error) {
          console.error('[useChat] save bot message error:', error)
        }
      }

      // Sauvegarde les données widget si présentes
      if (botMessageRef?.widgetData) {
        try {
          await chatStore.saveWidgetData({
            agentId: Number(agentId),
            userId: Number(userId),
            data: botMessageRef.widgetData,
            role: 'tools',
          })
        } catch (error) {
          console.error('[useChat] save widget data error:', error)
        }
      }

      // Vérifie si la réponse contient des données d'interrupt (confirmReservationInterrupt)
      // Ceci est géré par le backend via le retour de chatBotFlow
    } catch (error) {
      console.error('[useChat] sendMessage error:', error)
      if (botMessageRef) {
        botMessageRef.isThinking = false
        botMessageRef.showThinking = false
        botMessageRef.text = '⚠️ Une erreur de communication est survenue. Veuillez réessayer.'
        botMessageRef.toolLoading = false
      }
    } finally {
      if (botMessageRef) {
        botMessageRef.isThinking = false
      }
      chatStore.setSending(userId, agentId, false)
      isStreaming.value = false
      await scrollToBottom()
    }
  }

  /**
   * Gère la réponse à un interrupt (confirmation de réservation)
   */
  async function handleInterruptResponse(interruptData, replyPayload) {
    // Prépare les données de reprise
    const resumeData = {
      messages: prepareChatHistory(),
      interruptObject: interruptData,
      replyPayload,
    }

    // Envoie la réponse avec les données de reprise
    await sendMessage(null, resumeData)
  }

  /**
   * Initialise le chat (charge la conversation)
   */
  async function initialize() {
    await loadConversation()
  }

  return {
    // État
    draft,
    isOpen,
    messages,
    isLoading,
    isSending,
    isStreaming,
    messagesContainer,

    // Méthodes
    sendMessage,
    handleInterruptResponse,
    clearConversation,
    loadConversation,
    initialize,
    scrollToBottom,
    formatTime,
    parsePhotos,
    renderMarkdown,
  }
}
