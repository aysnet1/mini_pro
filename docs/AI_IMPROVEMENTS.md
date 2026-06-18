# 🎯 Améliorations IA - Pattern Digicole

Ce document décrit les améliorations apportées au système de chat TakLog, inspirées du pattern Digicole.

## 📋 Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Interrupts](#interrupts)
3. [Reprise après Interrupt](#reprise-après-interrupt)
4. [Métadonnées enrichies](#métadonnées-enrichies)
5. [Session persistante](#session-persistante)
6. [Architecture complète](#architecture-complète)

---

## 🎯 Vue d'ensemble

### **Avant** (3 outils)

```
searchLogements → getStudentInfo → createReservation
```

### **Après** (4 outils + interrupts)

```
searchLogements → getStudentInfo → confirmReservationInterrupt → createReservation
```

---

## 🔔 Interrupts

### **Qu'est-ce qu'un Interrupt ?**

Un interrupt est un mécanisme qui permet à l'IA de **suspendre son exécution** et de **demander une confirmation explicite** à l'utilisateur avant de continuer.

### **Implémentation : `confirmReservationInterrupt`**

```javascript
const confirmReservationInterrupt = ai.defineInterrupt({
  name: 'confirmReservationInterrupt',
  description:
    'Demander à l étudiant de confirmer les dates et le logement avant de créer la réservation',
  inputSchema: z.object({
    question: z.string(),
    logement: z.object({
      id: z.number(),
      adresse: z.string(),
      ville: z.string(),
      prix: z.number(),
    }),
    dates: z.object({
      date_debut: z.string(),
      date_fin: z.string(),
      duree: z.number(),
      montant_total: z.number(),
    }),
  }),
  outputSchema: z.object({
    confirmed: z.boolean(),
    logement_id: z.number(),
    date_debut: z.string(),
    date_fin: z.string(),
    duree: z.number(),
  }),
})
```

### **Utilisation dans le Flow**

```javascript
const chat = ai.chat({
  system: `
6. CONFIRMATION EXPLICITE : Avant de créer la réservation, utilise "confirmReservationInterrupt"
   - Affiche un récapitulatif (logement, dates, montant total)
   - Demande confirmation explicite
   - Si confirmed=true → appelle createReservation
   - Si confirmed=false → propose d'autres logements
  `,
  tools: [
    getStudentInfoTool,
    searchLogementsTool,
    createReservationTool,
    confirmReservationInterrupt,
  ],
  resume: resumeOption, // Support pour reprendre après interrupt
})
```

---

## 🔄 Reprise après Interrupt

### **Côté Backend (`AgentFlowControllers.js`)**

```javascript
export const chatBotFlow = ai.defineFlow(
  {
    name: 'chatBotFlow',
    inputSchema: z.object({
      message: z.string().optional(),
      userId: z.string().optional(),
      chatHistory: z.array(z.any()).optional(),
      resumeData: z.object({
        messages: z.array(z.any()).optional(),
        interruptObject: z.any().optional(),
        replyPayload: z.any().optional(),
      }).optional(),
    }),
  },
  async ({ message, userId, chatHistory = [], resumeData }, { sendChunk }) => {
    let messages;
    let resumeOption = undefined;

    if (resumeData && resumeData.messages && resumeData.interruptObject) {
      // REPRENDRE APRÈS INTERRUPT
      messages = resumeData.messages;
      resumeOption = {
        respond: [confirmReservationInterrupt.respond(resumeData.interruptObject, resumeData.replyPayload)],
      };
    } else {
      // DÉMARRAGE NORMAL
      messages = chatHistory.slice(-6).map(h => ({ role: h.role, content: [{ text: h.content }] }));
    }

    const chat = ai.chat({
      messages,
      resume: resumeOption, // ← Clé pour la reprise
      tools: [...],
    });
  }
);
```

### **Côté Frontend (`useChat.js`)**

```javascript
/**
 * Gère la réponse à un interrupt (confirmation de réservation)
 */
async function handleInterruptResponse(interruptData, replyPayload) {
  const resumeData = {
    messages: prepareChatHistory(),
    interruptObject: interruptData,
    replyPayload,
  }

  // Envoie la réponse avec les données de reprise
  await sendMessage(null, resumeData)
}
```

### **Côté Service (`chat.service.js`)**

```javascript
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
```

---

## 🏷️ Métadonnées enrichies

### **Avant**

```javascript
const resultData = {
  success: true,
  reservation_id,
  message: 'Réservation créée avec succès.',
}
```

### **Après**

```javascript
const resultData = {
  success: true,
  reservation_id,
  message: 'Réservation créée avec succès.',
  metadata: {
    logement_nom: logement.adress,
    logement_ville: logement.ville,
    proprietaire_nom: proprietaire.nom,
    montant_total: logement.prix * duree,
    etudiant_nom: `${etudiant.nom} ${etudiant.prenom}`,
  },
}
```

### **Utilisation dans les Widgets**

Les métadonnées permettent d'enrichir les widgets frontend avec des informations supplémentaires :

```vue
<ReservationResultWidget
  :reservation-result="reservationResult"
  :metadata="reservationResult.metadata"
/>
```

---

## 🔐 Session persistante

### **Contexte de Session**

```javascript
const chat = ai.chat({
  context: {
    sessionKey,
    logementId: studentData.logement_id, // ← Session persistante
  },
})
```

### **Avantages**

- **État partagé** entre les appels
- **Mémorisation** du logement sélectionné
- **Personnalisation** des réponses selon le contexte

---

## 🏗️ Architecture complète

### **1. Backend (`AgentFlowControllers.js`)**

```
┌─────────────────────────────────────┐
│  chatBotFlow                        │
│  ├─ resumeData support              │
│  ├─ confirmReservationInterrupt     │
│  └─ metadata enrichment             │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Tools                              │
│  ├─ searchLogementsTool             │
│  ├─ getStudentInfoTool              │
│  ├─ confirmReservationInterrupt     │
│  └─ createReservationTool           │
└─────────────────────────────────────┘
```

### **2. Frontend (`useChat.js`)**

```
┌─────────────────────────────────────┐
│  useChat Composable                 │
│  ├─ sendMessage()                   │
│  ├─ handleInterruptResponse()       │
│  └─ prepareChatHistory()            │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  chat.service.js                    │
│  └─ streamAgentFlow()               │
│     └─ resumeData support           │
└─────────────────────────────────────┘
```

### **3. Components**

```
┌─────────────────────────────────────┐
│  ChatWidget.vue                     │
│  ├─ StudentInfoWidget               │
│  ├─ LogementCardsWidget             │
│  ├─ ReservationWidget               │
│  ├─ ReservationConfirmWidget ⭐     │
│  └─ ReservationResultWidget         │
└─────────────────────────────────────┘
```

---

## 📊 Flux de réservation complet

### **Étape 1 : Recherche**

```
Utilisateur → "Studio à Kairouan max 400DT"
     ↓
searchLogementsTool → [logements]
     ↓
LogementCardsWidget → Affiche les résultats
```

### **Étape 2 : Vérification**

```
Utilisateur → "Je veux réserver ce logement"
     ↓
getStudentInfoTool → { student, hasActiveReservation }
     ↓
Si hasActiveReservation → Bloque et demande annulation
Si !hasActiveReservation → Continue
```

### **Étape 3 : Collecte des dates**

```
IA → "Quelles sont vos dates ? (format AAAA-MM-JJ)"
     ↓
ReservationWidget → Formulaire de dates
     ↓
Utilisateur → Remplit date_debut, date_fin, duree
```

### **Étape 4 : Confirmation (NOUVEAU ⭐)**

```
IA → confirmReservationInterrupt
     ↓
ReservationConfirmWidget → Affiche récapitulatif
  ├─ Logement : adresse, ville, prix
  ├─ Dates : début, fin, durée
  └─ Montant total : prix × durée
     ↓
Utilisateur → Clique "Confirmer" ou "Annuler"
```

### **Étape 5 : Création**

```
Si confirmed=true :
  ↓
createReservationTool → { success, reservation_id, metadata }
  ↓
  ├─ INSERT INTO etudiant_logement
  ├─ SEND EMAIL to proprietaire
  └─ ReservationResultWidget → Succès

Si confirmed=false :
  ↓
  └─ IA → "Souhaitez-vous chercher d'autres logements ?"
```

---

## 🎨 Widget de Confirmation

### **Composant : `ReservationConfirmWidget.vue`**

```vue
<template>
  <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
    <!-- Résumé du logement -->
    <div class="bg-white rounded-lg p-3 mb-3">
      <img :src="thumbnail" />
      <p>{{ logement.adresse }}</p>
      <p>{{ logement.ville }}</p>
      <p class="text-amber-700">{{ logement.prix }} DT/mois</p>
    </div>

    <!-- Dates -->
    <div class="grid grid-cols-2 gap-3 mb-3">
      <div>Date de début : {{ formatDate(dates.date_debut) }}</div>
      <div>Date de fin : {{ formatDate(dates.date_fin) }}</div>
    </div>

    <!-- Montant total -->
    <div class="bg-white rounded-lg p-3 mb-3">
      <div class="flex justify-between">
        <span>Durée : {{ dates.duree }} mois</span>
        <span class="text-amber-700">{{ dates.montant_total }} DT</span>
      </div>
    </div>

    <!-- Boutons -->
    <div class="flex gap-2">
      <button @click="$emit('confirm', payload)">Confirmer</button>
      <button @click="$emit('cancel', payload)">Annuler</button>
    </div>
  </div>
</template>
```

---

## ✅ Avantages des améliorations

### **1. Expérience Utilisateur**

- ✅ **Confirmation explicite** avant création
- ✅ **Récapitulatif clair** avec toutes les informations
- ✅ **Boutons d'action** intuitifs (Confirmer/Annuler)
- ✅ **Transparence** sur le montant total

### **2. Robustesse**

- ✅ **Validation** des dates et durée
- ✅ **Vérification** des conflits de dates
- ✅ **Gestion d'erreurs** améliorée
- ✅ **Rollback** en cas d'annulation

### **3. Maintainabilité**

- ✅ **Code modulaire** avec widgets séparés
- ✅ **Patterns réutilisables** (inspirés de Digicole)
- ✅ **Documentation** complète
- ✅ **Tests facilités** par la séparation des responsabilités

---

## 🚀 Prochaines étapes

### **Améliorations futures possibles**

1. **Persistance de session**
   - Stocker le contexte dans localStorage
   - Reprendre la conversation après déconnexion

2. **Multi-interrupts**
   - Support pour plusieurs interrupts en cascade
   - File d'attente des réponses

3. **Analytics**
   - Tracker les confirmations vs annulations
   - Mesurer le taux de conversion

4. **Notifications push**
   - Alerter l'utilisateur en cas de réponse du propriétaire
   - Rappels de dates limites

---

## 📚 Références

- **Pattern Digicole** : `agents/digicole.agent.js`
- **Genkit Interrupts** : [Documentation Genkit](https://firebase.google.com/docs/genkit)
- **Vue 3 Composition API** : [Vue.js Docs](https://vuejs.org/guide/reusability/composables.html)

---

**Dernière mise à jour** : 2026-06-17
**Version** : 2.0.0
**Statut** : ✅ Production Ready
