<template>
  <section class="list-side" :class="hideOnMap ? 'hidden! md:block!' : ''">
    <div class="list-head">
      <h5 class="q-my-none">
        {{ total }} logement{{ total !== 1 ? 's' : '' }} trouvé{{ total !== 1 ? 's' : '' }}
        <span v-if="totalPages > 1" class="text-caption text-grey-7">
          (page {{ currentPage }}/{{ totalPages }})
        </span>
      </h5>
      <span class="text-caption text-grey-7">Résultats sur la carte Google Maps</span>
    </div>

    <div v-if="context.message" class="search-context q-mb-md">
      <p class="context-message">{{ context.message }}</p>
      <p v-if="context.filtreVille" class="context-meta">
        Zone recherchée : {{ context.filtreVille }}
      </p>
      <p v-if="context.universite" class="context-meta">
        Université : {{ context.universite }}
      </p>
    </div>

    <div v-if="loading" class="list-loading">
      <q-spinner-dots size="36px" color="dark" />
    </div>

    <div v-else-if="logements.length === 0" class="list-empty">
      Aucun logement trouvé avec ces filtres.
    </div>

    <div v-else class="cards-grid">
      <router-link v-for="logement in logements" :key="logement.id" :to="`/logements/${logement.id}`"
        class="block no-underline">
        <ListingCard :logement="logement" :is-active="activeId === logement.id" @hover="$emit('hover', $event)" />
      </router-link>
    </div>

    <!-- Pagination -->
    <PaginationBar v-if="totalPages > 1" :page="currentPage" :total-pages="totalPages" :total="total"
      :has-prev="hasPrev" :has-next="hasNext" :visible-pages="visiblePages"
      @change-page="$emit('change-page', $event)" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import ListingCard from './ListingCard.vue'
import PaginationBar from './PaginationBar.vue'

const props = defineProps({
  logements: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  context: {
    type: Object,
    default: () => ({ filtreVille: null, universite: null, message: '' })
  },
  pagination: {
    type: Object,
    required: true
  },
  visiblePages: {
    type: Array,
    required: true
  },
  activeId: {
    type: [Number, String],
    default: null
  },
  hideOnMap: {
    type: Boolean,
    default: false
  }
})

defineEmits(['hover', 'change-page'])

// Use computed properties for reactivity
const currentPage = computed(() => props.pagination.page)
const totalPages = computed(() => props.pagination.totalPages)
const total = computed(() => props.pagination.total)
const hasNext = computed(() => props.pagination.hasNext)
const hasPrev = computed(() => props.pagination.hasPrev)
</script>

<style scoped>
/* Styles will be inherited from parent */
</style>
