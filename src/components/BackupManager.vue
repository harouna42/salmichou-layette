<template>
  <div class="backup-manager">
    <h3>💾 Gestion des Exportations</h3>
    
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
      <div class="info-item">
        <strong>Catégories:</strong> {{ categoriesCount }}
      </div>
    </div>

    <!-- Exportations séparées -->
    <div class="export-section">
      <h4>📤 Exporter par type</h4>
      
      <div class="export-grid">
        <div class="export-card">
          <div class="export-icon">📦</div>
          <div class="export-info">
            <h5>Produits</h5>
            <p>{{ productsCount }} produits</p>
          </div>
          <button 
            @click="exportProducts" 
            class="btn-export"
            :disabled="productsCount === 0"
          >
            Exporter
          </button>
        </div>

        <div class="export-card">
          <div class="export-icon">📁</div>
          <div class="export-info">
            <h5>Catégories</h5>
            <p>{{ categoriesCount }} catégories</p>
          </div>
          <button 
            @click="exportCategories" 
            class="btn-export"
            :disabled="categoriesCount === 0"
          >
            Exporter
          </button>
        </div>

        <div class="export-card">
          <div class="export-icon">🛒</div>
          <div class="export-info">
            <h5>Ventes</h5>
            <p>{{ salesCount }} ventes</p>
          </div>
          <button 
            @click="exportSales" 
            class="btn-export"
            :disabled="salesCount === 0"
          >
            Exporter
          </button>
        </div>

        <div class="export-card" v-if="hasPermission('manage_users')">
          <div class="export-icon">👥</div>
          <div class="export-info">
            <h5>Utilisateurs</h5>
            <p>{{ usersCount }} utilisateurs</p>
          </div>
          <button 
            @click="exportUsers" 
            class="btn-export"
            :disabled="usersCount === 0"
          >
            Exporter
          </button>
        </div>
      </div>

      <!-- Export complet -->
      <div class="full-export">
        <button 
          @click="exportAll" 
          class="btn-primary full-export-btn"
          :disabled="totalDataCount === 0"
        >
          💾 Exporter toutes les données ({{ totalDataCount }} éléments)
        </button>
      </div>
    </div>

    <!-- Import -->
    <div class="import-section">
      <h4>📤 Importer des données</h4>
      
      <div class="import-options">
        <select v-model="importType" class="import-select">
          <option value="auto">Détection automatique</option>
          <option value="products">Produits</option>
          <option value="categories">Catégories</option>
          <option value="sales">Ventes</option>
          <option value="users">Utilisateurs</option>
          <option value="full">Toutes les données</option>
        </select>

        <button @click="triggerImport" class="btn-secondary">
          📂 Choisir le fichier à importer
        </button>
      </div>

      <div class="import-info">
        <p>Formats supportés : JSON exporté depuis Salmichou Layette</p>
      </div>
    </div>

    <!-- Réinitialisation (Admin seulement) -->
    <div class="danger-section" v-if="hasPermission('manage_users')">
      <h4>🗑️ Zone de réinitialisation</h4>
      <button 
        @click="resetData" 
        class="btn-danger" 
        title="Réinitialiser toutes les données"
      >
        🔥 Réinitialiser toutes les données
      </button>
      <p class="warning-text">
        ⚠️ Attention : Cette action supprime définitivement toutes les données et ne peut pas être annulée.
      </p>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { fileStorage } from '../storage/fileStorage';
import { ExportManager } from '../utils/exportManager';
import { useAppStore } from '../stores/app';
import { useUsersStore } from '../stores/users';

const appStore = useAppStore();
const usersStore = useUsersStore();
const fileInput = ref<HTMLInputElement>();

// États
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const importType = ref('auto');

// Computed
const lastSave = computed(() => {
  const data = fileStorage.getCurrentData();
  return data ? new Date(data.lastSave) : null;
});

const salesCount = computed(() => appStore.sales.length);
const productsCount = computed(() => appStore.products.length);
const categoriesCount = computed(() => appStore.categories.length);
const usersCount = computed(() => usersStore.users.length);
const totalDataCount = computed(() => salesCount.value + productsCount.value + categoriesCount.value + usersCount.value);

const hasPermission = (permission: string) => {
  return usersStore.hasPermission(permission);
};

