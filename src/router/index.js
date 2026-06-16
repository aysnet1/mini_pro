import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import routes from './routes'

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  // Helper: get default home path by role
  const getHomeByRole = (role) => {
    if (role === 'admin') return '/admin/home'
    if (role === 'proprietaire') return '/proprietaire/mes-logements'
    return '/'
  }

  Router.beforeEach(async (to) => {
    const authStore = useAuthStore()


    if (to.meta?.requiresAuth) {
      const isValidSession = await authStore.fetchProfile()
      if (!isValidSession || !authStore.isAuthenticated) {
        return '/auth/login'
      }
    }

    const userRole = authStore.user?.role


    if (to.path === '/' || to.path === '/') {
      if (userRole === 'admin') return '/admin/home'
      if (userRole === 'proprietaire') return '/proprietaire/mes-logements'
      // student stays on /home
    }


    if (userRole === 'etudiant' || !userRole) {
      if (to.path.startsWith('/admin') || to.path.startsWith('/proprietaire')) {
        return '/'
      }
    }


    if (userRole === 'admin' || userRole === 'proprietaire') {
      const studentOnlyPaths = ['/candidatures', '/mes-reservations', '/recherche']
      const isStudentPage = studentOnlyPaths.some(p => to.path.startsWith(p))
        || to.path === '/profile' // student profile is at /profile

      if (isStudentPage) {
        return getHomeByRole(userRole)
      }
    }


    if (to.meta?.requiresAdmin) {
      if (userRole !== 'admin' && userRole !== 'proprietaire') {
        return '/'
      }
    }


    if (to.path.startsWith('/auth') && authStore.isAuthenticated) {
      return getHomeByRole(userRole)
    }

    return true
  })

  return Router
})
