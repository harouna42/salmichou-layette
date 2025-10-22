import { defineStore } from 'pinia';
import { useUsersStore } from './users';

export const useAuthStore = defineStore('auth', () => {
  const usersStore = useUsersStore();

  // Proxy vers le usersStore
  const currentUser = () => usersStore.currentUser;
  const isAuthenticated = () => !!usersStore.currentUser;
  const isAdmin = () => usersStore.currentUser?.role === 'admin';
  const isManager = () => usersStore.currentUser?.role === 'manager';
  const isEmployee = () => usersStore.currentUser?.role === 'employee';

  const login = (username: string, password: string): boolean => {
    return usersStore.login(username, password);
  };

  const logout = () => {
    usersStore.logout();
  };

  const initialize = () => {
    usersStore.initializeUsers();
  };

  const hasPermission = (permission: string): boolean => {
    return usersStore.hasPermission(permission as any);
  };

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    isManager,
    isEmployee,
    login,
    logout,
    initialize,
    hasPermission
  };
});