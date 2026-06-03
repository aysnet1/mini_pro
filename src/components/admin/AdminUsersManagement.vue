<template>
  <q-card flat bordered class="admin-card">
    <q-card-section class="row items-center justify-between q-gutter-md header-section">
      <div class="title-wrap">
        <div class="text-h6 text-weight-bold">Gestion des utilisateurs</div>
        <div class="text-caption text-grey-7">Créer, modifier et supprimer les comptes.</div>
      </div>

      <div class="row items-center q-gutter-sm controls-wrap">
        <q-select v-model="roleFilter" :options="roleFilterOptions" emit-value map-options dense outlined
          label="Filtre rôle" style="min-width: 170px" class="control-field" />
        <q-select v-model="newUserRole" :options="roleOptions" emit-value map-options dense outlined
          label="Rôle nouveau" style="min-width: 170px" class="control-field" />
        <q-btn no-caps color="dark" icon="add" label="Ajouter" @click="openCreateUser" class="action-btn" />
        <q-btn flat no-caps icon="refresh" label="Actualiser" @click="fetchUsers" :loading="usersLoading"
          class="action-btn" />
      </div>
    </q-card-section>

    <q-separator />

    <q-table flat :rows="filteredUsers" :columns="userColumns" row-key="id" :loading="usersLoading"
      :pagination="{ rowsPerPage: 8 }" class="users-table">
      <template #body-cell-role="props">
        <q-td :props="props">
          <q-badge :color="roleColor(props.row.role)" text-color="white" :label="roleLabel(props.row.role)"
            class="role-badge" />
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props" class="q-gutter-xs">
          <q-btn flat dense icon="edit" color="dark" @click="openEditUser(props.row)">
            <q-tooltip>Modifier</q-tooltip>
          </q-btn>
          <q-btn flat dense icon="delete" color="negative" :disable="isCurrentUser(props.row)"
            @click="confirmDeleteUser(props.row)">
            <q-tooltip>{{ isCurrentUser(props.row) ? 'Action bloquée sur votre compte' : 'Supprimer'
            }}</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </q-card>

  <q-dialog v-model="showUserDialog" persistent>
    <q-card style="min-width: 540px; max-width: 95vw; border-radius: 16px;">
      <q-card-section class="row items-center justify-between dialog-title-row">
        <div class="text-subtitle1 text-weight-bold">
          {{ userDialogMode === 'create' ? 'Créer un utilisateur' : 'Modifier utilisateur' }}
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form class="q-gutter-md dialog-form" @submit.prevent="saveUser">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <q-input v-model="userForm.nom" label="Nom" outlined dense :rules="[requiredRule]" class="w-full" />
            <q-input v-model="userForm.prenom" label="Prénom" outlined dense :rules="[requiredRule]" class="w-full" />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <q-input v-model="userForm.email" type="email" label="Email" outlined dense
              :rules="[requiredRule, emailRule]" class="w-full" />
            <q-input v-model="userForm.tel" label="Téléphone" outlined dense :rules="[phoneRule]" class="w-full" />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <q-select v-model="userForm.role" :options="roleOptions" emit-value map-options label="Rôle" outlined dense
              :rules="[requiredRule]" class="w-full" />
            <q-input v-model="userForm.password" :type="showPassword ? 'text' : 'password'"
              :label="userDialogMode === 'create' ? 'Mot de passe' : 'Mot de passe (optionnel)'" outlined dense
              :rules="userDialogMode === 'create' ? [requiredRule] : []" class="w-full">
              <template #append>
                <q-btn flat round dense :icon="showPassword ? 'visibility_off' : 'visibility'"
                  @click="showPassword = !showPassword" />
              </template>
            </q-input>
          </div>

          <div v-if="userForm.role === 'etudiant'" class="student-form-block q-gutter-md">


            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <q-input v-model="userForm.universite" label="Université" outlined dense class="w-full">
                <template #prepend>
                  <q-icon name="school" />
                </template>
              </q-input>
              <q-select v-model="userForm.recherche_ville" :options="villeOptions" use-input input-debounce="0"
                @filter="filterVilles" clearable label="Ville recherchée" outlined dense class="w-full">
                <template #prepend>
                  <q-icon name="location_city" />
                </template>
              </q-select>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <q-input v-model.number="userForm.budget" type="number" min="0" label="Budget mensuel (DT)" outlined dense
                class="w-full">
                <template #prepend>
                  <q-icon name="payments" />
                </template>
              </q-input>
              <q-input v-model="userForm.habitudes" type="textarea" autogrow maxlength="220" counter
                label="Habitudes / Préférences" outlined dense class="w-full" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4" v-if="userForm.role === 'proprietaire'">
            <q-input v-model="userForm.adress" label="Adresse" outlined dense class="w-full" />
            <q-input v-model="userForm.type" label="Type propriétaire" outlined dense class="w-full" />
          </div>

          <div class="flex justify-end gap-2 pt-1">
            <q-btn flat no-caps label="Annuler" color="grey-8" v-close-popup />
            <q-btn no-caps color="dark" :label="userDialogMode === 'create' ? 'Créer' : 'Enregistrer'" type="submit"
              :loading="savingUser" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { tunisianVilles } from '@/helpers/tunisiaCities'

