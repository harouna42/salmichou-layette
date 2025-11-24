<template>
  <div class="categories-container">
    <div class="header">
      <h1>📁 Gestion des Catégories</h1>
      <button @click="showAddCategory = true" class="btn-primary">
        + Ajouter une catégorie
      </button>
    </div>

    <!-- Formulaire d'ajout/modification -->
    <div v-if="showAddCategory" class="form-overlay">
      <div class="form-container">
        <h3>{{ editingCategory ? 'Modifier' : 'Ajouter' }} une catégorie</h3>
        
        <form @submit.prevent="handleCategorySubmit" class="category-form">
          <div class="form-group">
            <label>Nom de la catégorie *</label>
            <input v-model="categoryForm.name" type="text" required>
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="categoryForm.description"></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-success">
              {{ editingCategory ? 'Modifier' : 'Ajouter' }}
            </button>
            <button type="button" @click="closeForm" class="btn-cancel">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tableau des catégories -->
    <div class="categories-table-container">
      <div class="table-header">
        <div class="table-info">
          <strong>Total: {{ categories.length }} catégories</strong>
        </div>
        <div class="table-actions">
          <input 
            v-model="searchQuery" 
            placeholder="🔍 Rechercher une catégorie..."
            class="search-input"
          >
        </div>
      </div>

      <table class="categories-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Description</th>
            <th>Nombre de produits</th>
            <th>Date de création</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="category in filteredCategories" 
            :key="category.id"
            class="category-row"
          >
            <td class="category-name">
              <strong>{{ category.name }}</strong>
            </td>
            <td class="category-description">
              {{ category.description || 'Aucune description' }}
            </td>
            <td class="product-count">
              <span class="count-badge">
                {{ getProductCount(category.name) }} produit(s)
              </span>
            </td>
            <td class="created-date">
              {{ formatDate(category.createdAt) }}
            </td>
            <td class="actions">
              <div class="action-buttons">
                <button 
                  @click="editCategory(category)"
                  class="btn-edit"
                  title="Modifier la catégorie"
                >
                  ✏️
                </button>
                <button 
                  @click="deleteCategory(category.id)"
                  class="btn-delete"
                  title="Supprimer la catégorie"
                  :disabled="getProductCount(category.name) > 0"
                >
                  🗑️
                </button>
              </div>
              <div v-if="getProductCount(category.name) > 0" class="warning-text">
                Impossible de supprimer - produits associés
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredCategories.length === 0" class="empty-state">
        <p v-if="searchQuery">Aucune catégorie trouvée pour "{{ searchQuery }}"</p>
        <p v-else>Aucune catégorie enregistrée</p>
        <button @click="showAddCategory = true" class="btn-primary">
          Ajouter la première catégorie
        </button>
      </div>
    </div>

    <!-- Statistiques rapides -->
    <div class="categories-stats">
      <div class="stat-card">
        <div class="stat-icon">📁</div>
        <div class="stat-info">
          <h3>Total Catégories</h3>
          <p class="stat-value">{{ categories.length }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <h3>Catégories utilisées</h3>
          <p class="stat-value">{{ usedCategoriesCount }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-info">
          <h3>Dernière ajout</h3>
          <p class="stat-value">{{ lastCategoryDate ? formatDate(lastCategoryDate) : 'Aucune' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useAppStore } from '../stores/app';
import type { Category } from '../types';

const appStore = useAppStore();

// États
const showAddCategory = ref(false);
const editingCategory = ref<Category | null>(null);
const searchQuery = ref('');

// Formulaire
const categoryForm = reactive({
  name: '',
  description: ''
});

// Computed
const categories = computed(() => appStore.categories);
const products = computed(() => appStore.products);

const filteredCategories = computed(() => {
  if (!searchQuery.value) {
    return categories.value;
  }
  
  return categories.value.filter(category =>
    category.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const usedCategoriesCount = computed(() => {
  const usedCategories = new Set(products.value.map(p => p.category));
  return usedCategories.size;
});

const lastCategoryDate = computed(() => {
  if (categories.value.length === 0) return null;
  return new Date(Math.max(...categories.value.map(c => new Date(c.createdAt).getTime())));
});

// Méthodes
const showAddCategoryForm = () => {
  resetForm();
  editingCategory.value = null;
  showAddCategory.value = true;
};

const closeForm = () => {
  showAddCategory.value = false;
  editingCategory.value = null;
  resetForm();
};

const resetForm = () => {
  categoryForm.name = '';
  categoryForm.description = '';
};

const handleCategorySubmit = async () => {
  if (editingCategory.value) {
    // Modification
    await appStore.updateCategory(editingCategory.value.id, categoryForm);
  } else {
    // Ajout
    await appStore.addCategory(categoryForm);
  }
  
  closeForm();
};

const editCategory = (category: Category) => {
  editingCategory.value = category;
  categoryForm.name = category.name;
  categoryForm.description = category.description || '';
  showAddCategory.value = true;
};

const deleteCategory = async (id: string) => {
  const category = categories.value.find(c => c.id === id);
  if (!category) return;

  const productCount = getProductCount(category.name);
  
  if (productCount > 0) {
    alert(`Impossible de supprimer la catégorie "${category.name}" car elle est utilisée par ${productCount} produit(s).`);
    return;
  }

  if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
    await appStore.deleteCategory(id);
  }
};

const getProductCount = (categoryName: string) => {
  return products.value.filter(p => p.category === categoryName).length;
};

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('fr-FR');
};

// Initialisation
onMounted(() => {
  appStore.initializeData();
});
</script>

<style scoped>
.categories-container {
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

/* Tableau */
.categories-table-container {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
  margin-bottom: 30px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.table-info {
  color: #6c757d;
  font-size: 0.9em;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  width: 250px;
  font-size: 0.9em;
}

.categories-table {
  width: 100%;
  border-collapse: collapse;
}

.categories-table th {
  background: #34495e;
  color: white;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  font-size: 0.9em;
}

.categories-table td {
  padding: 15px;
  border-bottom: 1px solid #ecf0f1;
  vertical-align: top;
}

.category-row:hover {
  background: #f8f9fa;
}

.category-name {
  font-weight: 600;
  color: #2c3e50;
  min-width: 150px;
}

.category-description {
  color: #6c757d;
  max-width: 300px;
  line-height: 1.4;
}

.product-count {
  text-align: center;
}

.count-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 500;
}

.created-date {
  color: #6c757d;
  font-size: 0.9em;
  white-space: nowrap;
}

.actions {
  min-width: 120px;
}

.action-buttons {
  display: flex;
  gap: 5px;
  margin-bottom: 5px;
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

.btn-delete {
  background: #e74c3c;
  color: white;
}

.btn-delete:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.6;
}

.warning-text {
  font-size: 0.7em;
  color: #e74c3c;
  font-style: italic;
}

/* Statistiques */
.categories-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 30px;
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

/* Formulaire (styles existants) */
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.category-form {
  background: white;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #2c3e50;
}

input, textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  box-sizing: border-box;
}

textarea {
  min-height: 80px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #eee;
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
  
  .table-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .categories-table {
    font-size: 0.8em;
  }
  
  .categories-table th,
  .categories-table td {
    padding: 10px 8px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 2px;
  }
  
  .categories-stats {
    grid-template-columns: 1fr;
  }
}
</style>