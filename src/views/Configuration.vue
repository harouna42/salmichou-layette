<template>
  <div class="configuration-container">
    <div class="header">
      <h1>⚙️ Configuration</h1>
    </div>

    <div class="config-sections">
      <!-- Session -->
      <div class="config-section">
        <h3>🔐 Paramètres de Session</h3>
        <div class="config-group">
          <label>Durée de session (heures) :</label>
          <input 
            v-model.number="config.sessionDuration" 
            type="number" 
            min="1" 
            max="24"
            class="config-input"
          >
          <span class="config-help">
            Durée avant déconnexion automatique (1-24 heures)
          </span>
        </div>
      </div>

      <!-- Sauvegarde -->
      <div class="config-section">
        <h3>💾 Paramètres de Sauvegarde</h3>
        <div class="config-group">
          <label class="toggle-label">
            <input 
              type="checkbox" 
              v-model="config.autoBackup"
            >
            <span class="toggle-slider"></span>
            <span class="toggle-text">Sauvegarde automatique</span>
          </label>
          <span class="config-help">
            Sauvegarde automatique périodique des données
          </span>
        </div>

        <div class="config-group" v-if="config.autoBackup">
          <label>Intervalle de sauvegarde (minutes) :</label>
          <input 
            v-model.number="config.backupInterval" 
            type="number" 
            min="5" 
            max="1440"
            class="config-input"
          >
          <span class="config-help">
            Fréquence des sauvegardes automatiques
          </span>
        </div>
      </div>

      <!-- Interface -->
      <div class="config-section">
        <h3>🎨 Interface Utilisateur</h3>
        <div class="config-group">
          <label>Langue :</label>
          <select v-model="config.language" class="config-select">
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>

        <div class="config-group">
          <label>Thème :</label>
          <select v-model="config.theme" class="config-select">
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="config-actions">
      <button @click="saveConfig" class="btn-primary">
        💾 Sauvegarder la configuration
      </button>
      
      <button @click="exportConfig" class="btn-secondary">
        📤 Exporter la configuration
      </button>
      
      <button @click="triggerImport" class="btn-secondary">
        📥 Importer la configuration
      </button>
      
      <button @click="resetConfig" class="btn-danger">
        🔄 Réinitialiser aux valeurs par défaut
      </button>
    </div>

    <!-- Import fichier -->
    <input 
      type="file" 
      ref="fileInput"
      accept=".json" 
      @change="handleConfigImport"
      style="display: none"
    >

    <!-- Message -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>

    <!-- Aperçu configuration actuelle -->
    <div class="config-preview">
      <h4>📋 Aperçu de la configuration</h4>
      <pre>{{ configPreview }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { appConfig, defaultConfig, type AppConfig } from '../config/appConfig';

const fileInput = ref<HTMLInputElement>();
const message = ref('');
const messageType = ref<'success' | 'error'>('success');

// Configuration réactive
const config = reactive<AppConfig>({ ...defaultConfig });

// Aperçu
const configPreview = computed(() => JSON.stringify(config, null, 2));

// Charger la configuration au montage
onMounted(() => {
  const savedConfig = appConfig.loadConfig();
  Object.assign(config, savedConfig);
});

// Méthodes
const saveConfig = () => {
  appConfig.saveConfig(config);
  showMessage('✅ Configuration sauvegardée avec succès', 'success');
  
  // Recharger la session si durée modifiée
  if (config.sessionDuration !== appConfig.loadConfig().sessionDuration) {
    showMessage('🔄 Redémarrage requis pour appliquer la nouvelle durée de session', 'success');
  }
};

const exportConfig = () => {
  const configStr = appConfig.exportConfig(config);
  const blob = new Blob([configStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `salmichou-config-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showMessage('✅ Configuration exportée', 'success');
};

const triggerImport = () => {
  fileInput.value?.click();
};

const handleConfigImport = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const result = appConfig.importConfig(content);
      
      if (result.success && result.config) {
        Object.assign(config, result.config);
        showMessage('✅ Configuration importée avec succès', 'success');
      } else {
        showMessage('❌ ' + result.error, 'error');
      }
    } catch (error) {
      showMessage('❌ Fichier de configuration invalide', 'error');
    }
  };
  
  reader.readAsText(file);
  target.value = '';
};

const resetConfig = () => {
  if (confirm('Réinitialiser la configuration aux valeurs par défaut ?')) {
    Object.assign(config, defaultConfig);
    appConfig.saveConfig(defaultConfig);
    showMessage('✅ Configuration réinitialisée', 'success');
  }
};

const showMessage = (msg: string, type: 'success' | 'error') => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 5000);
};
</script>

<style scoped>
.configuration-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
  text-align: center;
}

.config-sections {
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-bottom: 30px;
}

.config-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.config-section h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  border-bottom: 2px solid #ecf0f1;
  padding-bottom: 10px;
}

.config-group {
  margin-bottom: 20px;
}

.config-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.config-input, .config-select {
  width: 100%;
  max-width: 300px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.config-help {
  display: block;
  margin-top: 5px;
  font-size: 0.8em;
  color: #7f8c8d;
  font-style: italic;
}

/* Toggle switch */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-weight: 500;
}

.toggle-slider {
  position: relative;
  width: 50px;
  height: 24px;
  background: #ccc;
  border-radius: 24px;
  transition: background 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
}

input[type="checkbox"] {
  display: none;
}

input[type="checkbox"]:checked + .toggle-slider {
  background: #4caf50;
}

input[type="checkbox"]:checked + .toggle-slider::before {
  transform: translateX(26px);
}

.toggle-text {
  margin-left: 10px;
}

/* Actions */
.config-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 30px;
  justify-content: center;
}

/* Aperçu */
.config-preview {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.config-preview h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.config-preview pre {
  background: white;
  padding: 15px;
  border-radius: 5px;
  border: 1px solid #ddd;
  font-size: 0.9em;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

/* Boutons */
.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-danger:hover {
  background: #c0392b;
}

.message {
  padding: 12px;
  border-radius: 5px;
  margin: 15px 0;
  font-weight: 500;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@media (max-width: 768px) {
  .config-actions {
    flex-direction: column;
  }
  
  .config-input, .config-select {
    max-width: 100%;
  }
}
</style>