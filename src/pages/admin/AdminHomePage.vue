<template>
    <q-page class="admin-page q-pa-md q-pa-lg-md">
        <div class="admin-wrap">
            <header class="admin-header">
                <h1 class="admin-title">Accueil Admin</h1>
                <p class="admin-subtitle">Vue rapide des indicateurs de la plateforme.</p>
            </header>

            <section class="kpi-grid">
                <q-card flat bordered class="kpi-card">
                    <q-card-section>
                        <div class="kpi-label">Utilisateurs total</div>
                        <div class="kpi-value">{{ stats.users.total }}</div>
                    </q-card-section>
                </q-card>

                <q-card flat bordered class="kpi-card">
                    <q-card-section>
                        <div class="kpi-label">Etudiants</div>
                        <div class="kpi-value">{{ stats.users.etudiants }}</div>
                    </q-card-section>
                </q-card>

                <q-card flat bordered class="kpi-card">
                    <q-card-section>
                        <div class="kpi-label">Proprietaires</div>
                        <div class="kpi-value">{{ stats.users.proprietaires }}</div>
                    </q-card-section>
                </q-card>

                <q-card flat bordered class="kpi-card">
                    <q-card-section>
                        <div class="kpi-label">Logements total</div>
                        <div class="kpi-value">{{ stats.logements.total }}</div>
                    </q-card-section>
                </q-card>

                <q-card flat bordered class="kpi-card">
                    <q-card-section>
                        <div class="kpi-label">Logements actifs</div>
                        <div class="kpi-value">{{ stats.logements.actifs }}</div>
                    </q-card-section>
                </q-card>

                <q-card flat bordered class="kpi-card kpi-card-danger">
                    <q-card-section>
                        <div class="kpi-label">Logements desactives</div>
                        <div class="kpi-value">{{ stats.logements.desactives }}</div>
                    </q-card-section>
                </q-card>
            </section>

            <div class="actions-row">
                <q-btn no-caps color="dark" label="Gerer les utilisateurs" to="/admin/users" />
                <q-btn no-caps outline color="dark" label="Gerer les logements" to="/admin/logements" />
            </div>
        </div>
    </q-page>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

const stats = reactive({
    users: {
        total: 0,
        etudiants: 0,
        proprietaires: 0,
        admins: 0
    },
    logements: {
        total: 0,
        actifs: 0,
        desactives: 0
    }
})

function authHeaders(contentType = 'application/json') {
    return contentType
        ? { 'Content-Type': contentType, ...authStore.authHeader }
        : { ...authStore.authHeader }
}

async function fetchStats() {
    try {
        const response = await fetch('/api/users/admin/stats', {
            headers: authHeaders(null)
        })
        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Impossible de charger les statistiques admin.')
        }

        stats.users = data.users || stats.users
        stats.logements = data.logements || stats.logements
    } catch (err) {
        $q.notify({
            color: 'negative',
            position: 'top',
            message: err.message || 'Erreur de chargement des statistiques.'
        })
    }
}

onMounted(async () => {
    const isValidSession = await authStore.fetchProfile()
    if (!isValidSession || authStore.user?.role !== 'admin') {
        router.replace('/')
        return
    }

    await fetchStats()
})
</script>

<style scoped>
.admin-page {
    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
    min-height: 100vh;
}

.admin-wrap {
    max-width: 1280px;
    margin: 0 auto;
}

.admin-header {
    margin-bottom: 14px;
}

.admin-title {
    margin: 0;
    font-size: clamp(1.6rem, 2.6vw, 2.2rem);
    font-weight: 900;
    letter-spacing: -0.03em;
    color: #0f172a;
}

.admin-subtitle {
    margin: 6px 0 0;
    color: #475569;
    font-size: 0.98rem;
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
}

.kpi-card {
    border-radius: 14px;
    border: 1px solid #dbe4ee;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.kpi-card-danger {
    border-color: #fecaca;
    background: #fff7f7;
}

.kpi-label {
    color: #64748b;
    font-size: 0.86rem;
    font-weight: 600;
    margin-bottom: 6px;
}

.kpi-value {
    color: #0f172a;
    font-size: clamp(1.5rem, 2.8vw, 2rem);
    font-weight: 900;
    letter-spacing: -0.02em;
    line-height: 1;
}

.actions-row {
    margin-top: 18px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
</style>
