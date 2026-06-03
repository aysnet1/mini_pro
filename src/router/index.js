import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import routes from './routes'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach(async (to) => {
    const authStore = useAuthStore()

    if (to.meta?.requiresAuth) {
      const isValidSession = await authStore.fetchProfile()
      if (!isValidSession || !authStore.isAuthenticated) {
        return '/auth/login'
      }
    }

    if (authStore.user?.role === 'admin' && (to.path === '/' || to.path === '/home')) {
      return '/admin/home'
    }

    if (to.meta?.requiresAdmin) {
      if (authStore.user?.role !== 'admin') {
        return '/home'
      }
    }

    if (to.path.startsWith('/auth') && authStore.isAuthenticated) {
      return authStore.user?.role === 'admin' ? '/admin/home' : '/home'
    }

    return true
  })

  return Router
})
