<template>
  <div>
    <q-btn round unelevated no-caps
      class="chat-fab bg-zinc-900! hover:bg-zinc-800 text-white shadow-xl transition-transform duration-200"
      @click="isOpen = true">
      <MessageSquare :size="22" class="text-white" />
    </q-btn>

    <q-dialog v-model="isOpen" position="right" full-height maximized>
      <q-card class="chat-panel flex flex-col no-wrap bg-white border-l border-zinc-200">

        <!-- Header -->
        <q-card-section class="flex items-center justify-between p-4 border-b border-zinc-100">
          <div class="space-y-0.5">
            <div class="text-sm font-black tracking-tight text-zinc-900">Assistant IA</div>
            <div class="text-[11px] text-zinc-400 font-medium">Recherche & Concierge automatisé</div>
          </div>
          <q-btn flat round dense class="text-zinc-400 hover:text-zinc-900" @click="isOpen = false">
            <X :size="18" />
          </q-btn>
        </q-card-section>

        <!-- Messages -->
        <q-card-section ref="messagesContainer"
          class="chat-messages flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/60">
          <div v-if="messages.length === 0" class="text-center py-8 space-y-2">
            <p class="text-xs font-bold text-zinc-800">Bienvenue sur TakeLog Chat</p>
            <p class="text-[11px] text-zinc-400 max-w-50 mx-auto leading-relaxed">
              Dites-moi où vous cherchez un logement et quel est votre budget max.
            </p>
          </div>

          <div v-for="msg in messages" :key="msg.id" class="space-y-1">
            <div :class="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
              <div :class="msg.role === 'user' ? 'bubble user-bubble' : 'bubble bot-bubble w-full max-w-[85%]'">

                <!-- Thinking block -->
                <div v-if="msg.thinking || msg.isThinking"
                  class="mb-2.5 pl-3 py-1.5 bg-zinc-50/80 border-l-2 rounded-r-md transition-all duration-200"
                  :class="msg.isThinking ? 'border-zinc-400 shadow-xs' : 'border-emerald-500 bg-emerald-50/20'">
                  <div class="flex items-center justify-between">
                    <button type="button" @click="msg.showThinking = !msg.showThinking"
                      class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-800 transition-colors">
                      <ChevronDown :size="12" :class="{ 'transform -rotate-90': !msg.showThinking }"
                        class="transition-transform" />
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
                    class="text-[11px] text-zinc-600 font-sans mt-2 leading-relaxed whitespace-pre-line border-t border-zinc-100 pt-1.5">
                    {{ msg.thinking || 'Analyse de la demande...' }}
                  </p>
                </div>

                <!-- Tool status badge -->
                <div v-if="msg.toolStatus"
                  class="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 border border-zinc-200 rounded px-2 py-1">
                  <!-- Spinner while results are still loading -->
                  <Loader2 :size="11" class="animate-spin text-zinc-600" v-if="msg.toolLoading" />
                  <Database :size="11" class="text-zinc-900" v-else />
                  <span>{{ msg.toolStatus }}</span>
                </div>

                <!-- Text body -->
                <div v-if="msg.text" class="prose prose-xs text-xs leading-relaxed m-0 wrap-break-word"
                  v-html="renderMarkdown(msg.text)" />

                <!-- Logement cards -->
                <div v-if="msg.widgetData && msg.widgetData.length > 0" class="mt-3 space-y-2">
                  <router-link v-for="item in msg.widgetData" :key="item.id" :to="`/logements/${item.id}`"
                    class="chat-card-link block">
                    <div
                      class="bg-white rounded-lg border border-zinc-200 overflow-hidden text-zinc-900 max-w-65 shadow-sm">
                      <div class="relative aspect-16/10 bg-zinc-100">
                        <img :src="parsePhotos(item.photos)[0]" class="w-full h-full object-cover" />
                        <div class="absolute top-1.5 left-1.5">
                          <span
                            class="text-[8px] font-black uppercase tracking-wider bg-white px-1.5 py-0.5 rounded shadow-xs">
                            {{ item.type }}
                          </span>
                        </div>
                      </div>
                      <div class="p-3 space-y-1">
                        <div class="text-xs font-bold truncate text-zinc-900">{{ item.adress }}</div>
                        <div class="text-[10px] text-zinc-400 font-medium">{{ item.ville }} · {{ item.nb_places }}
                          places
                        </div>
                        <div class="flex items-center justify-between pt-1 border-t border-zinc-100 mt-2">
                          <span class="text-xs font-black text-zinc-900">
                            {{ item.prix }} DT<span class="text-[9px] font-normal text-zinc-400">/m</span>
                          </span>
                          <span class="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">{{ item.statut
                            }}</span>
                        </div>
                      </div>
                    </div>
                  </router-link>
                </div>

              </div>
            </div>
            <div class="text-[9px] font-bold text-zinc-400 px-1"
              :class="msg.role === 'user' ? 'text-right' : 'text-left'">
              {{ formatTime(msg.createdAt) }}
            </div>
          </div>
        </q-card-section>

        <!-- Input bar -->
        <q-card-section class="p-3 border-t border-zinc-100 bg-white">
          <q-form @submit.prevent="sendMessage" class="flex items-center gap-2">
            <div class="flex-1">
              <q-input v-model="draft" outlined dense placeholder="Ex: studio à Kairouan max 400DT..." maxlength="400"
                bg-color="zinc-50" class="rounded-lg text-xs font-medium" :disable="sending"
                @keydown.enter.exact.prevent="sendMessage" />
            </div>
            <q-btn type="submit" no-caps unelevated
              class="bg-zinc-900! hover:bg-zinc-800 text-white rounded-lg px-3 h-9 font-bold text-xs"
              :loading="sending">
              <Send :size="14" />
            </q-btn>
          </q-form>
        </q-card-section>

      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { MessageSquare, X, Send, ChevronDown, Loader2, Database, Brain, CheckCircle } from 'lucide-vue-next'
