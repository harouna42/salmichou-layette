<template>
  <div class="produits-container">
    <div class="header">
      <h1>Gestion des Produits</h1>
      <button @click="showAddProduct" class="btn-primary">
        + Ajouter un produit
      </button>
    </div>

    <!-- Formulaire d'ajout de produit -->
    <div v-if="showForm" class="form-overlay">
      <div class="form-container">
        <h3>{{ isEditing ? 'Modifier' : 'Ajouter' }} un produit</h3>
        
        <form @submit.prevent="handleProductSubmit" class="product-form">
          <div class="form-group">
            <label>Nom:</label>
            <input v-model="form.name" type="text" required>
          </div>
          
          <div class="form-group">
            <label>Description:</label>
            <textarea v-model="form.description" required></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Prix de vente (FCFA):</label>
              <input v-model.number="form.price" type="number" step="0.01" min="0" required>
            </div>
            
            <div class="form-group">
              <label>Prix de revient (FCFA):</label>
              <input v-model.number="form.costPrice" type="number" step="0.01" min="0" required>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Quantité:</label>
              <input v-model.number="form.quantity" type="number" min="0" required>
            </div>
            
            <div class="form-group">
              <label>Catégorie:</label>
              <select v-model="form.category" required>
                <option value="">Sélectionner une catégorie</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.name">
                  {{ cat.name }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Taille:</label>
              <input v-model="form.size" type="text" placeholder="ex: 0-3 mois">
            </div>
            
            <div class="form-group">
              <label>Couleur:</label>
              <input v-model="form.color" type="text" placeholder="ex: Blanc">
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-success">
              {{ isEditing ? 'Modifier' : 'Ajouter' }}
            </button>
            <button type="button" @click="closeForm" class="btn-cancel">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Contrôles de vue et recherche -->
    <div class="products-controls">
      <div class="view-controls">
        <span class="control-label">Affichage:</span>
        <button 
          @click="viewMode = 'grid'"
          :class="['view-btn', { 'active': viewMode === 'grid' }]"
          title="Vue grille"
        >
          ⬜️ Grille
        </button>
        <button 
          @click="viewMode = 'list'"
          :class="['view-btn', { 'active': viewMode === 'list' }]"
          title="Vue liste"
        >
          📄 Liste
        </button>
      </div>

      <div class="search-controls">
        <input 
          v-model="searchQuery" 
          placeholder="🔍 Rechercher un produit..."
          class="search-input"
        >
        <select v-model="selectedCategory" class="category-filter">
          <option value="">Toutes les catégories</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.name">
            {{ cat.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Vue Grille -->
    <div v-if="viewMode === 'grid'" class="products-grid">
      <div 
        v-for="product in filteredProducts" 
        :key="product.id" 
        class="product-card"
        :class="{ 'low-stock': product.quantity < 10 }"
      >
        <div class="product-info">
          <h3>{{ product.name }}</h3>
          <p class="description">{{ product.description }}</p>
          <div class="details">
            <span class="price">{{ formatPrice(product.price) }}</span>
            <span class="category">{{ product.category }}</span>
            <span class="quantity" :class="{ 'low': product.quantity < 10 }">
              Stock: {{ product.quantity }}
            </span>
          </div>
          <div v-if="product.size || product.color" class="attributes">
            <span v-if="product.size">Taille: {{ product.size }}</span>
            <span v-if="product.color">Couleur: {{ product.color }}</span>
          </div>
          <div class="profit">
            Marge: {{ (product.price - product.costPrice).toFixed(2) }}
          </div>
        </div>
        
        <div class="product-actions">
          <button @click="editProduct(product)" class="btn-edit">
            ✏️ Modifier
          </button>
          <button @click="deleteProduct(product.id)" class="btn-delete">
            🗑️ Supprimer
          </button>
        </div>
      </div>
    </div>

    <!-- Vue Liste -->
    <div v-else class="products-list">
      <table class="products-table">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Catégorie</th>
            <th>Prix Vente</th>
            <th>Prix Revient</th>
            <th>Marge</th>
            <th>Stock</th>
            <th>Taille</th>
            <th>Couleur</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="product in filteredProducts" 
            :key="product.id"
            :class="{ 'low-stock-row': product.quantity < 10 }"
          >
            <td class="product-info-cell">
              <div class="product-main">
                <div class="product-name">{{ product.name }}</div>
                <div class="product-description">{{ product.description }}</div>
              </div>
            </td>
            <td class="category-cell">
              <span class="category-tag">{{ product.category }}</span>
            </td>
            <td class="price-cell">
              <strong class="sale-price">{{ formatPrice(product.price) }}</strong>
            </td>
            <td class="cost-cell">
              <span class="cost-price">{{ formatPrice(product.costPrice) }}</span>
            </td>
            <td class="margin-cell">
              <span :class="['margin-badge', { 'high-margin': (product.price - product.costPrice) > 10 }]">
                {{ (product.price - product.costPrice).toFixed(2) }}
              </span>
            </td>
            <td class="stock-cell">
              <span :class="['stock-indicator', { 
                'low-stock': product.quantity < 10, 
                'critical-stock': product.quantity < 3 
              }]">
                {{ product.quantity }}
                <span v-if="product.quantity < 3" class="warning-icon">⚠️</span>
              </span>
            </td>
            <td class="size-cell">
              {{ product.size || '-' }}
            </td>
            <td class="color-cell">
              <span v-if="product.color" class="color-tag">
                {{ product.color }}
              </span>
              <span v-else>-</span>
            </td>
            <td class="actions-cell">
              <div class="action-buttons">
                <button 
                  @click="editProduct(product)"
                  class="btn-edit-list"
                  title="Modifier le produit"
                >
                  ✏️
                </button>
                <button 
                  @click="deleteProduct(product.id)"
                  class="btn-delete-list"
                  title="Supprimer le produit"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="filteredProducts.length === 0" class="empty-state">
        <p>Aucun produit trouvé</p>
        <button @click="showAddProduct" class="btn-primary">
          Ajouter le premier produit
        </button>
      </div>
    </div>

    <div v-if="products.length === 0 && !showForm" class="empty-state">
      <p>Aucun produit enregistré.</p>
      <button @click="showAddProduct" class="btn-primary">
        Ajouter le premier produit
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useAppStore } from '../stores/app';
import type { Product } from '../types';
import { formatPrice } from '../utils/format';

