<template>
  <div class="ventes-container">
    <h1>🛒 Gestion des Ventes</h1>
    
    <div class="vente-content">
      <!-- Section produits -->
      <div class="products-section">
        <div class="products-header">
          <h3>📦 Produits Disponibles</h3>
          
          <div class="view-controls">
            <button 
              @click="viewMode = 'grid'"
              :class="['view-btn', { 'active': viewMode === 'grid' }]"
              title="Vue grille"
            >
              ⬜️
            </button>
            <button 
              @click="viewMode = 'list'"
              :class="['view-btn', { 'active': viewMode === 'list' }]"
              title="Vue liste"
            >
              📄
            </button>
          </div>
        </div>
        
        <div class="search-filter">
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

        <!-- Vue Grille -->
        <div v-if="viewMode === 'grid'" class="products-grid">
          <div 
            v-for="product in filteredProducts" 
            :key="product.id" 
            class="product-item"
            :class="{ 'out-of-stock': product.quantity === 0 }"
            @click="addToCart(product)"
          >
            <div class="product-image">
              <span v-if="!product.image">👶</span>
              <img v-else :src="product.image" :alt="product.name">
            </div>
            <div class="product-info">
              <h4>{{ product.name }}</h4>
              <p class="product-description">{{ product.description }}</p>
              <div class="product-details">
                <span class="price">{{ formatPrice(product.price) }}</span>
                <span class="stock" :class="{ 'low': product.quantity < 5 }">
                  Stock: {{ product.quantity }}
                </span>
              </div>
              <div class="product-meta">
                <span class="category">{{ product.category }}</span>
                <span v-if="product.size" class="size">{{ product.size }}</span>
              </div>
            </div>
            <div class="add-to-cart">
              <button class="add-btn" :disabled="product.quantity === 0">
                {{ product.quantity === 0 ? 'Rupture' : '+' }}
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
                <th>Taille</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="product in filteredProducts" 
                :key="product.id"
                :class="{ 'out-of-stock': product.quantity === 0 }"
              >
                <td class="product-cell">
                  <div class="product-main-info">
                    <div class="product-name">{{ product.name }}</div>
                    <div class="product-desc">{{ product.description }}</div>
                  </div>
                </td>
                <td class="category-cell">
                  <span class="category-tag">{{ product.category }}</span>
                </td>
                <td class="size-cell">
                  {{ product.size || '-' }}
                </td>
                <td class="price-cell">
                  <strong>{{ formatPrice(product.price) }}</strong>
                </td>
                <td class="stock-cell">
                  <span :class="['stock-badge', { 'low': product.quantity < 5, 'out': product.quantity === 0 }]">
                    {{ product.quantity === 0 ? 'Rupture' : product.quantity }}
                  </span>
                </td>
                <td class="action-cell">
                  <button 
                    @click="addToCart(product)"
                    class="add-btn-list"
                    :disabled="product.quantity === 0"
                    :title="product.quantity === 0 ? 'Produit en rupture' : 'Ajouter au panier'"
                  >
                    {{ product.quantity === 0 ? '❌' : '➕' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div v-if="filteredProducts.length === 0" class="empty-products">
            <p>Aucun produit trouvé</p>
          </div>
        </div>
      </div>

      <!-- Section panier avec prix modifiables -->
      <div class="cart-section">
        <h3>🛒 Panier en Cours</h3>
        
        <div v-if="cart.length === 0" class="empty-cart">
          <p>Votre panier est vide</p>
          <p class="hint">Cliquez sur les produits pour les ajouter au panier</p>
        </div>

        <div v-else class="cart-items">
          <div 
            v-for="(item, index) in cart" 
            :key="index"
            class="cart-item"
          >
            <div class="item-info">
              <h4>{{ item.productName }}</h4>
              <div class="price-controls">
                <div class="price-input-group">
                  <label>Prix unitaire:</label>
                  <input 
                    v-model.number="item.salePrice"
                    type="number"
                    min="0"
                    step="100"
                    @change="updateItemPrice(index)"
                    class="price-input"
                    :class="{ 'price-modified': item.salePrice !== item.originalPrice }"
                  >
                  <span class="currency">FCFA</span>
                </div>
                <div v-if="item.salePrice !== item.originalPrice" class="price-comparison">
                  <span class="original-price">{{ formatPrice(item.originalPrice) }}</span>
                  <span class="price-difference" :class="getPriceDifferenceClass(item)">
                    {{ getPriceDifference(item) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="item-controls">
              <button 
                @click.stop="decreaseQuantity(index)"
                class="quantity-btn"
                :disabled="item.quantity <= 1"
              >
                -
              </button>
              <span class="quantity-display">{{ item.quantity }}</span>
              <button 
                @click.stop="increaseQuantity(index)"
                class="quantity-btn"
                :disabled="item.quantity >= getMaxQuantity(item.productId)"
              >
                +
              </button>
              <button 
                @click.stop="removeFromCart(index)"
                class="remove-btn"
              >
                🗑️
              </button>
            </div>
            
            <div class="item-total">
              <div class="total-amount">{{ formatPrice(item.salePrice * item.quantity) }}</div>
              <div class="unit-price">{{ formatPrice(item.salePrice) }} × {{ item.quantity }}</div>
            </div>
          </div>

          <!-- Résumé du panier -->
          <div class="cart-summary">
            <div class="summary-row">
              <span>Sous-total:</span>
              <span>{{ formatPrice(subtotal) }}</span>
            </div>
            
            <!-- Afficher la remise totale si applicable -->
            <div v-if="totalDiscount > 0" class="summary-row discount">
              <span>Remise totale:</span>
              <span class="discount-amount">-{{ formatPrice(totalDiscount) }}</span>
            </div>
            
            <div class="summary-row total">
              <strong>Total:</strong>
              <strong>{{ formatPrice(totalAmount) }}</strong>
            </div>
          </div>

          <!-- Actions de vente -->
          <div class="sale-actions">
            <div class="form-group">
              <label>Méthode de paiement:</label>
              <select v-model="paymentMethod" class="payment-select">
                <option value="cash">💵 Espèces</option>
                <option value="card">💳 Carte</option>
                <option value="mobile">📱 Mobile Money</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Nom du client (optionnel):</label>
              <input 
                v-model="customerName" 
                type="text" 
                placeholder="Nom du client"
                class="customer-input"
              >
            </div>
            
            <button 
              @click="processSale" 
              class="checkout-btn"
              :disabled="cart.length === 0"
            >
              💰 Finaliser la vente ({{ formatPrice(totalAmount) }})
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '../stores/app';
import { useAuthStore } from '../stores/auth';
import { formatPrice } from '../utils/format';
import type { Product } from '../types';

// Définir l'interface pour les items du panier avec prix modifiable
interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  originalPrice: number; // Prix original du produit
  salePrice: number;     // Prix de vente (modifiable)
  total: number;
}

const appStore = useAppStore();
const authStore = useAuthStore();

// États réactifs
const searchQuery = ref('');
const selectedCategory = ref('');
const paymentMethod = ref<'cash' | 'card' | 'mobile'>('cash');
const customerName = ref('');
const cart = ref<CartItem[]>([]);
const viewMode = ref<'grid' | 'list'>('grid');

// Computed properties
const availableProducts = computed(() => 
  appStore.products.filter(p => p.quantity > 0)
);

const filteredProducts = computed(() => {
  let filtered = availableProducts.value;
  
  if (searchQuery.value) {
    filtered = filtered.filter(product =>
      product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  
  if (selectedCategory.value) {
    filtered = filtered.filter(product => 
      product.category === selectedCategory.value
    );
  }
  
  return filtered;
});

const categories = computed(() => appStore.categories);

const subtotal = computed(() =>
  cart.value.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0)
);

const totalAmount = computed(() => subtotal.value);

const totalDiscount = computed(() =>
  cart.value.reduce((sum, item) => {
    if (item.salePrice < item.originalPrice) {
      return sum + ((item.originalPrice - item.salePrice) * item.quantity);
    }
    return sum;
  }, 0)
);

// Méthodes
const addToCart = (product: Product) => {
  if (product.quantity === 0) return;

  const existingItem = cart.value.find(item => item.productId === product.id);
  
  if (existingItem) {
    if (existingItem.quantity < product.quantity) {
      existingItem.quantity++;
      updateItemTotal(existingItem);
    }
  } else {
    cart.value.push({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      originalPrice: product.price, // Prix original
      salePrice: product.price,     // Prix de vente (modifiable)
      total: product.price
    });
  }
};

const increaseQuantity = (index: number) => {
  const item = cart.value[index];
  const product = appStore.products.find(p => p.id === item.productId);
  
  if (product && item.quantity < product.quantity) {
    item.quantity++;
    updateItemTotal(item);
  }
};

const decreaseQuantity = (index: number) => {
  const item = cart.value[index];
  if (item.quantity > 1) {
    item.quantity--;
    updateItemTotal(item);
  }
};

const removeFromCart = (index: number) => {
  cart.value.splice(index, 1);
};

const updateItemPrice = (index: number) => {
  const item = cart.value[index];
  
  // Validation du prix
  if (item.salePrice < 0) {
    item.salePrice = 0;
  }
  
  // Si le prix est vide, remettre le prix original
  if (!item.salePrice && item.salePrice !== 0) {
    item.salePrice = item.originalPrice;
  }
  
  updateItemTotal(item);
};

const updateItemTotal = (item: CartItem) => {
  item.total = item.salePrice * item.quantity;
};

const getMaxQuantity = (productId: string) => {
  const product = appStore.products.find(p => p.id === productId);
  return product ? product.quantity : 0;
};

const getPriceDifference = (item: CartItem) => {
  const difference = item.salePrice - item.originalPrice;
  const percentage = ((difference / item.originalPrice) * 100).toFixed(1);
  
  if (difference > 0) {
    return `+${formatPrice(difference)} (+${percentage}%)`;
  } else if (difference < 0) {
    return `${formatPrice(difference)} (${percentage}%)`;
  }
  return '';
};

const getPriceDifferenceClass = (item: CartItem) => {
  const difference = item.salePrice - item.originalPrice;
  if (difference > 0) return 'price-increase';
  if (difference < 0) return 'price-decrease';
  return '';
};

const processSale = () => {
  if (cart.value.length === 0) return;

  // Vérifier les stocks
  for (const item of cart.value) {
    const product = appStore.products.find(p => p.id === item.productId);
    if (!product || product.quantity < item.quantity) {
      alert(`❌ Stock insuffisant pour ${item.productName}`);
      return;
    }
  }

  // Vérifier les prix négatifs
  for (const item of cart.value) {
    if (item.salePrice < 0) {
      alert(`❌ Prix invalide pour ${item.productName}`);
      return;
    }
  }

  // Enregistrer la vente
  appStore.addSale({
    items: cart.value.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.salePrice, // Utiliser le prix modifié
      total: item.total
    })),
    totalAmount: totalAmount.value,
    paymentMethod: paymentMethod.value,
    customerName: customerName.value,
    createdAt: new Date(),
    employeeId: authStore.currentUser!.id
  });

  // Réinitialiser
  cart.value = [];
  customerName.value = '';
  paymentMethod.value = 'cash';
  
  alert('✅ Vente enregistrée avec succès!');
};

// Initialisation
onMounted(() => {
  appStore.initializeData();
});
</script>

<style scoped>
.ventes-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.ventes-container h1 {
  color: #2c3e50;
  margin-bottom: 30px;
  text-align: center;
}

.vente-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  height: calc(100vh - 150px);
}

