import { ref, computed } from 'vue'

/**
 * Composable for managing pagination state and logic
 * @param {Object} options - Pagination options
 * @param {number} options.initialPage - Initial page number
 * @param {number} options.limit - Items per page
 * @returns {Object} Pagination state and methods
 */
export function usePagination(options = {}) {
  const {
    initialPage = 1,
    limit = 12
  } = options

  const pagination = ref({
    page: initialPage,
    limit,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  const visiblePages = computed(() => {
    const current = pagination.value.page
    const total = pagination.value.totalPages
    const delta = 2 // Number of pages to show on each side of current page

    const range = []
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i)
    }

    // Always include first page
    if (current - delta > 2) {
      range.unshift(1)
    }

    // Always include last page
    if (current + delta < total - 1) {
      range.push(total)
    }

    range.sort((a, b) => a - b)

    // Remove duplicates
    return [...new Set(range)]
  })

  function updatePagination(newPagination) {
    if (newPagination) {
      pagination.value = { ...pagination.value, ...newPagination }
    }
  }

  function resetPagination() {
    pagination.value.page = 1
  }

  function canChangePage(page) {
    return page >= 1 && page <= pagination.value.totalPages && page !== pagination.value.page
  }

  return {
    pagination,
    visiblePages,
    updatePagination,
    resetPagination,
    canChangePage
  }
}