const appStore = useAppStore();

// États pour la gestion du formulaire
const showForm = ref(false);
const isEditing = ref(false);
const editingProduct = ref<Product | null>(null);
const viewMode = ref<'grid' | 'list'>('list'); // Nouvel état pour le mode d'affichage
const searchQuery = ref('');
const selectedCategory = ref('');

// Formulaire réactif
const form = reactive({
  name: '',
  description: '',
  price: 0,
  costPrice: 0,
  quantity: 0,
  category: '',
  size: '',
  color: ''
});

// Computed properties
const products = computed(() => appStore.products);
const categories = computed(() => appStore.categories);

const filteredProducts = computed(() => {
  let filtered = products.value;
  
  if (searchQuery.value) {
    filtered = filtered.filter(product =>
      product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      product.color?.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  
  if (selectedCategory.value) {
    filtered = filtered.filter(product => 
      product.category === selectedCategory.value
    );
  }
  
  return filtered;
});

// Méthodes
const showAddProduct = () => {
  resetForm();
  isEditing.value = false;
  editingProduct.value = null;
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  resetForm();
  editingProduct.value = null;
};

const resetForm = () => {
  Object.assign(form, {
    name: '',
    description: '',
    price: 0,
    costPrice: 0,
    quantity: 0,
    category: '',
    size: '',
    color: ''
  });
};

const handleProductSubmit = () => {
  if (isEditing.value && editingProduct.value) {
    // Modification
    appStore.updateProduct(editingProduct.value.id, { ...form });
  } else {
    // Ajout
    appStore.addProduct({
      ...form
   });
  }
  
  closeForm();
};

const editProduct = (product: Product) => {
  isEditing.value = true;
  editingProduct.value = product;
  
  // Remplir le formulaire avec les données du produit
  Object.assign(form, {
    name: product.name,
    description: product.description,
    price: product.price,
    costPrice: product.costPrice,
    quantity: product.quantity,
    category: product.category,
    size: product.size || '',
    color: product.color || ''
  });
  
  showForm.value = true;
};

const deleteProduct = (id: string) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
    appStore.deleteProduct(id);
  }
};

// Initialisation
onMounted(() => {
  appStore.initializeData();
});
</script>

