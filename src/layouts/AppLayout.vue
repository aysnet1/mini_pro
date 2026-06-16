<template>
  <q-layout view="lHh Lpr lFf">

    <!-- ───── Top Navigation Bar ───── -->
    <q-header flat class="bg-white border-b border-zinc-100 shadow-none py-0">
      <q-toolbar class="h-14 gap-3">

        <!-- Brand -->
        <div class="flex items-center gap-2 select-none">
          <q-avatar class="">
            <q-img src="/app.png" alt="Logo" class="" />
          </q-avatar>
          <span class="text-[15px] font-bold tracking-tight text-zinc-900">TakeLog</span>
        </div>

        <div class="flex-1" />

        <!-- Desktop nav pills (md+) -->
        <nav class="hidden md:flex! items-center gap-1">
          <template v-if="!user">
            <router-link to="/" exact-active-class="nav-active" class="nav-pill">
              <Home :size="15" :stroke-width="2" /><span>Accueil</span>
            </router-link>
            <router-link to="/recherche" exact-active-class="nav-active" class="nav-pill">
              <Search :size="15" :stroke-width="2" /><span>Explorer</span>
            </router-link>
          </template>
          <template v-else-if="user?.role === 'etudiant'">
            <router-link to="/" exact-active-class="nav-active" class="nav-pill">
              <LayoutDashboard :size="15" :stroke-width="2" /><span>Accueil</span>
            </router-link>
            <router-link to="/recherche" exact-active-class="nav-active" class="nav-pill">
              <Search :size="15" :stroke-width="2" /><span>Explorer</span>
            </router-link>
            <router-link to="/candidatures" exact-active-class="nav-active" class="nav-pill">
              <ClipboardList :size="15" :stroke-width="2" /><span>Réservations</span>
            </router-link>

          </template>

        </nav>

        <!-- Auth buttons for guests -->
        <div v-if="!user" class="flex items-center gap-2 ml-2">
          <router-link to="/auth/login" class="nav-pill border border-zinc-200">
            <LogIn :size="15" :stroke-width="2" /><span>Connexion</span>
          </router-link>
          <router-link to="/auth/register"
            class="flex items-center gap-1.5 bg-zinc-900 text-white px-3.5 py-1.5 rounded-lg text-[13px] font-semibold hover:bg-zinc-700 transition-colors no-underline">
            <span>S'inscrire</span>
          </router-link>
        </div>

        <!-- User avatar + dropdown -->
        <div v-if="user" class="flex items-center gap-2 ml-2">
          <q-btn-dropdown flat no-caps dense menu-self="top right" menu-fit class="profile-dropdown-btn p-0">
            <template #label>
              <q-avatar size="34px" class="avatar-ring overflow-hidden">
                <img v-if="user.photo_profil" :src="user.photo_profil" alt="Avatar"
                  class="w-full h-full object-cover" />
                <span v-else
                  class="text-[11px] font-bold text-white bg-zinc-900 w-full h-full flex items-center justify-center">
                  {{ user.prenom?.charAt(0) }}{{ user.nom?.charAt(0) }}
                </span>
              </q-avatar>
            </template>
            <q-list class="dropdown-card">
              <q-item class="pb-3 mb-1 border-b border-zinc-100 flex items-center gap-3">
                <q-avatar size="42px" class="overflow-hidden rounded-full shrink-0">
                  <img v-if="user.photo_profil" :src="user.photo_profil" alt="Avatar"
                    class="w-full h-full object-cover" />
                  <span v-else
                    class="text-sm font-bold text-white bg-zinc-900 w-full h-full flex items-center justify-center">
                    {{ user.prenom?.charAt(0) }}{{ user.nom?.charAt(0) }}
                  </span>
                </q-avatar>
                <div class="flex flex-col min-w-0">
                  <span class="text-[14px] font-bold text-zinc-900 truncate">{{ user.prenom }} {{ user.nom }}</span>
                  <span class="text-[12px] text-zinc-400 truncate mb-1">{{ user.email }}</span>
                  <span class="role-badge">{{ roleLabel }}</span>
                </div>
              </q-item>
              <q-item clickable v-close-popup to="/profile" class="dropdown-item rounded-lg mt-1">
                <q-item-section avatar class="min-w-7!">
                  <User :size="15" :stroke-width="2" />
                </q-item-section>
                <q-item-section class="text-[13px] font-medium">Mon Profil</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="handleLogout" class="dropdown-item-danger rounded-lg">
                <q-item-section avatar class="min-w-7!">
                  <LogOut :size="15" :stroke-width="2" />
                </q-item-section>
                <q-item-section class="text-[13px] font-semibold">Déconnexion</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>

      </q-toolbar>
    </q-header>

    <!-- ───── Page Content ───── -->
    <q-page-container class="bg-zinc-50 pb-17 md:pb-0">
      <router-view v-slot="{ Component }">
        <Suspense>
          <template #default>
            <div class="relative">
              <component :is="Component" />

            </div>
          </template>
          <template #fallback>
            <div class="flex items-center justify-center h-full">
              <q-spinner-dots color="primary" size="50px" />
            </div>
          </template>
        </Suspense>
      </router-view>
    </q-page-container>

    <ChatStickyWidget v-if="user?.role === 'etudiant'" :user-id="user?.id" />

    <!-- ───── Bottom Navigation for guests (mobile only) ───── -->
    <q-footer v-if="!user" class="bottom-nav md:hidden!">
      <router-link to="/" class="bnav-item" exact-active-class="bnav-active">
        <Home :size="22" :stroke-width="1.8" />
        <span>Accueil</span>
      </router-link>
      <router-link to="/recherche" class="bnav-item" exact-active-class="bnav-active">
        <Search :size="22" :stroke-width="1.8" />
        <span>Explorer</span>
      </router-link>
      <router-link to="/auth/login" class="bnav-item" exact-active-class="bnav-active">
        <LogIn :size="22" :stroke-width="1.8" />
        <span>Connexion</span>
      </router-link>
    </q-footer>

    <!-- ───── Bottom Navigation (mobile only) ───── -->
    <q-footer v-if="user" class="bottom-nav md:hidden! bg-white">

      <!-- Regular tabs for etudiant -->
      <template v-if="user.role === 'etudiant'">
        <router-link to="/" class="bnav-item" exact-active-class="bnav-active">
          <Home :size="22" :stroke-width="1.8" />
          <span>Accueil</span>
        </router-link>

        <router-link to="/recherche" class="bnav-item" exact-active-class="bnav-active">
          <Search :size="22" :stroke-width="1.8" />
          <span>Explorer</span>
        </router-link>

        <!-- Agent IA — floating centre button -->
        <router-link to="/messages" class="bnav-agent">
          <div class="bnav-agent-circle">
            <Bot :size="24" :stroke-width="2" />
          </div>
          <span>Agent IA</span>
        </router-link>

        <router-link to="/candidatures" class="bnav-item" exact-active-class="bnav-active">
          <ClipboardList :size="22" :stroke-width="1.8" />
          <span>Réservations</span>
        </router-link>

        <router-link to="/profile" class="bnav-item" exact-active-class="bnav-active">
          <CircleUserRound :size="22" :stroke-width="1.8" />
          <span>Profil</span>
        </router-link>
      </template>

    </q-footer>

  </q-layout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useQuasar } from 'quasar'