.products-section, .cart-section {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow-y: auto;
}

/* En-tête des produits avec contrôles de vue */
.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.products-header h3 {
  margin: 0;
  color: #2c3e50;
}

.view-controls {
  display: flex;
  gap: 5px;
  background: #ecf0f1;
  padding: 4px;
  border-radius: 6px;
}

.view-btn {
  background: none;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1em;
  transition: all 0.3s ease;
}

.view-btn.active {
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.view-btn:hover:not(.active) {
  background: rgba(255,255,255,0.5);
}

/* Recherche et filtres */
.search-filter {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.search-input, .category-filter {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

/* Styles pour la vue grille */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.product-item {
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.product-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border-color: #3498db;
}

.product-item.out-of-stock {
  opacity: 0.6;
  cursor: not-allowed;
}

.product-image {
  text-align: center;
  font-size: 2em;
  margin-bottom: 10px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-info h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 1em;
}

.product-description {
  color: #7f8c8d;
  font-size: 0.8em;
  margin-bottom: 10px;
  line-height: 1.3;
}

.product-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.price {
  font-weight: bold;
  color: #27ae60;
  font-size: 1.1em;
}

.stock {
  font-size: 0.8em;
  color: #7f8c8d;
}

.stock.low {
  color: #e74c3c;
  font-weight: bold;
}

.product-meta {
  display: flex;
  gap: 8px;
  font-size: 0.7em;
}

.category, .size {
  background: #ecf0f1;
  padding: 2px 6px;
  border-radius: 10px;
  color: #7f8c8d;
}

.add-to-cart {
  margin-top: auto;
  text-align: center;
}

.add-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
}

.add-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* Styles pour la vue liste */
.products-list {
  overflow-x: auto;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.products-table th {
  background: #34495e;
  color: white;
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
}

.products-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #ecf0f1;
  vertical-align: middle;
}

.products-table tr:hover {
  background: #f8f9fa;
}

.products-table tr.out-of-stock {
  opacity: 0.6;
}

.product-cell {
  min-width: 200px;
}

.product-main-info {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.product-desc {
  color: #7f8c8d;
  font-size: 0.8em;
  line-height: 1.3;
}

.category-cell, .size-cell {
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

.price-cell {
  font-weight: 600;
  color: #27ae60;
  text-align: center;
}

.stock-cell {
  text-align: center;
}

.stock-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 500;
  color: white;
  min-width: 40px;
  display: inline-block;
  text-align: center;
}

.stock-badge:not(.out):not(.low) {
  background: #27ae60;
}

.stock-badge.low {
  background: #f39c12;
}

.stock-badge.out {
  background: #e74c3c;
}

.action-cell {
  text-align: center;
}

.add-btn-list {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: background 0.3s;
}

.add-btn-list:hover:not(:disabled) {
  background: #2980b9;
}

.add-btn-list:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.empty-products {
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
}

/* Styles pour le panier */
.empty-cart {
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
}

.hint {
  font-size: 0.9em;
  margin-top: 10px;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  background: #f8f9fa;
}

.item-info h4 {
  margin: 0 0 8px 0;
  font-size: 0.9em;
}

/* Nouveaux styles pour la gestion des prix */
.price-controls {
  margin-top: 8px;
}

.price-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.price-input-group label {
  font-size: 0.8em;
  color: #7f8c8d;
  margin: 0;
  white-space: nowrap;
}

.price-input {
  width: 100px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9em;
  text-align: right;
}

.price-input.price-modified {
  border-color: #3498db;
  background-color: #e3f2fd;
  font-weight: bold;
}

.currency {
  font-size: 0.8em;
  color: #7f8c8d;
  white-space: nowrap;
}

.price-comparison {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75em;
}

.original-price {
  text-decoration: line-through;
  color: #7f8c8d;
}

.price-difference {
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7em;
}

.price-increase {
  background: #e8f5e8;
  color: #2e7d32;
}

.price-decrease {
  background: #ffebee;
  color: #c62828;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-btn {
  background: #3498db;
  color: white;
  border: none;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.quantity-display {
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

.remove-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 5px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.8em;
}

.item-total {
  text-align: right;
}

.total-amount {
  font-weight: bold;
  color: #2c3e50;
  font-size: 1em;
}

.unit-price {
  font-size: 0.8em;
  color: #7f8c8d;
  margin-top: 2px;
}

.cart-summary {
  margin-top: 20px;
  padding: 15px;
  background: #ecf0f1;
  border-radius: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.summary-row.total {
  border-top: 1px solid #bdc3c7;
  padding-top: 8px;
  font-size: 1.1em;
}

.cart-summary .discount {
  color: #e74c3c;
}

.discount-amount {
  color: #e74c3c;
  font-weight: bold;
}

.sale-actions {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #2c3e50;
}

.payment-select, .customer-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.checkout-btn {
  width: 100%;
  background: #27ae60;
  color: white;
  border: none;
  padding: 15px;
  border-radius: 8px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.3s;
}

.checkout-btn:hover:not(:disabled) {
  background: #219a52;
}

.checkout-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 1024px) {
  .vente-content {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .products-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .view-controls {
    align-self: center;
  }
  
  .search-filter {
    grid-template-columns: 1fr;
  }
  
  .products-table {
    font-size: 0.8em;
  }
  
  .products-table th,
  .products-table td {
    padding: 8px 10px;
  }
  
  .price-input-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .price-input {
    width: 100%;
  }
  
  .cart-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .item-controls {
    align-self: center;
  }
  
  .item-total {
    align-self: flex-end;
  }
}
</style>