import { streamFlow } from 'genkit/beta/client'
import MarkdownIt from 'markdown-it'
import { useChatStore } from '@/stores/chat'

// ─── Props ───────────────────────────────────────────────────────────────────
const props = defineProps({
  userId: { type: [String, Number], default: 'guest' },
  agentId: { type: [String, Number], default: 1 },
})

// ─── State ───────────────────────────────────────────────────────────────────
const isOpen = ref(false)
const draft = ref('')
const messagesContainer = ref(null)
const chatStore = useChatStore()
const messages = computed(() => chatStore.getConversation(props.userId, props.agentId))
const sending = computed(() => chatStore.isSendingConversation(props.userId, props.agentId))

// ─── Markdown renderer ───────────────────────────────────────────────────────
const md = new MarkdownIt({ html: false, linkify: true, typographer: true })
function renderMarkdown(text) { return text ? md.render(text) : '' }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function parsePhotos(photoInput) {
  const fallback = ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80']
  if (!photoInput) return fallback
  try { return typeof photoInput === 'string' ? JSON.parse(photoInput) : photoInput }
  catch { return [photoInput] }
}

async function scrollToBottom() {
  await nextTick()
  const el = messagesContainer.value?.$el ?? messagesContainer.value
  if (el) el.scrollTop = el.scrollHeight
}

async function loadMessages() {
  try {
    await chatStore.loadConversation(props.userId, props.agentId)
  } catch (err) {
    console.error('[chat] loadMessages error:', err)
  }
}