import {
  User, LogOut, Search,
  ClipboardList, Home,
  LayoutDashboard, Bot, CircleUserRound, LogIn
} from 'lucide-vue-next'
import ChatStickyWidget from '@/components/chat/ChatStickyWidget.vue'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
await authStore.fetchProfile()
const user = computed(() => authStore.user)

const roleLabel = computed(() => {
  if (!user.value) return ''
  if (user.value.role === 'etudiant') return 'Étudiant'
  if (user.value.role === 'proprietaire') return 'Propriétaire'
  if (user.value.role === 'admin') return 'Administrateur'
  return user.value.role
})

onMounted(async () => {

})

async function handleLogout() {
  $q.dialog({
    title: 'Déconnexion',
    message: 'Êtes-vous sûr de vouloir vous déconnecter de votre compte ?',
    cancel: { flat: true, label: 'Annuler', color: 'dark' },
    ok: { unelevated: true, label: 'Déconnexion', color: 'dark' }
  }).onOk(async () => {
    await authStore.logout()
    $q.notify({ message: 'Déconnexion réussie.', color: 'dark', position: 'top', timeout: 3000 })
    router.push('/auth/login')
  })
}
</script>

<style scoped>
/* ── Dropdown arrow hidden ── */
.profile-dropdown-btn :deep(.q-btn-dropdown__arrow) {
  display: none !important;
}

.profile-dropdown-btn :deep(.q-btn__content) {
  padding: 0;
}

/* ── Avatar ── */
.avatar-ring {
  border: 2px solid #e4e4e7;
  border-radius: 50%;
  background: #18181b;
  color: #fff;
}

/* ── Dropdown card ── */
.dropdown-card {
  min-width: 260px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e4e4e7;
  box-shadow: 0 20px 40px -8px rgba(0, 0, 0, .12), 0 4px 12px -4px rgba(0, 0, 0, .06);
  padding: 12px;
}

.role-badge {
  display: inline-flex;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: #18181b;
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  padding: 2px 8px;
  border-radius: 6px;
  width: max-content;
}

.dropdown-item {
  color: #52525b;
  border-radius: 8px;
  transition: background .15s, color .15s;
}

.dropdown-item:hover {
  background: #f4f4f5;
  color: #09090b;
}

.dropdown-item-danger {
  color: #dc2626;
  border-radius: 8px;
  transition: background .15s;
}

.dropdown-item-danger:hover {
  background: #fef2f2;
}

/* ── Desktop nav pills ── */
.nav-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #52525b;
  text-decoration: none;
  transition: background .15s, color .15s;
}

.nav-pill:hover {
  background: #f4f4f5;
  color: #09090b;
}

.nav-active {
  background: #18181b !important;
  color: #fff !important;
  font-weight: 600;
}

/* ── Bottom navigation bar ── */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: 64px;
  background: #ffffff;
  border-top: 1px solid #e4e4e7;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 4px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, .06);
}

/* Regular tab item */
.bnav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
  text-decoration: none;
  color: #a1a1aa;
  font-size: 10px;
  font-weight: 500;
  padding: 6px 4px;
  border-radius: 10px;
  transition: color .18s;
}

.bnav-item span {
  line-height: 1;
}

.bnav-active {
  color: #09090b !important;
  font-weight: 700;
}

.bnav-active svg {
  stroke: #09090b;
}

/* Agent IA centre button */
.bnav-agent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 1;
  text-decoration: none;
  color: #a1a1aa;
  font-size: 10px;
  font-weight: 500;
  position: relative;
  padding-top: 0;
  margin-top: -20px;
}

.bnav-agent-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 18px rgba(9, 9, 11, .35);
  border: 3px solid #fff;
  transition: transform .18s, box-shadow .18s;
}

.bnav-agent:active .bnav-agent-circle,
.bnav-agent.router-link-active .bnav-agent-circle {
  transform: scale(0.94);
  box-shadow: 0 2px 10px rgba(9, 9, 11, .25);
}

.bnav-agent.router-link-active {
  color: #09090b;
  font-weight: 700;
}

.bnav-agent span {
  line-height: 1;
  margin-top: 2px;
}
</style>
