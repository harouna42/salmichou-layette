import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Délai pour éviter les conflits d'initialisation
setTimeout(() => {
  app.mount('#app')
  console.log('Application démarrée')
}, 100)
