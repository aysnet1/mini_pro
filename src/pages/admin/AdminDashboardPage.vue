<template>
  <q-page class="admin-page q-pa-md q-pa-lg-md">
    <div class="admin-wrap">
      <header class="admin-header">
        <h1 class="admin-title">Administration</h1>
        <p class="admin-subtitle">Panneau dédié à la gestion des utilisateurs et des logements.</p>
      </header>

      <section class="admin-grid">
        <AdminUsersManagement />
        <AdminLogementsManagement />
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AdminUsersManagement from '@/components/admin/AdminUsersManagement.vue'
import AdminLogementsManagement from '@/components/admin/AdminLogementsManagement.vue'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  const isValidSession = await authStore.fetchProfile()
  if (!isValidSession || authStore.user?.role !== 'admin') {
    router.replace('/')
    return
  }
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

.admin-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
</style>
