<template>
  <div class="backup-manager">
    <h3>💾 Gestion des Sauvegardes</h3>
    
    <div class="backup-info">
      <div class="info-item">
        <strong>Dernière sauvegarde:</strong> 
        {{ lastSave ? formatDate(lastSave) : 'Jamais' }}
      </div>
      <div class="info-item">
        <strong>Ventes enregistrées:</strong> {{ salesCount }}
      </div>
      <div class="info-item">
        <strong>Produits en stock:</strong> {{ productsCount }}
      </div>
      <div class="info-item" v-if="autoSaveEnabled">
        <strong>Prochaine sauvegarde auto:</strong> {{ timeUntilNextSave }}s
      </div>
    </div>

    <div class="backup-actions">
      <button @click="createBackup" class="btn-primary" title="Télécharger un fichier de sauvegarde">
        💾 Sauvegarder maintenant
      </button>
      
      <button @click="triggerImport" class="btn-secondary" title="Importer un fichier de sauvegarde">
        📂 Importer une sauvegarde
      </button>

      <button 
        v-if="hasPermission('manage_users')"
        @click="resetData" 
        class="btn-danger" 
        title="Réinitialiser toutes les données"
      >
        🗑️ Réinitialiser
      </button>

      <button @click="showAutoSave = !showAutoSave" class="btn-info">
        ⚙️ {{ showAutoSave ? 'Masquer' : 'Afficher' }} options
      </button>
    </div>

    <!-- Options de sauvegarde automatique -->
    <div v-if="showAutoSave" class="auto-save-options">
      <h4>🔄 Sauvegarde Automatique</h4>
      
      <div class="option-group">
        <label class="toggle-label">
          <input 
            type="checkbox" 
            v-model="autoSaveEnabled"
            @change="toggleAutoSave"
          >
          <span class="toggle-slider"></span>
          <span class="toggle-text">Sauvegarde automatique activée</span>
        </label>
        <div class="option-description">
          Une sauvegarde sera créée automatiquement toutes les 5 minutes
        </div>
      </div>

      <div class="option-group" v-if="autoSaveEnabled">
        <label class="toggle-label">
          <input 
            type="checkbox" 
            v-model="backupOnExit"
          >
          <span class="toggle-slider"></span>
          <span class="toggle-text">Alerte à la fermeture</span>
        </label>
        <div class="option-description">
          Avertir si des données non sauvegardées lors de la fermeture
        </div>
      </div>

      <div class="option-group" v-if="autoSaveEnabled">
        <label class="toggle-label">
          <input 
            type="checkbox" 
            v-model="silentAutoSave"
          >
          <span class="toggle-slider"></span>
          <span class="toggle-text">Sauvegarde silencieuse</span>
        </label>
        <div class="option-description">
          Ne pas montrer la notification de sauvegarde automatique
        </div>
      </div>

      <div class="backup-stats" v-if="autoSaveEnabled">
        <div class="stat">
          <strong>Sauvegardes automatiques:</strong> {{ autoSaveCount }}
        </div>
        <div class="stat">
          <strong>Prochaine sauvegarde:</strong> {{ timeUntilNextSave }} secondes
        </div>
      </div>
    </div>

    <input 
      type="file" 
      ref="fileInput"
      accept=".json" 
      @change="handleFileImport"
      style="display: none"
    >

    <!-- Messages -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>

    <!-- Notification de sauvegarde automatique -->
    <div v-if="showAutoSaveNotification" class="auto-save-notification">
      🔄 Sauvegarde automatique effectuée à {{ formatTime(new Date()) }}
    </div>

    <!-- Aide -->
    <div class="backup-help">
      <h4>📋 Instructions de sauvegarde</h4>
      <ul>
        <li>💾 <strong>Sauvegarder</strong> : Télécharge un fichier JSON avec toutes vos données</li>
        <li>📂 <strong>Importer</strong> : Remplace les données actuelles par celles d'un fichier de sauvegarde</li>
        <li>🔄 <strong>Sauvegarde auto</strong> : Se déclenche automatiquement toutes les 5 minutes</li>
        <li>🛡️ <strong>Conseil</strong> : Sauvegardez régulièrement sur une clé USB ou cloud</li>
        <li>⚠️ <strong>Attention</strong> : Sans sauvegarde, les données peuvent être perdues si le cache est vidé</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { fileStorage } from '../storage/fileStorage';
