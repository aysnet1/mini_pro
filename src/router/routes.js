const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/home' },
      { path: 'home', component: () => import('pages/HomePage.vue') },

      { path: 'logements/:id', component: () => import('pages/logement/LogementDetailPage.vue') },
      { path: 'profile', component: () => import('pages/etudiants/IndexPage.vue') },
      { path: 'candidatures', component: () => import('pages/etudiants/MesReservationsPage.vue') },
      { path: 'mes-reservations', component: () => import('pages/etudiants/MesReservationsPage.vue') },
      { path: 'reservations', component: () => import('pages/proprietaires/ReservationsRecuesPage.vue') },
      { path: 'recherche', component: () => import('pages/logement/RecherchePage.vue') },
      { path: 'mes-logements', component: () => import('pages/proprietaires/MesLogementsPage.vue') },
      {
        path: 'admin',
        redirect: '/admin/home',
        meta: {
          requiresAdmin: true
        }
      },
      {
        path: 'admin/dashboard',
        redirect: '/admin/home',
        meta: {
          requiresAdmin: true
        }
      },
      {
        path: 'admin/home',
        component: () => import('pages/admin/AdminHomePage.vue'),
        meta: {
          requiresAdmin: true
        }
      },
      {
        path: 'admin/users',
        component: () => import('pages/admin/AdminUsersPage.vue'),
        meta: {
          requiresAdmin: true
        }
      },
      {
        path: 'admin/logements',
        component: () => import('pages/admin/AdminLogementsPage.vue'),
        meta: {
          requiresAdmin: true
        }
      },
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
