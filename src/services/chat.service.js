import { useAuthStore } from '@/stores/auth'

/**
 * Helper pour obtenir les headers d'authentification
 */
function getAuthHeaders() {
  const authStore = useAuthStore()
  return {
    'Content-Type': 'application/json',
    ...authStore?.authHeader,
  }
}

/**
 * Récupère l'historique de conversation entre un utilisateur et un agent
 * @param {number} userId - ID de l'utilisateur
 * @param {number} agentId - ID de l'agent
 * @returns {Promise<Array>} Liste des messages
 */
export async function getConversation(userId, agentId) {
  if (!Number.isFinite(Number(userId)) || !Number.isFinite(Number(agentId))) {
    return []
  }

  const response = await fetch(`/api/messages/conversation/${userId}/${agentId}`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('Erreur de chargement de la conversation')
  }

  return response.json()
}


export async function createMessage({ expediteurId, destinataireId, contenu, role = 'user' }) {
  const response = await fetch('/api/messages', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      expediteur_id: Number(expediteurId),
      destinataire_id: Number(destinataireId),
      role,
      contenu,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error || "Erreur lors de l'envoi du message")
  }

  return response.json()
}

/**
 * Sauvegarde des données widget (résultats de recherche)
 * @param {Object} params - Paramètres
 * @param {number} params.agentId - ID de l'agent
 * @param {number} params.userId - ID de l'utilisateur
 * @param {Array} params.data - Données widget
 * @param {string} params.role - Rôle (default: 'tools')
 * @returns {Promise<Object>} Réponse de l'API
 */
export async function createWidgetData({ agentId, userId, data, role = 'tools' }) {
  const payload = Array.isArray(data) ? data : []

  // Tentative principale avec le rôle 'tools'
  let response = await fetch('/api/messages', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      expediteur_id: Number(agentId),
      destinataire_id: Number(userId),
      role,
      contenu: JSON.stringify(payload),
    }),
  })

  if (response.ok) {
    return response.json()
  }

  // Fallback pour environnements où l'enum DB n'inclut pas 'tools'
  response = await fetch('/api/messages', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      expediteur_id: Number(agentId),
      destinataire_id: Number(userId),
      role: 'model',
      contenu: JSON.stringify({ kind: 'tools_results', data: payload }),
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error || "Erreur lors de la sauvegarde des widgets")
  }

  return response.json()
}

/**
 * Supprime tous les messages d'une conversation
 * @param {number} userId - ID de l'utilisateur
 * @param {number} agentId - ID de l'agent
 * @returns {Promise<void>}
 */
export async function deleteConversation(userId, agentId) {
  if (!Number.isFinite(Number(userId)) || !Number.isFinite(Number(agentId))) {
    return
  }

  const response = await fetch(`/api/messages/conversation/${userId}/${agentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('Erreur de suppression de la conversation')
  }
}

/**
 * Stream une conversation avec l'agent IA
 * @param {Object} params - Paramètres du stream
 * @param {string} params.message - Message utilisateur
 * @param {string} params.userId - ID utilisateur
 * @param {Array} params.chatHistory - Historique de conversation
 * @param {Object} [params.resumeData] - Données pour reprendre après un interrupt
 * @returns {AsyncGenerator} Générateur de payloads
 */
export async function* streamAgentFlow({ message, userId, chatHistory, resumeData }) {
  const { streamFlow } = await import('genkit/beta/client')

  const input = {
    message,
    userId: String(userId),
    chatHistory,
  }

  // Ajoute resumeData si présent (pour les interrupts)
  if (resumeData) {
    input.resumeData = resumeData
  }

  const result = streamFlow({
    url: '/api/ai/agent-flow',
    input,
  })

  for await (const payload of result.stream) {
    yield payload
  }
}
