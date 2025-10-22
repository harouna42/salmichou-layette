<template>
  <div class="login-container">
    <div class="login-form">
      <h1>Salmichou Layette</h1>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Nom d'utilisateur:</label>
          <input v-model="username" type="text" required>
        </div>
        
        <div class="form-group">
          <label>Mot de passe:</label>
          <input v-model="password" type="password" required>
        </div>
        
        <button type="submit" class="btn-login">Se connecter</button>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>        
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');

const handleLogin = () => {
  if (authStore.login(username.value, password.value)) {
    router.push('/ventes');
  } else {
    error.value = 'Identifiants incorrects';
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f5f6fa;
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  width: 400px;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
}

.btn-login {
  width: 100%;
  background: #3498db;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.error-message {
  color: #e74c3c;
  text-align: center;
  margin-top: 15px;
}

.demo-accounts {
  margin-top: 30px;
  padding: 15px;
  background: #ecf0f1;
  border-radius: 5px;
  font-size: 14px;
}
</style>