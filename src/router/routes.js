const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/home' },
      { path: 'home', component: () => import('pages/HomePage.vue') },

      { path: 'logements/:id', component: () => import('pages/LogementDetailPage.vue') },
      { path: 'profile', component: () => import('pages/IndexPage.vue') },
      { path: 'recherche', component: () => import('pages/RecherchePage.vue') },
      { path: 'mes-logements', component: () => import('pages/MesLogementsPage.vue') },
    ],
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/auth',
    component: () => import('layouts/authLayout.vue'),
    children: [
      { path: '', redirect: '/auth/login' },
      { path: 'login', component: () => import('pages/auth/LoginPage.vue') },
      { path: 'register', component: () => import('pages/auth/RegisterPage.vue') }
    ],
    meta: {
      requiresAuth: false
    }
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