// Méthodes d'export
const exportProducts = () => {
  const result = ExportManager.exportProducts(appStore.products);
  if (result.success && result.data) {
    ExportManager.downloadFile(result.data, ExportManager.generateFilename('produits'));
    showMessage('✅ Produits exportés avec succès !', 'success');
  } else {
    showMessage('❌ ' + result.error, 'error');
  }
};

const exportCategories = () => {
  const result = ExportManager.exportCategories(appStore.categories);
  if (result.success && result.data) {
    ExportManager.downloadFile(result.data, ExportManager.generateFilename('categories'));
    showMessage('✅ Catégories exportées avec succès !', 'success');
  } else {
    showMessage('❌ ' + result.error, 'error');
  }
};

const exportSales = () => {
  const result = ExportManager.exportSales(appStore.sales);
  if (result.success && result.data) {
    ExportManager.downloadFile(result.data, ExportManager.generateFilename('ventes'));
    showMessage('✅ Ventes exportées avec succès !', 'success');
  } else {
    showMessage('❌ ' + result.error, 'error');
  }
};

const exportUsers = () => {
  const result = ExportManager.exportUsers(usersStore.users);
  if (result.success && result.data) {
    ExportManager.downloadFile(result.data, ExportManager.generateFilename('utilisateurs'));
    showMessage('✅ Utilisateurs exportés avec succès !', 'success');
  } else {
    showMessage('❌ ' + result.error, 'error');
  }
};

const exportAll = () => {
  const data = {
    products: appStore.products,
    categories: appStore.categories,
    sales: appStore.sales,
    users: usersStore.users
  };
  
  const result = ExportManager.exportAll(data);
  if (result.success && result.data) {
    ExportManager.downloadFile(result.data, ExportManager.generateFilename('sauvegarde_complete'));
    showMessage('✅ Toutes les données exportées avec succès !', 'success');
  } else {
    showMessage('❌ ' + result.error, 'error');
  }
};

// Méthodes d'import
const triggerImport = () => {
  fileInput.value?.click();
};

const handleFileImport = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (confirm('⚠️ Cette action va modifier vos données. Êtes-vous sûr ?')) {
      const result = await fileStorage.importFromFile(file, importType.value);
      
      if (result.success) {
        await appStore.initializeData();
        usersStore.initializeUsers();
        showMessage('✅ ' + result.message, 'success');
      } else {
        showMessage('❌ ' + result.message, 'error');
      }
    }
  } catch (error) {
    showMessage('❌ Fichier invalide ou corrompu', 'error');
  }
  
  target.value = '';
};

const resetData = async () => {
  if (confirm('🚨 CETTE ACTION EST IRREVERSIBLE ! Toutes les données seront perdues. Confirmer la réinitialisation ?')) {
    await appStore.resetData();
    showMessage('✅ Données réinitialisées', 'success');
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

// Initialisation
onMounted(() => {
  appStore.initializeData();
  usersStore.initializeUsers();
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
  margin-bottom: 30px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 5px;
}

/* Section Export */
.export-section {
  margin-bottom: 30px;
}

.export-section h4 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.export-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.export-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.export-icon {
  font-size: 1.5em;
}

.export-info {
  flex: 1;
}

.export-info h5 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.export-info p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9em;
}

.btn-export {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-export:hover:not(:disabled) {
  background: #138496;
}

.btn-export:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.full-export {
  text-align: center;
  padding: 20px;
  background: #e8f5e8;
  border-radius: 8px;
}

.full-export-btn {
  padding: 12px 24px;
  font-size: 1.1em;
}

/* Section Import */
.import-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #e3f2fd;
  border-radius: 8px;
}

.import-section h4 {
  color: #1976d2;
  margin-bottom: 15px;
}

.import-options {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.import-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  min-width: 200px;
}

.import-info {
  font-size: 0.9em;
  color: #666;
}

/* Section Danger */
.danger-section {
  padding: 20px;
  background: #f8d7da;
  border-radius: 8px;
  border-left: 4px solid #dc3545;
}

.danger-section h4 {
  color: #721c24;
  margin-bottom: 15px;
}

.warning-text {
  color: #856404;
  font-size: 0.9em;
  margin-top: 10px;
}

/* Boutons */
.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-danger:hover {
  background: #c82333;
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
  .export-grid {
    grid-template-columns: 1fr;
  }
  
  .import-options {
    flex-direction: column;
    align-items: stretch;
  }
  
  .import-select {
    min-width: auto;
  }
}
</style>