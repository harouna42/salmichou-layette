import { createRouter, createWebHistory } from 'vue-router';
import { useUsersStore } from '../stores/users';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/ventes',
      name: 'Ventes',
      component: () => import('../views/Ventes.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/historique-ventes',
      name: 'HistoriqueVentes',
      component: () => import('../views/HistoriqueVentes.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/produits',
      name: 'Produits',
      component: () => import('../views/GestionProduits.vue'),
      meta: { requiresAuth: true, requiresPermission: 'manage_products' }
    },
    {
      path: '/categories',
      name: 'Categories',
      component: () => import('../views/GestionCategories.vue'),
      meta: { requiresAuth: true, requiresPermission: 'view_products' }
    },
    {
      path: '/statistiques',
      name: 'Statistiques',
      component: () => import('../views/Statistiques.vue'),
      meta: { requiresAuth: true, requiresPermission: 'view_stats' }
    },
    {
      path: '/utilisateurs',
      name: 'Utilisateurs',
      component: () => import('../views/GestionUtilisateurs.vue'),
      meta: { requiresAuth: true, requiresPermission: 'view_users' }
    },
    {
      path: '/',
      redirect: '/login'
    }
  ]
});

router.beforeEach((to, from, next) => {
  const authStore = useUsersStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresPermission && !authStore.hasPermission(to.meta.requiresPermission as string)) {
    // Rediriger vers les ventes si pas la permission
    next('/ventes');
  } else {
    next();
  }
});

export default router;