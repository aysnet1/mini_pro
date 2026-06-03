<template>
  <q-layout view="lHh Lpr lFf">

    <q-header flat class="bg-white text-dark border-bottom q-py-sm">
      <q-toolbar class="q-px-xl">
        <q-btn flat dense round @click="toggleLeftDrawer" class="q-mr-md hover-bg-light transition-all text-dark">
          <Menu :size="20" :stroke-width="2" />
        </q-btn>

        <q-toolbar-title class="text-weight-bolder tracking-tight text-dark flex items-center gap-sm">
          <div class="logo-accent-box flex items-center justify-center">
            <Building2 :size="18" :stroke-width="2.5" class="text-dark" />
          </div>
          <span class="text-subtitle1 text-weight-bolder text-dark">TakeLog</span>
        </q-toolbar-title>

        <q-space />

        <div v-if="user" class="row items-center no-wrap q-gutter-x-md">
          <span class="text-body2 text-weight-bold text-dark gt-xs">
            {{ user.prenom }} {{ user.nom }}
          </span>

          <q-btn-dropdown flat no-caps rounded dense menu-self="top right" menu-fit class="profile-dropdown-btn">
            <template v-slot:label>
              <q-avatar size="36px" class="bg-dark text-white text-weight-bold border-avatar shadow-sm">
                <img v-if="user.photo_profil" :src="user.photo_profil" alt="Avatar" class="object-cover" />
                <span v-else class="text-caption text-weight-bold">{{ user.prenom?.charAt(0) }}{{ user.nom?.charAt(0)
                  }}</span>
              </q-avatar>
            </template>

            <q-list class="bg-white text-dark q-pa-md minimal-dropdown-menu">
              <q-item class="q-pb-md border-bottom row items-center no-wrap gap-md">
                <q-avatar size="44px" class="bg-dark text-white text-weight-bold">
                  <img v-if="user.photo_profil" :src="user.photo_profil" alt="Avatar" class="object-cover" />
                  <span v-else>{{ user.prenom?.charAt(0) }}{{ user.nom?.charAt(0) }}</span>
                </q-avatar>
                <div class="column justify-center overflow-hidden">
                  <div class="text-subtitle2 text-weight-bolder text-dark text-ellipsis">{{ user.prenom }} {{ user.nom
                    }}</div>
                  <div class="text-caption text-grey-6 text-ellipsis q-mb-xs">{{ user.email }}</div>
                  <div class="role-badge text-weight-bolder uppercase text-center">{{ roleLabel }}</div>
                </div>
              </q-item>

              <q-item clickable v-close-popup to="/profile" class="rounded-borders q-mt-sm nav-dropdown-item">
                <q-item-section avatar min-width="24px">
                  <User :size="16" :stroke-width="2" />
                </q-item-section>
                <q-item-section class="text-weight-medium text-body2">Mon Profil</q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="handleLogout"
                class="rounded-borders text-negative logout-dropdown-item">
                <q-item-section avatar min-width="24px">
                  <LogOut :size="16" :stroke-width="2" />
                </q-item-section>
                <q-item-section class="text-weight-bold text-body2">Déconnexion</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-toolbar>
    </q-header>

    <q-no-ssr>
      <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="270"
        class="bg-dark text-white column justify-between main-sidebar">
        <div class="q-pa-lg column gap-xl">
          <div class="row items-center gap-md q-px-xs">
            <div class="logo-accent-box-dark flex items-center justify-center">
              <Building2 :size="20" :stroke-width="2.5" class="text-white" />
            </div>
            <span class="text-h6 text-weight-bolder tracking-wider text-white">TakeLog</span>
          </div>

          <div class="column gap-xs">
            <div class="sidebar-category-title text-weight-bolder q-px-sm q-mb-sm">
              Menu principal
            </div>




            <template v-if="user?.role === 'etudiant'">
              <q-item clickable to="/home" active-class="sidebar-item-active" class="sidebar-nav-item rounded-borders">
                <q-item-section avatar class="item-icon-section">
                  <LayoutDashboard :size="18" :stroke-width="2" />
                </q-item-section>
                <q-item-section class="text-weight-medium text-body2">Accueil</q-item-section>
              </q-item>
              <q-item clickable to="/recherche" active-class="sidebar-item-active"
                class="sidebar-nav-item rounded-borders">
                <q-item-section avatar class="item-icon-section">
                  <Search :size="18" :stroke-width="2" />
                </q-item-section>
                <q-item-section class="text-weight-medium text-body2">Explorer</q-item-section>
              </q-item>

              <q-item clickable to="/candidatures" active-class="sidebar-item-active"
                class="sidebar-nav-item rounded-borders">
                <q-item-section avatar class="item-icon-section">
                  <ClipboardList :size="18" :stroke-width="2" />
                </q-item-section>
                <q-item-section class="text-weight-medium text-body2">Mes reservations</q-item-section>
              </q-item>
            </template>

            <template v-else-if="user?.role === 'proprietaire'">
              <q-item clickable to="/mes-logements" active-class="sidebar-item-active"
                class="sidebar-nav-item rounded-borders">
                <q-item-section avatar class="item-icon-section">
                  <Home :size="18" :stroke-width="2" />
                </q-item-section>
                <q-item-section class="text-weight-medium text-body2">Mes Annonces</q-item-section>
              </q-item>

              <q-item clickable to="/reservations" active-class="sidebar-item-active"
                class="sidebar-nav-item rounded-borders">
                <q-item-section avatar class="item-icon-section">
                  <CalendarDays :size="18" :stroke-width="2" />
                </q-item-section>
                <q-item-section class="text-weight-medium text-body2">Réservations reçues</q-item-section>
              </q-item>
            </template>

            <template v-else-if="user?.role === 'admin'">
              <q-item clickable to="/admin/home" active-class="sidebar-item-active"
                class="sidebar-nav-item rounded-borders">
                <q-item-section avatar class="item-icon-section">
                  <LayoutDashboard :size="18" :stroke-width="2" />
                </q-item-section>
                <q-item-section class="text-weight-medium text-body2">Accueil</q-item-section>
              </q-item>

              <q-item clickable to="/admin/users" active-class="sidebar-item-active"
                class="sidebar-nav-item rounded-borders">
                <q-item-section avatar class="item-icon-section">
                  <User :size="18" :stroke-width="2" />
                </q-item-section>
                <q-item-section class="text-weight-medium text-body2">Gestion Utilisateurs</q-item-section>
              </q-item>

              <q-item clickable to="/admin/logements" active-class="sidebar-item-active"
                class="sidebar-nav-item rounded-borders">
                <q-item-section avatar class="item-icon-section">
                  <Home :size="18" :stroke-width="2" />
                </q-item-section>
                <q-item-section class="text-weight-medium text-body2">Gestion Logements</q-item-section>
              </q-item>
            </template>



            <q-item clickable to="/profile" active-class="sidebar-item-active" class="sidebar-nav-item rounded-borders">
              <q-item-section avatar class="item-icon-section">
                <User :size="18" :stroke-width="2" />
              </q-item-section>
              <q-item-section class="text-weight-medium text-body2">Mon Profil</q-item-section>
            </q-item>
          </div>
        </div>

        <div v-if="user" class="q-pa-lg border-top bg-dark-deep column gap-md">
          <div class="row items-center no-wrap gap-md">
            <q-avatar size="38px" class="bg-white text-dark text-weight-bold inner-avatar-border">
              <img v-if="user.photo_profil" :src="user.photo_profil" alt="Avatar" class="object-cover" />
              <span v-else>{{ user.prenom?.charAt(0) }}{{ user.nom?.charAt(0) }}</span>
            </q-avatar>
            <div class="column overflow-hidden">
              <span class="text-body2 text-weight-bold text-white text-ellipsis">{{ user.prenom }} {{ user.nom }}</span>
              <span class="role-badge-dark text-weight-bolder text-uppercase tracking-wider q-mt-xs">{{ roleLabel
                }}</span>
            </div>
          </div>

          <q-btn outline color="white" no-caps
            class="rounded-borders full-width text-caption text-weight-bold q-py-sm clean-outline-action"
            @click="handleLogout">
            <div class="row items-center justify-center gap-sm">
              <LogOut :size="14" :stroke-width="2" />
              <span>Se déconnecter</span>
            </div>
          </q-btn>
        </div>
      </q-drawer>
    </q-no-ssr>

    <q-page-container class="bg-slate-light">
      <router-view />
    </q-page-container>

    <ChatStickyWidget v-if="user?.role === 'etudiant'" :user-id="user?.id" />

  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useQuasar } from 'quasar'

