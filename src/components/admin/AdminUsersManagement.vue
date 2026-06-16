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
          <q-btn flat dense :icon="props.row.is_disabled ? 'check_circle' : 'block'"
            :color="props.row.is_disabled ? 'positive' : 'warning'" @click="toggleUserStatus(props.row)"
            :disable="isCurrentUser(props.row)">
            <q-tooltip>{{ props.row.is_disabled ? 'Activer' : 'Désactiver' }}</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
  </q-card>


</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'

const $q = useQuasar()
const authStore = useAuthStore()

const users = ref([])
const usersLoading = ref(false)
const roleFilter = ref('all')

const roleOptions = [
  { label: 'Etudiant', value: 'etudiant' },
  { label: 'Proprietaire', value: 'proprietaire' },
  { label: 'Admin', value: 'admin' }
]

const roleFilterOptions = [
  { label: 'Tous', value: 'all' },
  ...roleOptions
]




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

async function toggleUserStatus(row) {
  const newStatus = row.is_disabled ? 'activer' : 'désactiver'
  const action = row.is_disabled ? 'activation' : 'désactivation'

  $q.dialog({
    title: `Confirmer ${action}`,
    message: `Confirmer la ${action} de ${row.prenom} ${row.nom} ?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      const response = await fetch(`/api/users/${row.id}/toggle-status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ is_disabled: !row.is_disabled })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || `Impossible de ${action} l'utilisateur`)

      $q.notify({
        color: 'positive',
        position: 'top',
        message: `Utilisateur ${newStatus} avec succès.`
      })
      await fetchUsers()
    } catch (err) {
      $q.notify({ color: 'negative', position: 'top', message: err.message || `Erreur lors de la ${action}.` })
    }
  })
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
