import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'

/**
 * Composable for managing responsive map height and topbar observer
 * @returns {Object} Responsive map state and methods
 */
export function useResponsiveMap() {
    const topbarHeight = ref(80)
    const activeTab = ref('liste')

    const mobileMapHeight = computed(() => `calc(100vh - ${topbarHeight.value}px)`)

    let topbarObserver = null

    function observeTopbar() {
        nextTick(() => {
            const topbar = document.querySelector('.search-topbar')
            if (topbar) {
                topbarHeight.value = topbar.offsetHeight
                document.documentElement.style.setProperty('--topbar-h', `${topbar.offsetHeight}px`)

                topbarObserver = new ResizeObserver(() => {
                    topbarHeight.value = topbar.offsetHeight
                    document.documentElement.style.setProperty('--topbar-h', `${topbar.offsetHeight}px`)
                })

                topbarObserver.observe(topbar)
            }
        })
    }

    function cleanupObserver() {
        if (topbarObserver) {
            topbarObserver.disconnect()
            topbarObserver = null
        }
    }

    onMounted(() => {
        observeTopbar()
    })

    onUnmounted(() => {
        cleanupObserver()
    })

    return {
        topbarHeight,
        activeTab,
        mobileMapHeight,
        observeTopbar,
        cleanupObserver
    }
}