// High fidelity modern design language vector system from Lucide
import {
  Menu, Building2, User, LogOut, Search,
  ClipboardList, Home, CalendarDays,
   LayoutDashboard
} from 'lucide-vue-next'
import ChatStickyWidget from '@/components/chat/ChatStickyWidget.vue'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()

const leftDrawerOpen = ref(true)
const user = computed(() => authStore.user)

const roleLabel = computed(() => {
  if (!user.value) return ''
  if (user.value.role === 'etudiant') return 'Étudiant'
  if (user.value.role === 'proprietaire') return 'Propriétaire'
  if (user.value.role === 'admin') return 'Administrateur'
  return user.value.role
})

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

onMounted(async () => {
  try {
    const isSessionValid = await authStore.fetchProfile()
    if (!isSessionValid) {
      router.replace('/auth/login')
      return
    }
    authStore.loading = false
  } catch {
    router.replace('/auth/login')
  }
})

async function handleLogout() {
  $q.dialog({
    title: 'Déconnexion',
    message: 'Êtes-vous sûr de vouloir vous déconnecter de votre compte ?',
    cancel: {
      flat: true,
      label: 'Annuler',
      color: 'dark'
    },
    ok: {
      unelevated: true,
      label: 'Déconnexion',
      color: 'dark'
    }
  }).onOk(async () => {
    await authStore.logout()
    $q.notify({
      message: 'Déconnexion réussie.',
      color: 'dark',
      position: 'top',
      timeout: 3000
    })
    router.push('/auth/login')
  })
}
</script>