// ─── Send message ─────────────────────────────────────────────────────────────
async function sendMessage() {
  const text = draft.value.trim()
  if (!text || sending.value) return

  // BUG FIXED #8 — only forward user/model turns to avoid polluting the
  // model's context window with tool/widget messages it doesn't understand.
  const chatHistory = messages.value
    .filter(m => (m.role === 'user' || m.role === 'bot') && m.backendRole !== 'tools')
    .slice(-6)
    .map(m => ({
      role: m.role === 'bot' ? 'model' : 'user',
      content: m.text ?? '',
    }))

  chatStore.appendMessage(props.userId, props.agentId, {
    id: `${Date.now()}_u`,
    role: 'user',
    text,
    createdAt: new Date().toISOString(),
    thinking: '',
    showThinking: false,
    isThinking: false,
    toolStatus: null,
    toolLoading: false,
    widgetData: null,
  })
  draft.value = ''
  chatStore.setSending(props.userId, props.agentId, true)


  const userId = Number(props.userId)
  const agentId = Number(props.agentId)
  if (Number.isFinite(userId) && Number.isFinite(agentId)) {
    try {
      await chatStore.saveMessageToApi({
        expediteurId: userId,
        destinataireId: agentId,
        role: 'user',
        contenu: text,
      })
    } catch (err) {
      console.error('[chat] save user message failed:', err)
    }
  }



  const botId = `${Date.now()}_b`
  const botMsg = {
    id: botId,
    role: 'bot',
    text: '',
    thinking: '',
    showThinking: true,
    isThinking: true,
    toolStatus: null,
    toolLoading: false,   // ← separate flag so spinner is accurate
    widgetData: null,
    createdAt: new Date().toISOString(),
  }
  chatStore.appendMessage(props.userId, props.agentId, botMsg)

  // Reactive reference into the messages array
  const bot = messages.value.find(m => m.id === botId)
  await scrollToBottom()
  try {
    const result = streamFlow({
      url: '/api/ai/agent-flow',
      input: {
        message: text,
        userId: String(props.userId),
        chatHistory,
      },
    })

    for await (const payload of result.stream) {

      if (!payload) continue

      switch (payload.type) {
        case 'thinking':
          bot.isThinking = true
          bot.thinking += payload.content
          break

        case 'text':
          if (bot.isThinking) {
            bot.isThinking = false
            bot.showThinking = false
          }
          bot.text += payload.content
          break

        case 'tool_call':
          if (bot.isThinking) {
            bot.isThinking = false
            bot.showThinking = false
          }
          bot.toolStatus = 'Recherche en cours dans la base de données…'
          bot.toolLoading = true
          break

        case 'tool_result': {
          if (bot.isThinking) {
            bot.isThinking = false
            bot.showThinking = false
          }
          const { data, count } = payload.result ?? {}
          bot.toolLoading = false
          if (Array.isArray(data)) {
            bot.widgetData = data
            bot.toolStatus = count === 0
              ? 'Aucun logement trouvé'
              : `${count} logement${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`
          } else {
            bot.toolStatus = 'Résultats reçus'
          }
          break
        }

        case 'error':
          console.error('[agent] error chunk:', payload.message)
          bot.isThinking = false
          bot.showThinking = false
          bot.text += '\n\n⚠️ Une erreur est survenue lors de la recherche.'
          bot.toolLoading = false
          break
      }

      await scrollToBottom()
    }

    if (bot?.text && Number.isFinite(userId) && Number.isFinite(agentId)) {
      try {
        await chatStore.saveMessageToApi({
          expediteurId: agentId,
          destinataireId: userId,
          role: 'model',
          contenu: bot.text,
        })
      } catch (err) {
        console.error('[chat] save bot message failed:', err)
      }
    }

    if (bot.widgetData && Number.isFinite(userId) && Number.isFinite(agentId)) {
      try {
        await chatStore.saveWidgetDataToApi({
          agentId,
          userId,
          data: bot.widgetData,
          role: 'tools',
        })
      } catch (err) {
        console.error('[chat] save widget data failed:', err)
      }

    }

  } catch (err) {
    console.error('[sendMessage] fatal:', err)
    if (bot) {
      bot.isThinking = false
      bot.showThinking = false
      bot.text = '⚠️ Une erreur de communication est survenue. Veuillez réessayer.'
      bot.toolLoading = false
    }
  } finally {
    if (bot) {
      bot.isThinking = false
    }
    chatStore.setSending(props.userId, props.agentId, false)
    await scrollToBottom()
  }
}

// ─── Watchers / lifecycle ────────────────────────────────────────────────────
watch(() => props.userId, () => loadMessages(), { immediate: true })
watch(isOpen, async (open) => { if (open) await scrollToBottom() })
watch(() => props.agentId, () => loadMessages())
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
  padding: 10px 12px;
  border-radius: 12px;
}

.user-bubble {
  background-color: #18181b;
  color: #ffffff;
  border-bottom-right-radius: 2px;
}

.bot-bubble {
  background-color: #f4f4f5;
  color: #18181b;
  border-bottom-left-radius: 2px;
  border: 1px solid #e4e4e7;
}

:deep(.prose p) {
  margin: 0 0 0.5rem 0;
}

:deep(.prose p:last-child) {
  margin-bottom: 0;
}

:deep(.prose strong) {
  font-weight: 800;
  color: #000;
}

:deep(.prose ul) {
  margin: 0.25rem 0;
  padding-left: 1.25rem;
}

.chat-card-link {
  text-decoration: none;
}
</style>
