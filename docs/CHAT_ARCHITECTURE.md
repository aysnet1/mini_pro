# Architecture du Chat IA - Documentation

## Vue d'ensemble

Cette documentation décrit l'architecture propre et maintenable du composant de chat IA, suivant les meilleures pratiques Vue 3 pour la production.

## Structure des Fichiers

```
src/
├── components/
│   └── chat/
│       └── ChatWidget.vue          # Composant UI principal
├── composables/
│   └── useChat.js                  # Logique métier du chat
├── services/
│   └── chat.service.js             # Appels API HTTP
└── stores/
    └── chat.js                     # État Pinia (state management)
```

## Responsabilités par Couche

### 1. **Service** (`chat.service.js`)

**Rôle**: Gère exclusivement les appels HTTP vers le backend.

**Fonctions principales**:

- `getConversation(userId, agentId)` - Récupère l'historique
- `createMessage(params)` - Envoie un message
- `createWidgetData(params)` - Sauvegarde les résultats widget
- `deleteConversation(userId, agentId)` - Supprime une conversation
- `streamAgentFlow(params)` - Stream la réponse IA

**Bonnes pratiques**:

- Utilise Axios avec intercepteurs pour l'authentification
- Ne contient aucune logique métier
- Retourne des données brutes de l'API

### 2. **Pinia Store** (`chat.js`)

**Rôle**: Gère l'état global de l'application et la logique de state management.

**État**:

```javascript
{
  conversations: {},    // Key: userId:agentId -> Array<Message>
  loadingByKey: {},     // Key: userId:agentId -> boolean
  sendingByKey: {}      // Key: userId:agentId -> boolean
}
```

**Getters**:

- `getConversation(userId, agentId)` - Récupère une conversation
- `isLoadingConversation(userId, agentId)` - État de chargement
- `isSendingConversation(userId, agentId)` - État d'envoi

**Actions**:

- `loadConversation()` - Charge depuis l'API
- `saveMessage()` - Sauvegarde un message
- `saveWidgetData()` - Sauvegarde les widgets
- `clearConversation()` - Efface la conversation
- `appendMessage()` - Ajoute un message localement
- `patchMessage()` - Met à jour un message existant

### 3. **Composable** (`useChat.js`)

**Rôle**: Encapsule la logique métier réutilisable du chat.

**Fonctions exposées**:

```javascript
{
  // État
  ;(draft, // Texte du message en cours
    isOpen, // État d'ouverture du panel
    messages, // Liste des messages (computed)
    isLoading, // Chargement en cours
    isSending, // Envoi en cours
    isStreaming, // Stream IA en cours
    messagesContainer, // Référence DOM pour scroll
    // Méthodes
    sendMessage, // Envoie un message
    clearConversation, // Efface l'historique
    loadConversation, // Charge la conversation
    initialize, // Initialise le chat
    scrollToBottom, // Scroll vers le bas
    formatTime, // Formate l'heure
    parsePhotos, // Parse les photos
    renderMarkdown) // Rend le Markdown
}
```

**Avantages**:

- Logique réutilisable dans n'importe quel composant
- Testable unitairement
- Séparation claire UI vs logique

### 4. **Composant** (`ChatWidget.vue`)

**Rôle**: Uniquement l'UI et les interactions utilisateur.

**Caractéristiques**:

- Utilise le composable `useChat` pour toute la logique
- Props: `userId`, `agentId`
- Aucun appel API direct
- Aucun état métier complexe

**Structure**:

```vue
<script setup>
import { useChat } from '@/composables/useChat'

const props = defineProps({ userId, agentId })

const {
  draft,
  isOpen,
  messages,
  isLoading,
  isSending,
  sendMessage,
  clearConversation,
  // ... autres méthodes
} = useChat({ userId: props.userId, agentId: props.agentId })
</script>
```

## Flux de Données

### Envoi d'un Message

```
Utilisateur → Composant → useChat.sendMessage()
                              ↓
                        Store.appendMessage() (local)
                              ↓
                        Service.saveMessage() (API)
                              ↓
                        Stream IA → Store.patchMessage()
```

### Chargement d'une Conversation

```
Composant.mounted()
      ↓
useChat.initialize()
      ↓
Store.loadConversation()
      ↓
Service.getConversation()
      ↓
Store.setConversation() (state mis à jour)
      ↓
Composant rendu (computed messages)
```

## Avantages de cette Architecture

### 1. **Maintenabilité**

- Chaque couche a une responsabilité unique
- Facile à tester unitairement
- Code auto-documenté

### 2. **Réutilisabilité**

- Le composable `useChat` peut être utilisé dans n'importe quel composant
- Le service peut être appelé depuis d'autres stores ou composables

### 3. **Testabilité**

- Service: tests unitaires des appels API
- Store: tests des mutations d'état
- Composable: tests de la logique métier
- Composant: tests UI avec Vue Test Utils

### 4. **Évolutivité**

- Ajout facile de nouvelles fonctionnalités
- Modification d'une couche sans impacter les autres
- Support du code splitting

## Exemples d'Utilisation

### Utilisation Basique

```vue
<template>
  <ChatWidget :userId="user.id" :agentId="1" />
</template>

<script setup>
import ChatWidget from '@/components/chat/ChatWidget.vue'
</script>
```

### Utilisation Avancée avec le Composable

```vue
<script setup>
import { useChat } from '@/composables/useChat'

const { messages, sendMessage, clearConversation } = useChat({ userId: 123, agentId: 1 })
</script>
```

## Gestion des Erreurs

Chaque couche gère ses erreurs:

- **Service**: Capture les erreurs HTTP, retourne des messages d'erreur clairs
- **Store**: Try/catch autour des appels API, logging des erreurs
- **Composable**: Gestion des erreurs de stream, fallback UI
- **Composant**: Affichage des états d'erreur à l'utilisateur

## Performance

### Optimisations incluses:

1. **Computed properties** - Les messages sont mis en cache par Pinia
2. **Debounced scroll** - Scroll vers le bas optimisé avec `nextTick`
3. **Minimal re-renders** - Seuls les messages modifiés sont mis à jour
4. **Lazy loading** - Le service Genkit est chargé à la demande

## Sécurité

- **Authentification**: Intercepteur Axios ajoute automatiquement les headers
- **XSS**: Markdown rendu avec `html: false`
- **SQL Injection**: Paramètres sanitizés dans le backend
- **Rate limiting**: Géré côté backend

## Prochaines Étapes

### Améliorations possibles:

1. **Cache offline** - Stocker les conversations en localStorage
2. **WebSockets** - Remplacer le polling par des websockets
3. **Optimistic updates** - Mettre à jour l'UI avant confirmation API
4. **Retry logic** - Réessayer automatiquement les échecs réseau

## Dépannage

### Problèmes courants:

**Le chat ne charge pas**:

- Vérifier que `userId` et `agentId` sont des nombres valides
- Consulter les logs console pour les erreurs API
- Vérifier l'authentification dans le store auth

**Les messages ne s'envoient pas**:

- Vérifier que `isSending` n'est pas bloqué à `true`
- Consulter les logs du service pour les erreurs HTTP
- Vérifier la connexion réseau

**Le scroll ne fonctionne pas**:

- Vérifier que `messagesContainer` est bien référencé
- S'assurer que `nextTick` est appelé avant le scroll

## Conclusion

Cette architecture fournit une base solide, maintenable et évolutive pour le chat IA. Elle suit les meilleures pratiques Vue 3 et permet une séparation claire des responsabilités.
