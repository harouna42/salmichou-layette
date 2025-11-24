<template>
  <div class="utilisateurs-container">
    <div class="header">
      <h1>👥 Gestion des Utilisateurs</h1>
      <button 
        @click="showAddUser = true" 
        class="btn-primary"
        v-if="hasPermission('manage_users')"
      >
        + Ajouter un utilisateur
      </button>
    </div>

    <!-- Formulaire d'ajout/modification -->
    <div v-if="showAddUser" class="form-overlay">
      <div class="form-container">
        <h3>{{ editingUser ? 'Modifier' : 'Ajouter' }} un utilisateur</h3>
        
        <form @submit.prevent="handleUserSubmit" class="user-form">
          <div class="form-row">
            <div class="form-group">
              <label>Nom complet *</label>
              <input v-model="userForm.name" type="text" required>
            </div>
            
            <div class="form-group">
              <label>Nom d'utilisateur *</label>
              <input 
                v-model="userForm.username" 
                type="text" 
                required
                :disabled="!!editingUser"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Email</label>
              <input v-model="userForm.email" type="email">
            </div>
            
            <div class="form-group">
              <label>Téléphone</label>
              <input v-model="userForm.phone" type="tel">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Rôle *</label>
              <select v-model="userForm.role" required>
                <option value="">Sélectionner un rôle</option>
                <option 
                  v-for="role in roles" 
                  :key="role.id" 
                  :value="role.name"
                >
                  {{ role.description }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Mot de passe {{ editingUser ? '(laisser vide pour ne pas changer)' : '*' }}</label>
              <input 
                v-model="userForm.password" 
                type="password" 
                :required="!editingUser"
                :placeholder="editingUser ? 'Nouveau mot de passe' : ''"
              >
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-success">
              {{ editingUser ? 'Modifier' : 'Ajouter' }}
            </button>
            <button type="button" @click="closeForm" class="btn-cancel">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Statistiques -->
    <div class="users-stats">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <h3>Total Utilisateurs</h3>
          <p class="stat-value">{{ users.length }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <h3>Actifs</h3>
          <p class="stat-value">{{ activeUsers.length }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">❌</div>
        <div class="stat-info">
          <h3>Inactifs</h3>
          <p class="stat-value">{{ inactiveUsers.length }}</p>
        </div>
      </div>
    </div>

    <!-- Tableau des utilisateurs -->
    <div class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Rôle</th>
            <th>Contact</th>
            <th>Statut</th>
            <th>Création</th>
            <th v-if="hasPermission('manage_users')">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="user in users" 
            :key="user.id"
            :class="{ 
              'current-user': currentUser?.id === user.id,
              'inactive-user': !user.isActive 
            }"
          >
            <td class="user-info">
              <div class="user-main">
                <strong>{{ user.name }}</strong>
                <span class="username">@{{ user.username }}</span>
              </div>
            </td>
            <td class="role-cell">
              <span :class="['role-badge', `role-${user.role}`]">
                {{ getRoleLabel(user.role) }}
              </span>
            </td>
            <td class="contact-cell">
              <div v-if="user.email || user.phone" class="contact-info">
                <div v-if="user.email" class="email">{{ user.email }}</div>
                <div v-if="user.phone" class="phone">{{ user.phone }}</div>
              </div>
              <span v-else class="no-contact">-</span>
            </td>
            <td class="status-cell">
              <span 
                :class="['status-badge', user.isActive ? 'active' : 'inactive']"
                @click="toggleUserStatus(user.id)"
                style="cursor: pointer;"
              >
                {{ user.isActive ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td class="date-cell">
              {{ formatDate(user.createdAt) }}
            </td>
            <td v-if="hasPermission('manage_users')" class="actions-cell">
              <div class="action-buttons">
                <button 
                  @click="editUser(user)"
                  class="btn-edit"
                  :disabled="currentUser?.id === user.id"
                  :title="currentUser?.id === user.id ? 'Vous ne pouvez pas vous modifier ici' : 'Modifier'"
                >
                  ✏️
                </button>
                <button 
                  @click="deleteUser(user.id)"
                  class="btn-delete"
                  :disabled="currentUser?.id === user.id"
                  :title="currentUser?.id === user.id ? 'Vous ne pouvez pas vous supprimer' : 'Supprimer'"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="users.length === 0" class="empty-state">
        <p>Aucun utilisateur trouvé</p>
      </div>
    </div>

    <!-- Détails des rôles -->
    <div class="roles-info">
      <h3>📋 Description des Rôles</h3>
      <div class="roles-grid">
        <div 
          v-for="role in roles" 
          :key="role.id"
          class="role-card"
        >
          <h4>{{ role.description }}</h4>
          <div class="permissions-list">
            <div 
              v-for="permission in role.permissions" 
              :key="permission"
              class="permission-item"
            >
              ✓ {{ getPermissionLabel(permission) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useUsersStore } from '../stores/users';
import type { User } from '../types';

const usersStore = useUsersStore();

// États
const showAddUser = ref(false);
const editingUser = ref<User | null>(null);

// Formulaire
const userForm = reactive({
  name: '',
  username: '',
  email: '',
  phone: '',
  role: '' as 'admin' | 'employee' | 'manager',
  password: '',
  isActive: true
});

// Computed
const users = computed(() => usersStore.users);
const activeUsers = computed(() => usersStore.activeUsers);
const inactiveUsers = computed(() => usersStore.inactiveUsers);
const roles = computed(() => usersStore.roles);
const currentUser = computed(() => usersStore.currentUser);

const hasPermission = (permission: string) => {
  return usersStore.hasPermission(permission);
};

// Méthodes
const showAddUserForm = () => {
  resetForm();
  editingUser.value = null;
  showAddUser.value = true;
};

const closeForm = () => {
  showAddUser.value = false;
  editingUser.value = null;
  resetForm();
};

const resetForm = () => {
  Object.assign(userForm, {
    name: '',
    username: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    isActive: true
  });
};

const handleUserSubmit = () => {
  if (editingUser.value) {
    // Modification
    const updates: any = { ...userForm };
    if (!updates.password) {
      delete updates.password;
    }
    usersStore.updateUser(editingUser.value.id, updates);
  } else {
    // Ajout
    usersStore.addUser(userForm);
  }
  closeForm();
};

const editUser = (user: User) => {
  editingUser.value = user;
  Object.assign(userForm, {
    name: user.name,
    username: user.username,
    email: user.email || '',
    phone: user.phone || '',
    role: user.role,
    password: '', // Ne pas pré-remplir le mot de passe
    isActive: user.isActive
  });
  showAddUser.value = true;
};

const deleteUser = (id: string) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
    try {
      usersStore.deleteUser(id);
    } catch (error: any) {
      alert(error.message);
    }
  }
};

const toggleUserStatus = (id: string) => {
  if (currentUser.value?.id === id) {
    alert('Vous ne pouvez pas désactiver votre propre compte');
    return;
  }
  usersStore.toggleUserStatus(id);
};

const getRoleLabel = (role: string) => {
  const labels: { [key: string]: string } = {
    admin: 'Administrateur',
    manager: 'Gestionnaire',
    employee: 'Employé'
  };
  return labels[role] || role;
};

const getPermissionLabel = (permission: string) => {
  const labels: { [key: string]: string } = {
    view_sales: 'Voir les ventes',
    create_sales: 'Créer des ventes',
    view_products: 'Voir les produits',
    manage_products: 'Gérer les produits',
    view_users: 'Voir les utilisateurs',
    manage_users: 'Gérer les utilisateurs',
    view_stats: 'Voir les statistiques',
    manage_categories: 'Gérer les catégories'
  };
  return labels[permission] || permission;
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('fr-FR');
};

// Initialisation
onMounted(() => {
  usersStore.initializeUsers();
});
</script>

<style scoped>
.utilisateurs-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

/* Styles pour le formulaire (similaires à GestionProduits) */
.form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.form-container {
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.user-form {
  background: white;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #2c3e50;
}

input, select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

/* Statistiques */
.users-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  font-size: 2em;
}

.stat-info h3 {
  margin: 0 0 5px 0;
  color: #7f8c8d;
  font-size: 0.9em;
}

.stat-value {
  margin: 0;
  font-size: 1.5em;
  font-weight: bold;
  color: #2c3e50;
}

/* Tableau */
.users-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
  margin-bottom: 30px;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background: #34495e;
  color: white;
  padding: 15px;
  text-align: left;
  font-weight: 600;
}

.users-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #ecf0f1;
}

.users-table tr:hover {
  background: #f8f9fa;
}

.users-table tr.current-user {
  background: #e3f2fd;
}

.users-table tr.inactive-user {
  opacity: 0.6;
}

.user-info .user-main {
  display: flex;
  flex-direction: column;
}

.username {
  color: #7f8c8d;
  font-size: 0.8em;
  margin-top: 2px;
}

.role-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  color: white;
  font-weight: 500;
}

.role-admin { background: #e74c3c; }
.role-manager { background: #f39c12; }
.role-employee { background: #3498db; }

.contact-info {
  font-size: 0.9em;
}

.email, .phone {
  margin-bottom: 2px;
}

.no-contact {
  color: #7f8c8d;
  font-style: italic;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 500;
  color: white;
}

.status-badge.active { background: #27ae60; }
.status-badge.inactive { background: #95a5a6; }

.date-cell {
  white-space: nowrap;
  color: #7f8c8d;
  font-size: 0.9em;
}

.actions-cell {
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.btn-edit, .btn-delete {
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-edit {
  background: #f39c12;
  color: white;
}

.btn-edit:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-delete {
  background: #e74c3c;
  color: white;
}

.btn-delete:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* Rôles info */
.roles-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.role-card {
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 15px;
}

.role-card h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.permission-item {
  font-size: 0.9em;
  color: #27ae60;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.btn-success {
  background: #27ae60;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
    text-align: center;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .users-table {
    font-size: 0.8em;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 2px;
  }
}
</style>