<style scoped>
/* Studio Spatial Helpers */
.gap-xs {
  gap: 4px;
}

.gap-sm {
  gap: 8px;
}

.gap-md {
  gap: 12px;
}

.gap-lg {
  gap: 18px;
}

.gap-xl {
  gap: 32px;
}

.tracking-tight {
  letter-spacing: -0.03em;
}

.tracking-wider {
  letter-spacing: 0.06em;
}

.border-bottom {
  border-bottom: 1px solid #f1f1f4;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bg-slate-light {
  background-color: #fafafa;
}

/* Graphic Logo Context Blocks */
.logo-accent-box {
  width: 32px;
  height: 32px;
  background-color: #f4f4f5;
  border-radius: 8px;
  border: 1px solid #e4e4e7;
}

.logo-accent-box-dark {
  width: 36px;
  height: 36px;
  background-color: #27272a;
  border-radius: 10px;
  border: 1px solid #3f3f46;
}

/* Minimal interactions classes */
.hover-bg-light:hover {
  background-color: #f4f4f5;
}

.profile-dropdown-btn :deep(.q-btn-dropdown__arrow) {
  display: none !important;
}

.border-avatar {
  border: 1px solid #e4e4e7;
}

/* Profile Dropdown Matrix Card styling */
.minimal-dropdown-menu {
  min-width: 260px;
  border-radius: 12px;
  border: 1px solid #e4e4e7;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.role-badge {
  font-size: 9px;
  font-weight: 800;
  color: #18181b;
  background-color: #f4f4f5;
  border: 1px solid #e4e4e7;
  padding: 3px 8px;
  border-radius: 6px;
  width: max-content;
  letter-spacing: 0.05em;
}

.nav-dropdown-item {
  color: #52525b;
  transition: all 0.15s ease;
}

.nav-dropdown-item:hover {
  color: #09090b;
  background-color: #f4f4f5;
}

.logout-dropdown-item {
  transition: all 0.15s ease;
}

.logout-dropdown-item:hover {
  background-color: #fef2f2;
}

/* Navigation Drawer Sidebar layout engine */
.main-sidebar {
  border-right: 1px solid #27272a !important;
}

.sidebar-category-title {
  font-size: 10px;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.sidebar-nav-item {
  color: #a1a1aa;
  min-height: 46px;
  padding: 0 16px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar-nav-item:hover {
  color: #ffffff;
  background-color: #18181b;
}

.item-icon-section {
  min-width: 32px !important;
  padding-right: 0 !important;
  color: inherit;
}

/* Core Dashboard Navigation State Activation */
.sidebar-item-active {
  color: #09090b !important;
  background-color: #ffffff !important;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Dark Bottom Frame Summary Container */
.bg-dark-deep {
  background-color: #09090b;
  border-top: 1px solid #27272a;
}

.inner-avatar-border {
  border: 1px solid #27272a;
}

.role-badge-dark {
  font-size: 9px;
  color: #71717a;
}

.clean-outline-action {
  border: 1px solid #27272a;
  transition: all 0.15s ease;
}

.clean-outline-action:hover {
  background-color: #18181b;
  border-color: #3f3f46;
}
</style>