<style scoped>
.produits-container {
  padding: 20px;
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* Contrôles de vue et recherche */
.products-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
  flex-wrap: wrap;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9em;
}

.view-btn {
  background: #ecf0f1;
  border: 2px solid transparent;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.view-btn.active {
  background: #3498db;
  color: white;
  border-color: #2980b9;
}

.view-btn:hover:not(.active) {
  background: #d5dbdb;
  border-color: #bdc3c7;
}

.search-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  min-width: 250px;
}

.category-filter {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  min-width: 180px;
}

/* Overlay pour le formulaire */
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.product-form {
  background: white;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #2c3e50;
}

input, select, textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
  font-size: 14px;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #eee;
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

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

/* Grille des produits (vue grille) */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.product-card {
  background: white;
  border: 1px solid #e1e8ed;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.product-card.low-stock {
  border-left: 4px solid #e74c3c;
}

.product-info h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1.2em;
}

.description {
  color: #7f8c8d;
  font-size: 0.9em;
  margin-bottom: 15px;
  line-height: 1.4;
}

.details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.price {
  font-weight: bold;
  color: #27ae60;
  font-size: 1.1em;
}

.category {
  background: #3498db;
  color: white;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.8em;
  text-transform: capitalize;
}

.quantity {
  font-size: 0.9em;
  color: #7f8c8d;
}

.quantity.low {
  color: #e74c3c;
  font-weight: bold;
}

.attributes {
  display: flex;
  gap: 15px;
  font-size: 0.8em;
  color: #7f8c8d;
  margin-bottom: 10px;
}

.profit {
  font-size: 0.9em;
  color: #8e44ad;
  font-weight: 500;
}

.product-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn-edit, .btn-delete {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 5px;
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

.btn-delete:hover {
  background: #c0392b;
}

/* Vue Liste */
.products-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.products-table th {
  background: #34495e;
  color: white;
  padding: 15px 12px;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
}

.products-table td {
  padding: 12px;
  border-bottom: 1px solid #ecf0f1;
  vertical-align: middle;
}

.products-table tr:hover {
  background: #f8f9fa;
}

.products-table tr.low-stock-row {
  background: #fff3cd;
}

.products-table tr.low-stock-row:hover {
  background: #ffeaa7;
}

.product-info-cell {
  min-width: 200px;
}

.product-main {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.product-description {
  color: #7f8c8d;
  font-size: 0.8em;
  line-height: 1.3;
}

.category-cell {
  white-space: nowrap;
}

.category-tag {
  background: #3498db;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  text-transform: capitalize;
}

.price-cell, .cost-cell {
  text-align: center;
  white-space: nowrap;
}

.sale-price {
  color: #27ae60;
  font-weight: 600;
}

.cost-price {
  color: #7f8c8d;
  font-size: 0.9em;
}

.margin-cell {
  text-align: center;
}

.margin-badge {
  background: #9b59b6;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 500;
}

.margin-badge.high-margin {
  background: #27ae60;
}

.stock-cell {
  text-align: center;
  white-space: nowrap;
}

.stock-indicator {
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
  color: white;
  background: #27ae60;
}

.stock-indicator.low-stock {
  background: #f39c12;
}

.stock-indicator.critical-stock {
  background: #e74c3c;
}

.warning-icon {
  margin-left: 4px;
}

.size-cell, .color-cell {
  text-align: center;
  white-space: nowrap;
}

.color-tag {
  background: #e74c3c;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
}

.actions-cell {
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.btn-edit-list, .btn-delete-list {
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s;
}

.btn-edit-list {
  background: #f39c12;
  color: white;
}

.btn-edit-list:hover {
  background: #e67e22;
}

.btn-delete-list {
  background: #e74c3c;
  color: white;
}

.btn-delete-list:hover {
  background: #c0392b;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-state p {
  margin-bottom: 20px;
  font-size: 1.1em;
}

@media (max-width: 1200px) {
  .products-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .view-controls, .search-controls {
    justify-content: center;
  }
  
  .search-input {
    min-width: 200px;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
    text-align: center;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .products-table {
    font-size: 0.8em;
  }
  
  .products-table th,
  .products-table td {
    padding: 8px 6px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 2px;
  }
  
  .btn-edit-list, .btn-delete-list {
    padding: 4px 8px;
    font-size: 0.8em;
  }
}
</style>