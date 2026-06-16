<template>
  <q-page class="simple-page">
    <div class="simple-wrap">
      <div v-if="authStore.loading" class="loading-box">
        <q-spinner-tail color="dark" size="46px" />
        <p>Chargement de votre espace...</p>
      </div>

      <template v-else-if="user">
        <ProfileHeroCard :user="user" :initials="initials" @edit="openEditForm" @logout="handleLogout" />
        <ProfileInfoGrid :user="user" :full-name="fullName" :role-label="roleLabel" />
      </template>

      <div v-else class="empty-box">
        <AlertCircle class="w-10 h-10" />
        <p>Session introuvable. Veuillez vous reconnecter.</p>
        <q-btn no-caps unelevated color="dark" label="Se connecter" to="/auth/login" class="q-mt-sm" />
      </div>
    </div>

    <ProfileEditDialog v-model="showEditDialog" :initial-form="editForm" :saving="saving" :user-role="user?.role"
      @submit="handleUpdateProfile" />
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useQuasar } from 'quasar'
import { AlertCircle } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import ProfileHeroCard from '@/components/profile/ProfileHeroCard.vue'
import ProfileInfoGrid from '@/components/profile/ProfileInfoGrid.vue'
import ProfileEditDialog from '@/components/profile/ProfileEditDialog.vue'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)


const saving = ref(false)
const showEditDialog = ref(false)

const editForm = ref({
  nom: '',
  prenom: '',
  email: '',
  tel: '',
  photo_profil: '',
  budget: null,
  habitudes: '',
  universite: '',
  recherche_ville: ''
})

const initials = computed(() => {
  const first = user.value?.prenom?.charAt(0) || ''
  const last = user.value?.nom?.charAt(0) || ''
  return `${first}${last}`.toUpperCase() || 'U'
})

const fullName = computed(() => {
  const first = user.value?.prenom || ''
  const last = user.value?.nom || ''
  return `${first} ${last}`.trim() || 'Non renseigné'
})

const roleLabel = computed(() => {
  if (!user.value?.role) return 'Non défini'
  if (user.value.role === 'etudiant') return 'Étudiant'
  if (user.value.role === 'proprietaire') return 'Propriétaire'
  if (user.value.role === 'admin') return 'Administrateur'
  return user.value.role
})



async function handleLogout() {
  await authStore.logout()
  $q.notify({
    message: 'Déconnexion réussie.',
    color: 'dark',
    position: 'top',
    timeout: 2500
  })
  router.push('/auth/login')
}

function openEditForm() {
  if (!user.value) return

  editForm.value = {
    nom: user.value.nom || '',
    prenom: user.value.prenom || '',
    email: user.value.email || '',
    tel: user.value.tel || '',
    photo_profil: user.value.photo_profil || '',
    budget: user.value.budget ?? null,
    habitudes: user.value.habitudes || '',
    universite: user.value.universite || '',
    recherche_ville: user.value.recherche_ville || ''
  }

  showEditDialog.value = true
}

async function handleUpdateProfile(payload) {
  if (!user.value?.id) return

  saving.value = true
  try {
    editForm.value = { ...payload }
    const response = await fetch(`/api/users/${user.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authStore.authHeader
      },
      body: JSON.stringify(editForm.value)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Mise à jour impossible')
    }

    await authStore.fetchProfile()
    showEditDialog.value = false
    $q.notify({
      message: 'Profil mis à jour.',
      color: 'positive',
      position: 'top',
      timeout: 2200
    })
  } catch (err) {
    $q.notify({
      message: err.message || 'Erreur lors de la mise à jour.',
      color: 'negative',
      position: 'top',
      timeout: 2600
    })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.simple-page {
  min-height: 100vh;
  padding: 1.25rem;
  background:
    radial-gradient(circle at 0% 0%, rgba(148, 163, 184, 0.14), transparent 32%),
    radial-gradient(circle at 100% 100%, rgba(100, 116, 139, 0.12), transparent 34%),
    #f8fafc;
}

.simple-wrap {
  max-width: 920px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-family: "Manrope", "Segoe UI", sans-serif;
}

.loading-box,
.empty-box {
  min-height: 48vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  color: #334155;
}
</style>
