<template>
    <q-card flat bordered class="admin-card">
        <q-card-section class="row items-center justify-between q-gutter-sm">
            <div>
                <div class="text-h6 text-weight-bold">Gestion des logements</div>
                <div class="text-caption text-grey-7">Désactiver ou réactiver une annonce rapidement.</div>
            </div>

            <div class="row items-center q-gutter-sm controls-wrap">
                <q-select v-model="statusFilter" :options="statusOptions" emit-value map-options dense outlined
                    label="Filtre statut" style="min-width: 190px" />
                <q-btn flat no-caps icon="refresh" label="Actualiser" @click="fetchLogements"
                    :loading="logementsLoading" />
            </div>
        </q-card-section>

        <q-separator />

        <q-table flat :rows="filteredLogements" :columns="logementColumns" row-key="id" :loading="logementsLoading"
            :pagination="{ rowsPerPage: 8 }">
            <template #body-cell-prix="props">
                <q-td :props="props">{{ props.row.prix }} DT</q-td>
            </template>

            <template #body-cell-statut="props">
                <q-td :props="props">
                    <q-badge :color="statusColor(props.row.statut)" text-color="white"
                        :label="props.row.statut || 'disponible'" />
                </q-td>
            </template>

            <template #body-cell-actions="props">
                <q-td :props="props" class="q-gutter-xs">
                    <q-btn v-if="props.row.statut !== 'desactive'" flat dense color="negative" icon="block"
                        @click="changeLogementStatus(props.row, 'desactive')">
                        <q-tooltip>Desactiver</q-tooltip>
                    </q-btn>

                    <q-btn v-else flat dense color="positive" icon="check_circle"
                        @click="changeLogementStatus(props.row, 'disponible')">
                        <q-tooltip>Reactiver</q-tooltip>
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

const logements = ref([])
const logementsLoading = ref(false)
const statusFilter = ref('all')

const statusOptions = [
    { label: 'Tous', value: 'all' },
    { label: 'Disponible', value: 'disponible' },
    { label: 'Indisponible', value: 'indisponible' },
    { label: 'Desactive', value: 'desactive' }
]

const logementColumns = [
    { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
    { name: 'adress', label: 'Adresse', field: 'adress', align: 'left', sortable: true },
    { name: 'ville', label: 'Ville', field: 'ville', align: 'left', sortable: true },
    { name: 'type', label: 'Type', field: 'type', align: 'left', sortable: true },
    { name: 'prix', label: 'Prix', field: 'prix', align: 'left', sortable: true },
    { name: 'statut', label: 'Statut', field: 'statut', align: 'left', sortable: true },
    { name: 'actions', label: 'Actions', field: 'actions', align: 'right' }
]

const filteredLogements = computed(() => {
    if (statusFilter.value === 'all') return logements.value
    return logements.value.filter((row) => `${row.statut || 'disponible'}` === statusFilter.value)
})

function authHeaders(contentType = 'application/json') {
    return contentType
        ? { 'Content-Type': contentType, ...authStore.authHeader }
        : { ...authStore.authHeader }
}

function statusColor(status) {
    if (status === 'desactive') return 'negative'
    if (status === 'indisponible') return 'warning'
    return 'positive'
}

async function fetchLogements() {
    logementsLoading.value = true
    try {
        const response = await fetch('/api/logements?all_villes=true', {
            headers: authHeaders(null)
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Erreur de chargement des logements')
        logements.value = Array.isArray(data.logements) ? data.logements : []
    } catch (err) {
        $q.notify({
            color: 'negative',
            position: 'top',
            message: err.message || 'Impossible de charger les logements.'
        })
    } finally {
        logementsLoading.value = false
    }
}

async function changeLogementStatus(row, statut) {
    try {
        const response = await fetch(`/api/logements/${row.id}/status`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ statut })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Impossible de changer le statut')

        const action = statut === 'desactive' ? 'desactive' : 'reactive'
        $q.notify({ color: 'positive', position: 'top', message: `Logement ${action}.` })
        await fetchLogements()
    } catch (err) {
        $q.notify({ color: 'negative', position: 'top', message: err.message || 'Erreur de mise a jour.' })
    }
}

onMounted(() => {
    fetchLogements()
})
</script>

<style scoped>
.admin-card {
    border-radius: 16px;
    border-color: #dbe4ee;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.controls-wrap {
    flex-wrap: wrap;
}
</style>
