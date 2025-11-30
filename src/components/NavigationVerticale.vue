<template>
  <nav class="navigation-verticale">
    <div class="logo">
      <h2>{{ $t('login.title') }}</h2>
      <div class="user-info" v-if="currentUser">
        <strong>{{ currentUser.name }}</strong>
        <span class="user-role">{{ getRoleLabel(currentUser.role) }}</span>
      </div>
      <div v-else class="login-prompt">
        <p>Veuillez vous connecter</p>
      </div>
    </div>
    
    <ul class="menu">
      <!-- Ventes - Accessible à tous les utilisateurs connectés -->
      <li v-if="currentUser">
        <router-link to="/ventes" class="menu-item">
          <span class="icon">🛒</span>
          <span>{{ $t('navigation.sales') }}</span>
        </router-link>
      </li>
      
      <!-- Historique Ventes - Accessible à tous les utilisateurs connectés -->
      <li v-if="currentUser">
        <router-link to="/historique-ventes" class="menu-item">
          <span class="icon">📋</span>
          <span>{{ $t('navigation.salesHistory') }}</span>
        </router-link>
      </li>
      
      <!-- Gestion Produits - Admin et Manager seulement -->
      <li v-if="currentUser && hasPermission('manage_products')">
        <router-link to="/produits" class="menu-item">
          <span class="icon">📦</span>
          <span>Gestion Produits</span>
        </router-link>
      </li>
      
      <!-- Statistiques - Admin et Manager seulement -->
      <li v-if="currentUser && hasPermission('view_stats')">
        <router-link to="/statistiques" class="menu-item">
          <span class="icon">📊</span>
          <span>Statistiques</span>
        </router-link>
      </li>
      
      <!-- Gestion Utilisateurs - Admin seulement -->
      <li v-if="currentUser && hasPermission('manage_users')">
        <router-link to="/utilisateurs" class="menu-item">
          <span class="icon">👥</span>
          <span>Gestion Utilisateurs</span>
        </router-link>
      </li>
      
      <!-- Dans le menu, après "Gestion Produits" -->
      <li v-if="hasPermission('manage_categories')">
        <router-link to="/categories" class="menu-item">
          <span class="icon">📁</span>
          <span>Gestion Catégories</span>
        </router-link>
      </li>
      <!-- Dans NavigationVerticale.vue -->
      <li v-if="currentUser && hasPermission('manage_users')">
        <router-link to="/configuration" class="menu-item">
          <span class="icon">⚙️</span>
          <span>{{ $t('navigation.configuration') }}</span>
        </router-link>
      </li>
      <!-- Déconnexion - Seulement si connecté -->
      <li v-if="currentUser">
        <button @click="handleLogout" class="menu-item logout-btn">
          <span class="icon">🚪</span>
          <span>{{ $t('navigation.logout') }}</span>
        </button>
      </li>
      
      <!-- Connexion - Seulement si déconnecté -->
      <li v-else>
        <router-link to="/login" class="menu-item">
          <span class="icon">🔐</span>
          <span>{{ $t('navigation.login') }}</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUsersStore } from '../stores/users';

const usersStore = useUsersStore();
const router = useRouter();

// Utiliser directement currentUser du store users pour une réactivité correcte
const currentUser = computed(() => usersStore.currentUser);

const hasPermission = (permission: string) => {
  return usersStore.hasPermission(permission);
};

const handleLogout = () => {
  usersStore.logout();
  // Rediriger vers la page de login après déconnexion
  router.push('/login');
};

const getRoleLabel = (role: string) => {
  const labels: { [key: string]: string } = {
    admin: 'Administrateur',
    manager: 'Gestionnaire',
    employee: 'Vendeur'
  };
  return labels[role] || role;
};
</script>

<style scoped>
.navigation-verticale {
  width: 250px;
  height: 100vh;
  background: #2c3e50;
  color: white;
  position: fixed;
  left: 0;
  top: 0;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #34495e;
}

.logo h2 {
  margin: 0;
  font-size: 1.2em;
  color: #3498db;
}

.user-info {
  margin-top: 10px;
  padding: 10px;
  background: rgba(255,255,255,0.1);
  border-radius: 5px;
  text-align: center;
}

.user-info strong {
  display: block;
  font-size: 0.9em;
  margin-bottom: 2px;
}

.user-role {
  font-size: 0.8em;
  color: #3498db;
  font-style: italic;
}

.login-prompt {
  margin-top: 10px;
  padding: 10px;
  background: rgba(231, 76, 60, 0.2);
  border-radius: 5px;
  text-align: center;
}

.login-prompt p {
  margin: 0;
  font-size: 0.8em;
  color: #e74c3c;
}

.menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  color: white;
  text-decoration: none;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background 0.3s;
}

.menu-item:hover {
  background: #34495e;
}

.menu-item.router-link-active {
  background: #3498db;
}

.icon {
  margin-right: 10px;
  font-size: 1.2em;
}

.logout-btn {
  color: #e74c3c;
}

.logout-btn:hover {
  background: #34495e;
  color: #e74c3c;
}
</style>