const $q = useQuasar()
const authStore = useAuthStore()

const users = ref([])
const usersLoading = ref(false)
const roleFilter = ref('all')
const newUserRole = ref('etudiant')

const showUserDialog = ref(false)
const userDialogMode = ref('create')
const savingUser = ref(false)
const showPassword = ref(false)
const currentEditingId = ref(null)

const roleOptions = [
  { label: 'Etudiant', value: 'etudiant' },
  { label: 'Proprietaire', value: 'proprietaire' },
  { label: 'Admin', value: 'admin' }
]

const roleFilterOptions = [
  { label: 'Tous', value: 'all' },
  ...roleOptions
]

const villeOptions = ref([...tunisianVilles])

const userForm = reactive({
  nom: '',
  prenom: '',
  email: '',
  tel: '',
  role: 'etudiant',
  password: '',
  universite: '',
  recherche_ville: '',
  budget: null,
  habitudes: '',
  adress: '',
  type: ''
})

const userColumns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'nom', label: 'Nom', field: 'nom', align: 'left', sortable: true },
  { name: 'prenom', label: 'Prenom', field: 'prenom', align: 'left', sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left', sortable: true },
  { name: 'tel', label: 'Telephone', field: 'tel', align: 'left' },
  { name: 'role', label: 'Role', field: 'role', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' }
]

const filteredUsers = computed(() => {
  if (roleFilter.value === 'all') return users.value
  return users.value.filter((row) => row.role === roleFilter.value)
})

const requiredRule = (val) => !!val || 'Champ obligatoire'
const emailRule = (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Email invalide'
const phoneRule = (val) => !val || /^[0-9+\s-]{8,15}$/.test(val) || 'Téléphone invalide'

function filterVilles(val, update) {
  update(() => {
    const needle = `${val || ''}`.trim().toLowerCase()
    if (!needle) {
      villeOptions.value = [...tunisianVilles]
      return
    }
    villeOptions.value = tunisianVilles.filter((ville) =>
      ville.toLowerCase().includes(needle)
    )
  })
}

function roleColor(role) {
  if (role === 'admin') return 'negative'
  if (role === 'proprietaire') return 'primary'
  return 'dark'
}

function roleLabel(role) {
  if (role === 'etudiant') return 'Etudiant'
  if (role === 'proprietaire') return 'Proprietaire'
  if (role === 'admin') return 'Admin'
  return role || 'N/A'
}

function authHeaders(contentType = 'application/json') {
  return contentType
    ? { 'Content-Type': contentType, ...authStore.authHeader }
    : { ...authStore.authHeader }
}

function isCurrentUser(row) {
  return Number(row.id) === Number(authStore.user?.id)
}

function resetUserForm() {
  userForm.nom = ''
  userForm.prenom = ''
  userForm.email = ''
  userForm.tel = ''
  userForm.role = 'etudiant'
  userForm.password = ''
  userForm.universite = ''
  userForm.recherche_ville = ''
  userForm.budget = null
  userForm.habitudes = ''
  userForm.adress = ''
  userForm.type = ''
  currentEditingId.value = null
  showPassword.value = false
}

function openCreateUser() {
  userDialogMode.value = 'create'
  resetUserForm()
  userForm.role = newUserRole.value
  showUserDialog.value = true
}

async function openEditUser(row) {
  userDialogMode.value = 'edit'
  resetUserForm()
  currentEditingId.value = row.id

  try {
    const response = await fetch(`/api/users/${row.id}`, {
      headers: authHeaders(null)
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Impossible de charger les details utilisateur')

    userForm.nom = data.nom || row.nom || ''
    userForm.prenom = data.prenom || row.prenom || ''
    userForm.email = data.email || row.email || ''
    userForm.tel = data.tel || row.tel || ''
    userForm.role = data.role || row.role || 'etudiant'
    userForm.universite = data.universite || ''
    userForm.recherche_ville = data.recherche_ville || ''
    userForm.budget = data.budget == null ? null : Number(data.budget)
    userForm.habitudes = data.habitudes || ''
    userForm.adress = data.adress || ''
    userForm.type = data.type || ''

    showUserDialog.value = true
  } catch (err) {
    $q.notify({ color: 'negative', position: 'top', message: err.message || 'Erreur de chargement.' })
  }
}

async function fetchUsers() {
  usersLoading.value = true
  try {
    const response = await fetch('/api/users', {
      headers: authHeaders(null)
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Erreur de chargement des utilisateurs')
    users.value = Array.isArray(data) ? data : []
  } catch (err) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: err.message || 'Impossible de charger les utilisateurs.'
    })
  } finally {
    usersLoading.value = false
  }
}

async function saveUser() {
  savingUser.value = true
  try {
    const payload = {
      nom: userForm.nom?.trim(),
      prenom: userForm.prenom?.trim(),
      email: userForm.email?.trim(),
      tel: userForm.tel?.trim() || null,
      role: userForm.role,
      universite: null,
      recherche_ville: null,
      budget: null,
      habitudes: null,
      adress: null,
      type: null
    }

    if (userForm.role === 'etudiant') {
      payload.universite = userForm.universite?.trim() || null
      payload.recherche_ville = userForm.recherche_ville || null
      payload.budget = userForm.budget === null || userForm.budget === '' ? null : Number(userForm.budget)
      payload.habitudes = userForm.habitudes?.trim() || null
    }

    if (userForm.role === 'proprietaire') {
      payload.adress = userForm.adress?.trim() || null
      payload.type = userForm.type?.trim() || null
    }

    if (userDialogMode.value === 'create') {
      payload.password = userForm.password
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Creation impossible')
      $q.notify({ color: 'positive', position: 'top', message: 'Utilisateur cree avec succes.' })
    } else {
      if (userForm.password) {
        payload.password = userForm.password
      }

      const response = await fetch(`/api/users/${currentEditingId.value}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Mise a jour impossible')
      $q.notify({ color: 'positive', position: 'top', message: 'Utilisateur mis a jour.' })
    }

    showUserDialog.value = false
    await fetchUsers()
  } catch (err) {
    $q.notify({ color: 'negative', position: 'top', message: err.message || 'Erreur lors de la sauvegarde.' })
  } finally {
    savingUser.value = false
  }
}

function confirmDeleteUser(row) {
  if (isCurrentUser(row)) return

  $q.dialog({
    title: 'Supprimer utilisateur',
    message: `Confirmer la suppression de ${row.prenom} ${row.nom} ?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      const response = await fetch(`/api/users/${row.id}`, {
        method: 'DELETE',
        headers: authHeaders(null)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Suppression impossible')

      $q.notify({ color: 'positive', position: 'top', message: 'Utilisateur supprime.' })
      await fetchUsers()
    } catch (err) {
      $q.notify({ color: 'negative', position: 'top', message: err.message || 'Erreur de suppression.' })
    }
  })
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.admin-card {
  border-radius: 16px;
  border-color: #dbe4ee;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
  background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%);
}

.controls-wrap {
  flex-wrap: wrap;
}

.header-section {
  padding-top: 14px;
  padding-bottom: 14px;
}

.title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.control-field {
  background: #ffffff;
}

.action-btn {
  min-height: 38px;
}

.users-table {
  border-radius: 0 0 16px 16px;
}

.role-badge {
  padding-inline: 8px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.dialog-title-row {
  padding-top: 14px;
  padding-bottom: 14px;
}

.dialog-form {
  padding-top: 2px;
}

.student-form-block {
  padding: 10px;
  border: 1px dashed #bfdbfe;
  border-radius: 12px;
  background: #f8fbff;
}

@media (max-width: 768px) {
  .control-field {
    min-width: 100% !important;
  }
}
</style>