import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';

const appStore = useAppStore();
const authStore = useAuthStore();
const fileInput = ref<HTMLInputElement>();

// États
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const showAutoSave = ref(false);
const autoSaveEnabled = ref(false);
const backupOnExit = ref(true);
const silentAutoSave = ref(false);
const showAutoSaveNotification = ref(false);
const timeUntilNextSave = ref(300); // 5 minutes en secondes
const autoSaveCount = ref(0);

// Timers
let autoSaveInterval: number | null = null;
let countdownInterval: number | null = null;

// Computed
const lastSave = computed(() => {
  const data = fileStorage.getCurrentData();
  return data ? new Date(data.lastSave) : null;
});

const salesCount = computed(() => appStore.sales.length);
const productsCount = computed(() => appStore.products.length);

const hasPermission = (permission: string) => {
  return authStore.hasPermission(permission);
};

// Méthodes
const createBackup = async () => {
  try {
    const data = fileStorage.getCurrentData();
    if (data) {
      fileStorage.downloadBackup(data);
      showMessage('✅ Sauvegarde créée avec succès !', 'success');
    }
  } catch (error) {
    showMessage('❌ Erreur lors de la sauvegarde', 'error');
  }
};

const triggerImport = () => {
  fileInput.value?.click();
};

const handleFileImport = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;

  if (confirm('⚠️ ATTENTION : Cette action va remplacer toutes vos données actuelles. Êtes-vous sûr ?')) {
    const result = await fileStorage.importFromFile(file);
    
    if (result.success) {
      await appStore.initializeData();
      showMessage('✅ ' + result.message, 'success');
      
      // Redémarrer la sauvegarde auto si import réussi
      if (autoSaveEnabled.value) {
        restartAutoSave();
      }
    } else {
      showMessage('❌ ' + result.message, 'error');
    }
  }
  
  target.value = '';
};

const resetData = async () => {
  if (confirm('🚨 CETTE ACTION EST IRREVERSIBLE ! Toutes les données seront perdues. Confirmer la réinitialisation ?')) {
    await appStore.resetData();
    showMessage('✅ Données réinitialisées', 'success');
    autoSaveCount.value = 0;
  }
};

const toggleAutoSave = () => {
  if (autoSaveEnabled.value) {
    startAutoSave();
    showMessage('✅ Sauvegarde automatique activée', 'success');
  } else {
    stopAutoSave();
    showMessage('🔴 Sauvegarde automatique désactivée', 'success');
  }
};

const startAutoSave = () => {
  const interval = 5 * 60 * 1000; // 5 minutes
  
  // Sauvegarde immédiate au démarrage
  performAutoSave();
  
  // Configurer l'intervalle régulier
  autoSaveInterval = window.setInterval(() => {
    performAutoSave();
  }, interval);

  // Démarrer le compte à rebours
  startCountdown();
};

const stopAutoSave = () => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  timeUntilNextSave.value = 300;
};

const restartAutoSave = () => {
  stopAutoSave();
  if (autoSaveEnabled.value) {
    startAutoSave();
  }
};

const startCountdown = () => {
  countdownInterval = window.setInterval(() => {
    if (timeUntilNextSave.value > 1) {
      timeUntilNextSave.value--;
    } else {
      timeUntilNextSave.value = 300; // Reset à 5 minutes
    }
  }, 1000);
};

const performAutoSave = async () => {
  try {
    const data = fileStorage.getCurrentData();
    if (data && (data.sales.length > 0 || data.products.length > 0)) {
      fileStorage.downloadBackup(data);
      autoSaveCount.value++;
      
      if (!silentAutoSave.value) {
        showAutoSaveNotification.value = true;
        setTimeout(() => {
          showAutoSaveNotification.value = false;
        }, 3000);
      }
      
      console.log(`Sauvegarde automatique #${autoSaveCount.value} effectuée`);
    }
  } catch (error) {
    console.error('Erreur sauvegarde automatique:', error);
  }
};

