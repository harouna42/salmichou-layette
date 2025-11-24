import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { jsonStorage } from '../storage/jsonStorage';
import type { User, Role, UserPermission } from '../types';

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([]);
  const currentUser = ref<User | null>(null);

  // Rôles prédéfinis avec permissions
  const roles: Role[] = [
    {
      id: '1',
      name: 'admin',
      description: 'Administrateur complet',
      permissions: ['view_sales', 'create_sales', 'view_products', 'manage_products', 'view_users', 'manage_users', 'view_stats', 'manage_categories']
    },
    {
      id: '2', 
      name: 'manager',
      description: 'Gestionnaire',
      permissions: ['view_sales', 'create_sales', 'view_products', 'manage_products', 'view_stats', 'manage_categories']
    },
    {
      id: '3',
      name: 'employee', 
      description: 'Employé de vente',
      permissions: ['view_sales', 'create_sales', 'view_products']
    }
  ];

  // Computed pour l'authentification
  const isAuthenticated = computed(() => !!currentUser.value);
  const isAdmin = computed(() => currentUser.value?.role === 'admin');
  const isManager = computed(() => currentUser.value?.role === 'manager');
  const isEmployee = computed(() => currentUser.value?.role === 'employee');

  // Initialisation
  const initializeUsers = () => {
    const data = jsonStorage.loadData();
    users.value = data.users.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt)
    }));

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      currentUser.value = JSON.parse(storedUser);
    }
  };

  // Authentification
  const login = (username: string, password: string): boolean => {
    const user = users.value.find(u => 
      u.username === username && 
      u.password === password && 
      u.isActive
    );
    
    if (user) {
      currentUser.value = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    currentUser.value = null;
    localStorage.removeItem('currentUser');
  };

  // Gestion des utilisateurs
  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    users.value.push(newUser);
    saveUsers();
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    const index = users.value.findIndex(u => u.id === id);
    if (index !== -1) {
      users.value[index] = {
        ...users.value[index],
        ...updates,
        updatedAt: new Date()
      };
      
      saveUsers();

      if (currentUser.value?.id === id) {
        currentUser.value = users.value[index];
        localStorage.setItem('currentUser', JSON.stringify(users.value[index]));
      }
    }
  };

  const deleteUser = (id: string) => {
    if (currentUser.value?.id === id) {
      throw new Error('Vous ne pouvez pas supprimer votre propre compte');
    }

    users.value = users.value.filter(u => u.id !== id);
    saveUsers();
  };

  const toggleUserStatus = (id: string) => {
    if (currentUser.value?.id === id) {
      throw new Error('Vous ne pouvez pas désactiver votre propre compte');
    }

    const user = users.value.find(u => u.id === id);
    if (user) {
      user.isActive = !user.isActive;
      user.updatedAt = new Date();
      saveUsers();
    }
  };

  // Permissions
  const hasPermission = (permission: UserPermission): boolean => {
    if (!currentUser.value) return false;
    
    const userRole = roles.find(r => r.name === currentUser.value!.role);
    return userRole ? userRole.permissions.includes(permission) : false;
  };

  const getUserRole = () => {
    if (!currentUser.value) return null;
    return roles.find(r => r.name === currentUser.value!.role);
  };

  // Sauvegarde
  const saveUsers = () => {
    const data = jsonStorage.loadData();
    data.users = users.value;
    jsonStorage.saveData(data);
  };

  return {
    // États
    users,
    currentUser,
    roles,
    
    // Computed
    isAuthenticated,
    isAdmin,
    isManager,
    isEmployee,
    activeUsers: computed(() => users.value.filter(u => u.isActive)),
    inactiveUsers: computed(() => users.value.filter(u => !u.isActive)),
    
    // Méthodes
    initializeUsers,
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    hasPermission,
    getUserRole,
    saveUsers
  };
});