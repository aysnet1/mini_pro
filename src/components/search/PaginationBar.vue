<template>
    <div class="pagination-controls q-mt-lg">
        <div class="pagination-info">
            Page {{ page }} sur {{ totalPages }} ({{ total }} résultats)
        </div>
        <div class="pagination-buttons">
            <q-btn flat color="dark" icon="first_page" :disable="!hasPrev" @click="$emit('change-page', 1)"
                class="pagination-btn" />
            <q-btn flat color="dark" icon="chevron_left" :disable="!hasPrev" @click="$emit('change-page', page - 1)"
                class="pagination-btn" />
            <div class="pagination-pages">
                <template v-for="pageNum in visiblePages" :key="pageNum">
                    <q-btn v-if="pageNum === page" unelevated color="negative" :label="pageNum"
                        class="pagination-page pagination-page--active" />
                    <q-btn v-else flat color="dark" :label="pageNum" @click="$emit('change-page', pageNum)"
                        class="pagination-page" />
                </template>
            </div>
            <q-btn flat color="dark" icon="chevron_right" :disable="!hasNext" @click="$emit('change-page', page + 1)"
                class="pagination-btn" />
            <q-btn flat color="dark" icon="last_page" :disable="!hasNext" @click="$emit('change-page', totalPages)"
                class="pagination-btn" />
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    page: {
        type: Number,
        required: true
    },
    totalPages: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    hasPrev: {
        type: Boolean,
        required: true
    },
    hasNext: {
        type: Boolean,
        required: true
    },
    visiblePages: {
        type: Array,
        required: true
    }
})

const emit = defineEmits(['change-page'])
</script>

<style scoped>
.pagination-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px 0;
    margin-top: 20px;
    border-top: 1px solid #e5e7eb;
}

.pagination-info {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 500;
}

.pagination-buttons {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
}

.pagination-btn {
    min-width: 36px;
    height: 36px;
    border-radius: 8px;
}

.pagination-pages {
    display: flex;
    align-items: center;
    gap: 4px;
}

.pagination-page {
    min-width: 36px;
    height: 36px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
}

.pagination-page--active {
    font-weight: 700;
}

@media (max-width: 640px) {
    .pagination-controls {
        padding: 16px 0;
    }

    .pagination-btn,
    .pagination-page {
        min-width: 32px;
        height: 32px;
        font-size: 0.85rem;
    }

    .pagination-info {
        font-size: 0.8rem;
    }
}
</style>
