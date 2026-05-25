<template>
  <q-dialog v-model="dialogModel">
    <q-card class="edit-dialog">
      <q-card-section>
        <h3 class="dialog-title">Modifier Mon Profil</h3>
        <p class="dialog-subtitle">Gardons vos informations a jour.</p>
      </q-card-section>

      <q-card-section>
        <q-form class="form-stack" @submit.prevent="submitForm">
          <div class="form-row">
            <q-input v-model="localForm.prenom" label="Prenom" outlined dense class="form-field" />
            <q-input v-model="localForm.nom" label="Nom" outlined dense class="form-field" />
          </div>

          <q-input v-model="localForm.email" type="email" label="Email" outlined dense class="form-field" />
          <q-input v-model="localForm.tel" label="Telephone" outlined dense class="form-field" />
          <q-input v-model="localForm.photo_profil" label="URL Photo" outlined dense class="form-field" />

          <div class="form-actions">
            <q-btn flat no-caps label="Annuler" @click="dialogModel = false" />
            <q-btn type="submit" no-caps unelevated color="dark" label="Enregistrer" :loading="saving" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  initialForm: {
    type: Object,
    default: () => ({})
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const localForm = ref({
  nom: '',
  prenom: '',
  email: '',
  tel: '',
  photo_profil: ''
})

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      localForm.value = {
        nom: props.initialForm?.nom || '',
        prenom: props.initialForm?.prenom || '',
        email: props.initialForm?.email || '',
        tel: props.initialForm?.tel || '',
        photo_profil: props.initialForm?.photo_profil || ''
      }
    }
  },
  { immediate: true }
)

function submitForm() {
  emit('submit', { ...localForm.value })
}
</script>

<style scoped>
.edit-dialog {
  width: min(560px, 94vw);
  border-radius: 0.9rem;
}

.dialog-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.dialog-subtitle {
  margin: 0.3rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.form-field {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

@media (max-width: 760px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
