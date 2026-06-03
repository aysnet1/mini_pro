<template>
    <q-page class="owner-reservations-page">
        <div class="container">
            <div class="head q-mb-lg">
                <h1>Reservations recues</h1>
                <p>Validez ou refusez les demandes des etudiants.</p>
            </div>

            <div v-if="store.loading" class="state-box">
                <q-spinner-dots size="34px" color="dark" />
            </div>

            <div v-else-if="store.error" class="state-box state-error">
                {{ store.error }}
            </div>

            <div v-else-if="!reservations.length" class="state-box">
                Aucune demande pour le moment.
            </div>

            <div v-else class="cards-grid">
                <q-card v-for="item in reservations" :key="`${item.logement_id}-${item.etudiant_id}`" flat
                    class="reservation-card">
                    <div class="card-image" :style="{ backgroundImage: `url('${coverImage(item.photos)}')` }"></div>

                    <q-card-section>
                        <div class="row items-start justify-between q-col-gutter-sm">
                            <div class="col">
                                <div class="title">{{ capitalize(item.type) }} - {{ item.ville }}</div>
                                <div class="sub">{{ item.adress || 'Adresse non renseignee' }}</div>
                            </div>
                            <q-badge :label="statusLabel(item.reservation_statut)"
                                :color="statusColor(item.reservation_statut)" text-color="white" />
                        </div>

                        <div class="meta-grid q-mt-md">
                            <div class="meta-item">
                                <span class="label">Etudiant</span>
                                <span class="value">{{ item.etudiant_prenom }} {{ item.etudiant_nom }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="label">Contact</span>
                                <span class="value">{{ item.etudiant_email || item.etudiant_tel || '-' }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="label">Date debut</span>
                                <span class="value">{{ formatDate(item.date_debut) }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="label">Date fin</span>
                                <span class="value">{{ formatDate(item.date_fin) }}</span>
                            </div>
                        </div>

                        <div class="meta-grid q-mt-sm">
                            <div class="meta-item">
                                <span class="label">Duree</span>
                                <span class="value">{{ item.duree }} mois</span>
                            </div>
                            <div class="meta-item">
                                <span class="label">Prix</span>
                                <span class="value">{{ Number(item.prix || 0) }} DT/mois</span>
                            </div>
                        </div>

                        <div v-if="item.note_proprietaire" class="owner-note q-mt-sm">
                            Note: {{ item.note_proprietaire }}
                        </div>

                        <div class="actions q-mt-md">
                            <q-btn flat no-caps color="dark" label="Voir le logement"
                                :to="`/logements/${item.logement_id}`" />

                            <div class="action-buttons" v-if="item.reservation_statut === 'en_attente'">
                                <q-btn no-caps unelevated color="positive" label="Accepter" :loading="store.saving"
                                    @click="openDecisionDialog(item, 'acceptee')" />
                                <q-btn no-caps unelevated color="negative" label="Refuser" :loading="store.saving"
                                    @click="openDecisionDialog(item, 'refusee')" />
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </div>
    </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useReservationsStore } from '@/stores/reservations'

const $q = useQuasar()
const store = useReservationsStore()

const reservations = computed(() => store.sortedOwnerItems)

function parsePhotos(value) {
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function coverImage(value) {
    const photos = parsePhotos(value)
    return photos[0] || 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
}

function formatDate(dateValue) {
    if (!dateValue) return '-'
    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('fr-FR')
}

function capitalize(text) {
    if (!text) return 'Logement'
    const value = `${text}`
    return value.charAt(0).toUpperCase() + value.slice(1)
}

function statusLabel(status) {
    if (status === 'en_attente') return 'En attente'
    if (status === 'acceptee') return 'Acceptee'
    if (status === 'refusee') return 'Refusee'
    if (status === 'annulee') return 'Annulee'
    return 'Inconnu'
}

function statusColor(status) {
    if (status === 'en_attente') return 'warning'
    if (status === 'acceptee') return 'positive'
    if (status === 'refusee') return 'negative'
    if (status === 'annulee') return 'grey-7'
    return 'dark'
}

function openDecisionDialog(item, decision) {
    const isAccept = decision === 'acceptee'

    $q.dialog({
        title: isAccept ? 'Accepter la demande' : 'Refuser la demande',
        message: isAccept
            ? 'Voulez-vous accepter cette demande ? Le logement passera en statut reserve.'
            : 'Voulez-vous refuser cette demande ?',
        prompt: {
            model: '',
            type: 'text',
            label: 'Note au demandeur (optionnelle)'
        },
        cancel: { flat: true, label: 'Annuler', color: 'dark' },
        ok: { unelevated: true, label: isAccept ? 'Accepter' : 'Refuser', color: isAccept ? 'positive' : 'negative' }
    }).onOk(async (note) => {
        try {
            await store.decideReservation(item.logement_id, item.etudiant_id, decision, note || '')
            $q.notify({
                message: isAccept ? 'Demande acceptee.' : 'Demande refusee.',
                color: 'positive',
                position: 'top'
            })
        } catch (err) {
            $q.notify({
                message: err.message || 'Operation echouee.',
                color: 'negative',
                position: 'top'
            })
        }
    })
}

onMounted(async () => {
    try {
        await store.fetchOwnerReservations()
    } catch {
        // Erreur deja exposee via store.error
    }
})
</script>

<style scoped>
.owner-reservations-page {
    min-height: 100vh;
    background: #f8fafc;
}

.container {
    max-width: 1120px;
    margin: 0 auto;
    padding: 24px 16px 56px;
}

.head h1 {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 800;
    color: #0f172a;
}

.head p {
    margin: 6px 0 0;
    color: #64748b;
}

.state-box {
    min-height: 260px;
    border: 1px dashed #cbd5e1;
    border-radius: 14px;
    display: grid;
    place-items: center;
    color: #334155;
    background: #fff;
}

.state-error {
    color: #991b1b;
}

.cards-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

.reservation-card {
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    overflow: hidden;
}

.card-image {
    height: 180px;
    background-size: cover;
    background-position: center;
}

.title {
    font-weight: 800;
    color: #0f172a;
}

.sub {
    margin-top: 4px;
    color: #64748b;
    font-size: 0.92rem;
}

.meta-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.meta-item {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 9px 10px;
}

.label {
    display: block;
    font-size: 0.72rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.value {
    margin-top: 3px;
    display: block;
    color: #111827;
    font-weight: 700;
}

.owner-note {
    border-left: 3px solid #22c55e;
    padding-left: 8px;
    color: #334155;
}

.actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.action-buttons {
    display: flex;
    gap: 8px;
}

@media (max-width: 900px) {
    .cards-grid {
        grid-template-columns: 1fr;
    }

    .actions {
        flex-direction: column;
        align-items: stretch;
    }

    .action-buttons {
        justify-content: flex-end;
    }
}
</style>
