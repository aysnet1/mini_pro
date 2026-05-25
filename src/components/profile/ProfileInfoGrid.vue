<template>
  <section class="info-grid">
    <article class="info-card">
      <p class="label">Nom complet</p>
      <p class="value">{{ fullName }}</p>
    </article>

    <article class="info-card">
      <p class="label">Email</p>
      <p class="value">{{ user?.email || '-' }}</p>
    </article>

    <article class="info-card">
      <p class="label">Rôle</p>
      <p class="value">{{ roleLabel }}</p>
    </article>

    <article class="info-card">
      <p class="label">Téléphone</p>
      <p class="value">{{ user?.tel ? `+216 ${user.tel}` : 'Non renseigné' }}</p>
    </article>
  </section>
</template>

<script setup>
defineProps({
  user: {
    type: Object,
    default: null
  },
  fullName: {
    type: String,
    default: 'Non renseigné'
  },
  roleLabel: {
    type: String,
    default: 'Non défini'
  }
})
</script>

<style scoped>
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.info-card {
  border-radius: 0.9rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 0.9rem 1rem;
}

.label {
  margin: 0;
  color: #64748b;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.value {
  margin: 0.3rem 0 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 600;
}

@media (max-width: 760px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
