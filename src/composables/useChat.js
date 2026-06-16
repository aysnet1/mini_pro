import { ref, computed, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { streamAgentFlow } from '@/services/chat.service'
import MarkdownIt from 'markdown-it'

/**
 * Composable pour la logique de chat IA
 * Gère l'envoi de messages, le streaming de réponses, et l'état de la conversation
 *
 * @param {Object} options - Options du composable
 * @param {string|number} options.userId - ID de l'utilisateur
 * @param {string|number} options.agentId - ID de l'agent
 * @returns {Object} Methods et état du chat
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
        return text ? md.render(text) : ''
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
            console.error('[useChat] loadConversation error:', error)
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
    async function sendMessage() {
        const text = draft.value.trim()
        if (!text || isSending.value) return

        // Prépare l'historique
        const chatHistory = prepareChatHistory()

        // Crée le message utilisateur
        const userMessage = {
            id: `${Date.now()}_u`,
            role: 'user',
            backendRole: 'user',
            text,
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
                contenu: text,
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

            // Stream la réponse de l'IA
            for await (const payload of streamAgentFlow({
                message: text,
                userId: String(userId),
                chatHistory,
            })) {
                if (!payload) continue

                switch (payload.type) {
                    case 'thinking':
                        botMessageRef.isThinking = true
                        botMessageRef.thinking += payload.content
                        break

                    case 'text':
                        if (botMessageRef.isThinking) {
                            botMessageRef.isThinking = false
                            botMessageRef.showThinking = false
                        }
                        botMessageRef.text += payload.content
                        break

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
                        } else {
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
        clearConversation,
        loadConversation,
        initialize,
        scrollToBottom,
        formatTime,
        parsePhotos,
        renderMarkdown,
    }
}
