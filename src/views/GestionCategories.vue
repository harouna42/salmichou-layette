<template>
  <div class="categories-container">
    <div class="header">
      <h1>📁 Gestion des Catégories</h1>
      <button 
        @click="showAddCategory = true" 
        class="btn-primary"
        v-if="hasPermission('manage_categories')"
      >
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
            <input 
              v-model="categoryForm.name" 
              type="text" 
              required
              placeholder="ex: Vêtements, Couches, Puériculture..."
              :class="{ 'error': nameError }"
            >
            <div v-if="nameError" class="error-message">{{ nameError }}</div>
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <textarea 
              v-model="categoryForm.description" 
              placeholder="Description de la catégorie..."
              rows="3"
            ></textarea>
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

    <!-- Statistiques -->
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
          <h3>Produits Total</h3>
          <p class="stat-value">{{ totalProducts }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <h3>Ventes par Catégories</h3>
          <p class="stat-value">{{ categoriesWithSales }}</p>
        </div>
      </div>
    </div>

    <!-- Recherche et filtres -->
    <div class="categories-controls">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          placeholder="🔍 Rechercher une catégorie..."
          class="search-input"
        >
      </div>
      
      <div class="filter-controls">
        <button 
          @click="sortBy = 'name'"
          :class="['sort-btn', { 'active': sortBy === 'name' }]"
        >
          📝 Par nom
        </button>
        <button 
          @click="sortBy = 'products'"
          :class="['sort-btn', { 'active': sortBy === 'products' }]"
        >
          📦 Par produits
        </button>
      </div>
    </div>

    <!-- Liste des catégories -->
    <div class="categories-list">
      <div 
        v-for="category in sortedCategories" 
        :key="category.id"
        class="category-card"
      >
        <div class="category-header">
          <h3 class="category-name">{{ category.name }}</h3>
          <div class="category-actions" v-if="hasPermission('manage_categories')">
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
              :disabled="getProductsInCategory(category.name).length > 0"
              :title="getProductsInCategory(category.name).length > 0 ? 'Impossible de supprimer : catégorie utilisée' : 'Supprimer la catégorie'"
            >
              🗑️
            </button>
          </div>
        </div>

        <p class="category-description" v-if="category.description">
          {{ category.description }}
        </p>
        <p class="no-description" v-else>
          Aucune description
        </p>

        <div class="category-stats">
          <div class="stat-item">
            <span class="stat-label">Produits:</span>
            <span class="stat-value">{{ getProductsInCategory(category.name).length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Stock total:</span>
            <span class="stat-value">{{ getTotalStockInCategory(category.name) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Ventes:</span>
            <span class="stat-value">{{ getSalesInCategory(category.name) }}</span>
          </div>
        </div>

        <!-- Produits de cette catégorie -->
        <div class="products-preview" v-if="getProductsInCategory(category.name).length > 0">
          <h4>Produits dans cette catégorie:</h4>
          <div class="products-list">
            <span 
              v-for="product in getProductsInCategory(category.name).slice(0, 3)" 
              :key="product.id"
              class="product-tag"
              :class="{ 'low-stock': product.quantity < 5 }"
            >
              {{ product.name }} ({{ product.quantity }})
            </span>
            <span 
              v-if="getProductsInCategory(category.name).length > 3" 
              class="more-products"
            >
              +{{ getProductsInCategory(category.name).length - 3 }} autres...
            </span>
          </div>
        </div>
        <div v-else class="no-products">
          <p>⛔ Aucun produit dans cette catégorie</p>
        </div>
      </div>

      <!-- État vide -->
      <div v-if="filteredCategories.length === 0" class="empty-state">
        <div v-if="searchQuery">
          <p>Aucune catégorie trouvée pour "{{ searchQuery }}"</p>
          <button @click="searchQuery = ''" class="btn-primary">
            Afficher toutes les catégories
          </button>
        </div>
        <div v-else>
          <p>Aucune catégorie créée</p>
          <button 
            @click="showAddCategory = true" 
            class="btn-primary"
            v-if="hasPermission('manage_categories')"
          >
            Créer la première catégorie
          </button>
        </div>
      </div>
    </div>

    <!-- Message de confirmation -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';
import type { Category, Product } from '../types';

const appStore = useAppStore();
const authStore = useAuthStore();

// États
const showAddCategory = ref(false);
const editingCategory = ref<Category | null>(null);
const searchQuery = ref('');
const sortBy = ref<'name' | 'products'>('name');
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const nameError = ref('');

// Formulaire
const categoryForm = reactive({
  name: '',
  description: ''
});

// Computed
const categories = computed(() => appStore.categories);
const products = computed(() => appStore.products);

const filteredCategories = computed(() => {
  let filtered = categories.value;
  
  if (searchQuery.value) {
    filtered = filtered.filter(category =>
      category.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  
  return filtered;
});

const sortedCategories = computed(() => {
  const filtered = [...filteredCategories.value];
  
  switch (sortBy.value) {
    case 'name':
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    case 'products':
      return filtered.sort((a, b) => 
        getProductsInCategory(b.name).length - getProductsInCategory(a.name).length
      );
    default:
      return filtered;
  }
});

const totalProducts = computed(() => products.value.length);
const categoriesWithSales = computed(() => {
  return categories.value.filter(category => 
    getSalesInCategory(category.name) > 0
  ).length;
});

const hasPermission = (permission: string) => {
  return authStore.hasPermission(permission);
};

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
  nameError.value = '';
};

const resetForm = () => {
  categoryForm.name = '';
  categoryForm.description = '';
};

const validateForm = (): boolean => {
  nameError.value = '';
  
  if (!categoryForm.name.trim()) {
    nameError.value = 'Le nom de la catégorie est requis';
    return false;
  }
  
  // Vérifier si le nom existe déjà (sauf en mode édition)
  if (!editingCategory.value) {
    const exists = categories.value.some(
      cat => cat.name.toLowerCase() === categoryForm.name.toLowerCase().trim()
    );
    if (exists) {
      nameError.value = 'Une catégorie avec ce nom existe déjà';
      return false;
    }
  }
  
  return true;
};

const handleCategorySubmit = async () => {
  if (!validateForm()) return;

  try {
    if (editingCategory.value) {
      // Modification - on ne peut pas modifier le nom pour l'instant
      // (cela nécessiterait de mettre à jour tous les produits)
      await appStore.addCategory({
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim()
      });
    } else {
      // Ajout
      await appStore.addCategory({
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim()
      });
    }
    
    showMessage(
      editingCategory.value ? 'Catégorie modifiée avec succès' : 'Catégorie ajoutée avec succès',
      'success'
    );
    closeForm();
  } catch (error) {
    showMessage('Erreur lors de la sauvegarde', 'error');
  }
};

const editCategory = (category: Category) => {
  editingCategory.value = category;
  categoryForm.name = category.name;
  categoryForm.description = category.description || '';
  showAddCategory.value = true;
};

const deleteCategory = (id: string) => {
  const category = categories.value.find(c => c.id === id);
  if (!category) return;

  const productsInCategory = getProductsInCategory(category.name);
  
  if (productsInCategory.length > 0) {
    showMessage(
      `Impossible de supprimer : ${productsInCategory.length} produit(s) utilisent cette catégorie`,
      'error'
    );
    return;
  }

  if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
    // Pour l'instant, on ne peut pas supprimer car le store n'a pas cette méthode
    // On va simplement afficher un message
    showMessage('La suppression des catégories n\'est pas encore implémentée', 'error');
  }
};

const getProductsInCategory = (categoryName: string): Product[] => {
  return products.value.filter(product => product.category === categoryName);
};

const getTotalStockInCategory = (categoryName: string): number => {
  return getProductsInCategory(categoryName).reduce((total, product) => total + product.quantity, 0);
};

const getSalesInCategory = (categoryName: string): number => {
  return appStore.sales.reduce((total, sale) => {
    const categoryItems = sale.items.filter(item => {
      const product = products.value.find(p => p.id === item.productId);
      return product?.category === categoryName;
    });
    return total + categoryItems.length;
  }, 0);
};

const showMessage = (msg: string, type: 'success' | 'error') => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 5000);
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
  flex-wrap: wrap;
  gap: 15px;
}

/* Statistiques */
.categories-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
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

/* Contrôles */
.categories-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 15px;
  flex-wrap: wrap;
}

.search-input {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 14px;
  min-width: 300px;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.sort-btn {
  background: #ecf0f1;
  border: 2px solid transparent;
  padding: 8px 15px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s ease;
}

.sort-btn.active {
  background: #3498db;
  color: white;
  border-color: #2980b9;
}

.sort-btn:hover:not(.active) {
  background: #d5dbdb;
}

/* Liste des catégories */
.categories-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.category-card {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.category-name {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3em;
  flex: 1;
}

.category-actions {
  display: flex;
  gap: 5px;
}

.btn-edit, .btn-delete {
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s;
}

.btn-edit {
  background: #f39c12;
  color: white;
}

.btn-edit:hover {
  background: #e67e22;
}

.btn-delete {
  background: #e74c3c;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background: #c0392b;
}

.btn-delete:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.6;
}

.category-description {
  color: #7f8c8d;
  margin-bottom: 15px;
  line-height: 1.4;
}

.no-description {
  color: #bdc3c7;
  font-style: italic;
  margin-bottom: 15px;
}

/* Statistiques de catégorie */
.category-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.8em;
  color: #7f8c8d;
  margin-bottom: 2px;
}

.stat-value {
  font-weight: bold;
  color: #2c3e50;
  font-size: 1.1em;
}

/* Produits */
.products-preview {
  border-top: 1px solid #ecf0f1;
  padding-top: 15px;
}

.products-preview h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 0.9em;
}

.products-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.product-tag {
  background: #3498db;
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8em;
}

.product-tag.low-stock {
  background: #e74c3c;
}

.more-products {
  color: #7f8c8d;
  font-size: 0.8em;
  font-style: italic;
}

.no-products {
  text-align: center;
  padding: 20px;
  color: #bdc3c7;
}

/* Formulaire */
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
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  transition: border-color 0.3s;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #3498db;
}

input.error {
  border-color: #e74c3c;
}

.error-message {
  color: #e74c3c;
  font-size: 0.8em;
  margin-top: 5px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

/* État vide */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-state p {
  margin-bottom: 20px;
  font-size: 1.1em;
}

/* Message */
.message {
  padding: 12px 15px;
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

/* Boutons */
.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #2980b9;
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
    align-items: stretch;
    text-align: center;
  }
  
  .categories-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    min-width: auto;
  }
  
  .categories-list {
    grid-template-columns: 1fr;
  }
  
  .category-stats {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>