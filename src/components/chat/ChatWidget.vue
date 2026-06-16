<template>
  <div>
    <!-- Floating Action Button -->
    <q-btn round unelevated no-caps
      class="chat-fab bg-zinc-900! hover:bg-zinc-800 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 active:scale-95"
      @click="isOpen = true">
      <MessageSquare :size="22" class="text-white" />
    </q-btn>

    <!-- Chat Panel -->
    <q-dialog v-model="isOpen" position="right" full-height maximized>
      <q-card class="chat-panel flex flex-col no-wrap bg-white border-l border-zinc-200 shadow-2xl">

        <!-- Header -->
        <q-card-section
          class="flex items-center justify-between p-4 border-b border-zinc-200 bg-white sticky top-0 z-10">
          <div class="space-y-0.5">
            <div class="text-sm font-black tracking-tight text-zinc-900">
              Assistant IA
            </div>
            <div class="text-[11px] text-zinc-500 font-medium">
              Recherche & Concierge automatisé
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <q-btn flat round dense class="text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
              @click="handleClearChat" title="Effacer l'historique des conversations">
              <Trash2 :size="18" class="transition-transform duration-200 hover:scale-110" />
            </q-btn>
            <q-btn flat round dense
              class="text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all duration-200"
              @click="isOpen = false">
              <X :size="18" class="transition-transform duration-200 hover:scale-110" />
            </q-btn>
          </div>
        </q-card-section>

        <!-- Messages Container -->
        <q-card-section ref="messagesContainer" class="chat-messages flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50">
          <!-- Empty State -->
          <div v-if="messages.length === 0" class="flex flex-col items-center justify-center py-12 space-y-3">
            <div class="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center mb-2">
              <MessageSquare :size="28" class="text-zinc-500" />
            </div>
            <p class="text-sm font-bold text-zinc-800">
              Bienvenue sur TakeLog Chat
            </p>
            <p class="text-[11px] text-zinc-500 max-w-48 mx-auto leading-relaxed text-center">
              Dites-moi où vous cherchez un logement et quel est votre budget max.
            </p>
          </div>

          <!-- Messages List -->
          <div v-for="msg in messages" :key="msg.id" class="space-y-1.5 animate-fade-in">
            <div :class="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
              <div :class="msg.role === 'user' ? 'bubble user-bubble' : 'bubble bot-bubble w-full max-w-[85%]'">
                <!-- Thinking Block -->
                <div v-if="msg.thinking || msg.isThinking"
                  class="mb-2.5 pl-3 py-2 bg-zinc-50 border-l-3 rounded-r-lg transition-all duration-300"
                  :class="msg.isThinking ? 'border-zinc-400 shadow-sm' : 'border-emerald-500 bg-emerald-50'">
                  <div class="flex items-center justify-between">
                    <button type="button" @click="msg.showThinking = !msg.showThinking"
                      class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-800 transition-colors">
                      <ChevronDown :size="12" :class="{ 'transform -rotate-90': !msg.showThinking }"
                        class="transition-transform duration-200" />
                      <span class="flex items-center gap-1.5">
                        <Brain :size="12" class="text-zinc-500" :class="{ 'animate-pulse': msg.isThinking }" />
                        <span>{{ msg.isThinking ? 'Réflexion en cours...' : 'Réflexion terminée' }}</span>
                      </span>
                    </button>
                    <div class="flex items-center gap-1 mr-2">
                      <Loader2 v-if="msg.isThinking" :size="11" class="animate-spin text-zinc-400" />
                      <CheckCircle v-else :size="11" class="text-emerald-500" />
                    </div>
                  </div>
                  <p v-if="msg.showThinking"
                    class="text-[11px] text-zinc-600 font-sans mt-2 leading-relaxed whitespace-pre-line border-t border-zinc-200/60 pt-2">
                    {{ msg.thinking || 'Analyse de la demande...' }}
                  </p>
                </div>

                <!-- Tool Status Badge -->
                <div v-if="msg.toolStatus"
                  class="mb-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600 bg-zinc-100 border border-zinc-200 rounded-lg px-2.5 py-1.5 shadow-sm">
                  <Loader2 :size="11" class="animate-spin text-zinc-700" v-if="msg.toolLoading" />
                  <Database :size="11" class="text-zinc-900" v-else />
                  <span>{{ msg.toolStatus }}</span>
                </div>

                <!-- Text Body -->
                <div v-if="msg.text" class="prose prose-xs text-xs leading-relaxed m-0 wrap-break-word"
                  v-html="renderMarkdown(msg.text)" />

                <!-- Logement Cards -->
                <div v-if="msg.widgetData && msg.widgetData.length > 0" class="mt-3 space-y-2.5">
                  <router-link v-for="item in msg.widgetData" :key="item.id" :to="`/logements/${item.id}`"
                    class="chat-card-link block group">
                    <div
                      class="bg-white rounded-xl border border-zinc-200/60 overflow-hidden text-zinc-900 max-w-65 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group-hover:border-zinc-300">
                      <div class="relative aspect-16/10 bg-zinc-100 overflow-hidden">
                        <img :src="parsePhotos(item.photos)[0]"
                          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div class="absolute top-2 left-2">
                          <span
                            class="text-[8px] font-black uppercase tracking-wider bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md">
                            {{ item.type }}
                          </span>
                        </div>
                      </div>
                      <div class="p-3 space-y-1.5">
                        <div class="text-xs font-bold truncate text-zinc-900">
                          {{ item.adress }}
                        </div>
                        <div class="text-[10px] text-zinc-500 font-medium">
                          {{ item.ville }} · {{ item.nb_places }} places
                        </div>
                        <div class="flex items-center justify-between pt-2 border-t border-zinc-100 mt-2">
                          <span class="text-xs font-black text-zinc-900">
                            {{ item.prix }} DT<span class="text-[9px] font-normal text-zinc-500">/m</span>
                          </span>
                          <span
                            class="text-[9px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded-md">
                            {{ item.statut }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </router-link>
                </div>

                <!-- Map Display for POI -->
                <div v-if="msg.mapData && msg.mapData.points" class="mt-3">
                  <div class="rounded-xl overflow-hidden border border-zinc-200 shadow-md">
                    <GoogleMap :center="{ lat: msg.mapData.points[0].lat, lng: msg.mapData.points[0].lng }" :zoom="12"
                      style="width: 100%; height: 300px">
                      <AdvancedMarker v-for="point in msg.mapData.points" :key="point.id" :options="{
                        position: { lat: point.lat, lng: point.lng },
                        title: point.name
                      }" />
                    </GoogleMap>
                  </div>
                </div>
              </div>
            </div>

            <!-- Timestamp -->
            <div class="text-[9px] font-bold text-zinc-400 px-1 transition-opacity duration-200"
              :class="msg.role === 'user' ? 'text-right' : 'text-left'">
              {{ formatTime(msg.createdAt) }}
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="flex justify-start">
            <div class="bubble bot-bubble">
              <div class="flex items-center gap-2 text-zinc-500">
                <Loader2 :size="14" class="animate-spin" />
                <span class="text-xs font-medium">Chargement de la conversation...</span>
              </div>
            </div>
          </div>
        </q-card-section>

        <!-- Input Bar -->
        <q-card-section class="p-3.5 border-t border-zinc-200 bg-white sticky bottom-0">
          <q-form @submit.prevent="handleSendMessage" class="flex items-center gap-2.5">
            <div class="flex-1 relative">
              <q-input v-model="draft" outlined dense placeholder="Ex: studio à Kairouan max 400DT..." maxlength="400"
                bg-color="white"
                class="rounded-xl text-xs font-medium shadow-sm hover:shadow-md transition-shadow duration-200"
                :disable="isSending" @keydown.enter.exact.prevent="handleSendMessage" />
            </div>
            <q-btn type="submit" no-caps unelevated
              class="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl px-4 h-10 font-bold text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
              :loading="isSending">
              <Send :size="16" />
            </q-btn>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { watch, onMounted } from 'vue'
