import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { i18n, loadPreferredLanguage } from './i18n';

const app = createApp(App);
const pinia = createPinia();

// Charger la langue préférée
loadPreferredLanguage();

app.use(pinia);
app.use(router);
app.use(i18n);

setTimeout(() => {
  app.mount('#app');
  console.log('Application démarrée');
}, 100);