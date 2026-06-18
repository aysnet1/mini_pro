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

    <ChatStickyWidget v-if="user?.role === 'etudiant' && $q.screen.gt.sm" :user-id="user?.id" />

    <!-- ───── Bottom Navigation for guests (mobile only) ───── -->
    <q-footer v-if="!user && $q.screen.lt.md" class="bottom-nav">
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
    <q-footer v-if="user && $q.screen.lt.md" class="bottom-nav bg-white">

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



        <ChatStickyWidget v-if="user?.role === 'etudiant' && $q.screen.lt.sm" :user-id="user?.id" />




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
  LayoutDashboard, CircleUserRound, LogIn
} from 'lucide-vue-next'
import ChatStickyWidget from '@/components/chat/ChatWidget.vue'

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