import {
  MessageSquare,
  X,
  Send,
  ChevronDown,
  Loader2,
  Database,
  Brain,
  CheckCircle,
  Trash2,
} from 'lucide-vue-next'
import { useChat } from '@/composables/useChat'
import { GoogleMap, AdvancedMarker } from 'vue3-google-map'

// Props
const props = defineProps({
  userId: {
    type: [String, Number],
    default: 'guest',
  },
  agentId: {
    type: [String, Number],
    default: 1,
  },
})

// Use composable
const {
  draft,
  isOpen,
  messages,
  isLoading,
  isSending,
  messagesContainer,
  sendMessage: handleSendMessage,
  clearConversation: handleClearChat,
  loadConversation,
  scrollToBottom,
  formatTime,
  parsePhotos,
  renderMarkdown,
} = useChat({
  userId: props.userId,
  agentId: props.agentId,
})

// Watchers
watch(
  () => props.userId,
  () => {
    loadConversation()
  },
  { immediate: true }
)

watch(isOpen, async (open) => {
  if (open) {
    await scrollToBottom()
  }
})

watch(
  () => props.agentId,
  () => {
    loadConversation()
  }
)

// Lifecycle
onMounted(() => {
  loadConversation()
})
</script>

<style scoped>
.chat-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2200;
}

.chat-panel {
  width: min(420px, 100dvw);
  height: 100dvh;
}

.bubble {
  padding: 12px 14px;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  animation: slideIn 0.3s ease-out;
}

.user-bubble {
  background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
  color: #ffffff;
  max-width: 85%;
}

.bot-bubble {
  background: #ffffff;
  color: #18181b;
  border: 1px solid #e4e4e7;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-in-out;
}

.chat-card-link {
  text-decoration: none;
  color: inherit;
}

.chat-card-link:hover {
  text-decoration: none;
}

.wrap-break-word {
  word-wrap: break-word;
  word-break: break-word;
}

/* Scrollbar personnalisée */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f4f4f5;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #d4d4d8;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a1a1aa;
}
</style>
