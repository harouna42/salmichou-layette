<template>
  <div class="app">
    <NavigationVerticale v-if="isAuthenticated" />
    <main :class="{ 'with-nav': isAuthenticated }">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useUsersStore } from './stores/users';
import { useAppStore } from './stores/app';
import NavigationVerticale from './components/NavigationVerticale.vue';

const authStore = useAuthStore();
const usersStore = useUsersStore();
const appStore = useAppStore();

const isAuthenticated = () => !!usersStore.currentUser;

onMounted(() => {
  usersStore.initializeUsers();
  authStore.initialize();
  appStore.initializeData();
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f5f6fa;
  color: #2c3e50;
}

.app {
  display: flex;
  min-height: 100vh;
}

main {
  flex: 1;
}

main.with-nav {
  margin-left: 250px;
}
</style>