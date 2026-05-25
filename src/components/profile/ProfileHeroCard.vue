<template>
  <section class="hero-card">
    <div class="hero-left">
      <q-avatar size="76px" class="avatar-soft">
        <img v-if="user?.photo_profil" :src="user.photo_profil" alt="Avatar" class="object-cover w-full h-full" />
        <span v-else>{{ initials }}</span>
      </q-avatar>

      <div>
        <p class="eyebrow">Tableau de bord</p>
        <h1>Bonjour {{ user?.prenom || 'Utilisateur' }}</h1>
        <p class="subtitle">Bienvenue dans votre espace personnel.</p>
      </div>
    </div>

    <div class="hero-actions">
      <q-btn no-caps flat class="edit-btn" @click="$emit('edit')">
        <span>Modifier</span>
      </q-btn>

      <q-btn no-caps unelevated class="logout-btn" @click="$emit('logout')">
        <span>Déconnexion</span>
      </q-btn>
    </div>
  </section>
</template>

<script setup>
defineProps({
  user: {
    type: Object,
    default: null
  },
  initials: {
    type: String,
    default: 'U'
  }
})

defineEmits(['edit', 'logout'])
</script>

<style scoped>
.hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.2rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e2e8f0;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar-soft {
  background: #0f172a;
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.eyebrow {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #475569;
  font-size: 0.95rem;
}

.logout-btn {
  border-radius: 0.7rem;
  background: #0f172a;
  color: #fff;
}

.edit-btn {
  border-radius: 0.7rem;
  color: #0f172a;
  border: 1px solid #cbd5e1;
}

@media (max-width: 760px) {
  .hero-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
