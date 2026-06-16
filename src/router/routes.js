const routes = [
  // ==========================================
  // AppLayout — STUDENTS ONLY
  // ==========================================
  {
    path: '/',
    component: () => import('layouts/AppLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue'), meta: { requiresAuth: false } },
      { path: 'recherche', component: () => import('pages/logement/RecherchePage.vue'), meta: { requiresAuth: false } },
      { path: 'logements/:id', component: () => import('pages/logement/LogementDetailPage.vue'), meta: { requiresAuth: false } },
      { path: 'profile', component: () => import('pages/etudiants/IndexPage.vue') },
      { path: 'candidatures', component: () => import('pages/etudiants/MesReservationsPage.vue') },
      { path: 'mes-reservations', component: () => import('pages/etudiants/MesReservationsPage.vue') },
    ],
    meta: { requiresAuth: true, allowedRoles: ['etudiant'] }
  },

  // ==========================================
  // MainLayout — PROPRIETAIRES
  // ==========================================
  {
    path: '/proprietaire',
    component: () => import('layouts/MainLayout.vue'),
    redirect: '/proprietaire/mes-logements',
    children: [
      { path: 'reservations', component: () => import('pages/proprietaires/ReservationsRecuesPage.vue') },
      { path: 'mes-logements', component: () => import('pages/proprietaires/MesLogementsPage.vue') },
      { path: 'profile', component: () => import('pages/etudiants/IndexPage.vue') }, // MainLayout profile
    ],
    meta: { requiresAuth: true, allowedRoles: ['proprietaire'] }
  },

  // ==========================================
  // MainLayout — ADMIN
  // ==========================================
  {
    path: '/admin',
    component: () => import('layouts/MainLayout.vue'),
    redirect: '/admin/home',
    children: [
      { path: 'home', component: () => import('pages/admin/AdminHomePage.vue') },
      { path: 'dashboard', redirect: '/admin/home' },
      { path: 'users', component: () => import('pages/admin/AdminUsersPage.vue') },
      { path: 'logements', component: () => import('pages/admin/AdminLogementsPage.vue') },
      { path: 'profile', component: () => import('pages/etudiants/IndexPage.vue') }, // MainLayout profile
    ],
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  // ==========================================
  // AuthLayout — PUBLIC
  // ==========================================
  {
    path: '/auth',
    component: () => import('layouts/authLayout.vue'),
    children: [
      { path: '', redirect: '/auth/login' },
      { path: 'login', component: () => import('pages/auth/LoginPage.vue') },
      { path: 'register', component: () => import('pages/auth/RegisterPage.vue') }
    ],
    meta: { requiresAuth: false }
  },

  // ==========================================
  // 404 — ALWAYS LAST
  // ==========================================
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