const showMessage = (msg: string, type: 'success' | 'error') => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 5000);
};

const formatDate = (date: Date) => {
  return date.toLocaleString('fr-FR');
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Gestion de la fermeture de la page
const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
  if (backupOnExit.value && autoSaveEnabled.value) {
    const data = fileStorage.getCurrentData();
    if (data && data.sales.length > 0) {
      // Vérifier si une vente a été faite récemment (dans les 2 dernières minutes)
      const lastSale = data.sales[0];
      if (lastSale && (Date.now() - new Date(lastSale.createdAt).getTime()) < 2 * 60 * 1000) {
        event.preventDefault();
        event.returnValue = 'Une vente récente a été effectuée. Voulez-vous vraiment quitter sans sauvegarde manuelle ?';
        return 'Une vente récente a été effectuée. Voulez-vous vraiment quirer sans sauvegarde manuelle ?';
      }
    }
  }
};

// Initialisation
onMounted(() => {
  // Charger les préférences depuis le localStorage
  const preferences = localStorage.getItem('backup-preferences');
  if (preferences) {
    const prefs = JSON.parse(preferences);
    autoSaveEnabled.value = prefs.autoSaveEnabled || false;
    backupOnExit.value = prefs.backupOnExit !== false; // true par défaut
    silentAutoSave.value = prefs.silentAutoSave || false;
  }

  // Démarrer la sauvegarde auto si activée
  if (autoSaveEnabled.value) {
    startAutoSave();
  }

  // Écouter la fermeture de page
  window.addEventListener('beforeunload', beforeUnloadHandler);
});

// Sauvegarde des préférences
const savePreferences = () => {
  const preferences = {
    autoSaveEnabled: autoSaveEnabled.value,
    backupOnExit: backupOnExit.value,
    silentAutoSave: silentAutoSave.value
  };
  localStorage.setItem('backup-preferences', JSON.stringify(preferences));
};

// Watch les préférences pour les sauvegarder
import { watch } from 'vue';
watch([autoSaveEnabled, backupOnExit, silentAutoSave], () => {
  savePreferences();
});

onUnmounted(() => {
  stopAutoSave();
  window.removeEventListener('beforeunload', beforeUnloadHandler);
});
</script>

<style scoped>
.backup-manager {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin: 20px 0;
}

.backup-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 5px;
}

.info-item {
  font-size: 0.9em;
}

.backup-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.auto-save-options {
  background: #e3f2fd;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #2196f3;
}

.auto-save-options h4 {
  margin: 0 0 15px 0;
  color: #1976d2;
}

.option-group {
  margin-bottom: 15px;
}

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

.option-description {
  font-size: 0.85em;
  color: #666;
  margin-top: 5px;
  margin-left: 62px;
}

.backup-stats {
  background: rgba(255,255,255,0.7);
  padding: 15px;
  border-radius: 5px;
  margin-top: 15px;
}

.stat {
  margin-bottom: 8px;
  font-size: 0.9em;
}

.auto-save-notification {
  background: #e8f5e8;
  color: #2e7d32;
  padding: 10px 15px;
  border-radius: 5px;
  margin: 10px 0;
  text-align: center;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.backup-help {
  background: #fff3cd;
  padding: 15px;
  border-radius: 5px;
  margin-top: 20px;
  border-left: 4px solid #ffc107;
}

.backup-help h4 {
  margin: 0 0 10px 0;
  color: #856404;
}

.backup-help ul {
  margin: 0;
  padding-left: 20px;
}

.backup-help li {
  margin-bottom: 8px;
  font-size: 0.9em;
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

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 15px;
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
  padding: 10px 15px;
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
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-danger:hover {
  background: #c0392b;
}

.btn-info {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-info:hover {
  background: #138496;
}

@media (max-width: 768px) {
  .backup-actions {
    flex-direction: column;
  }
  
  .backup-info {
    grid-template-columns: 1fr;
  }
  
  .option-description {
    margin-left: 0;
    margin-top: 8px;
  }
}
</style>