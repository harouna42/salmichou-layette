<template>
  <div class="historique-ventes">
    <div class="header">
      <h1>📋 Historique des Ventes</h1>
      
      <div class="filters">
        <div class="filter-group">
          <label>Période:</label>
          <select v-model="selectedPeriod" @change="filterSales">
            <option value="all">Toutes</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Paiement:</label>
          <select v-model="selectedPayment" @change="filterSales">
            <option value="all">Tous</option>
            <option value="cash">Espèces</option>
            <option value="card">Carte</option>
            <option value="mobile">Mobile</option>
          </select>
        </div>
        
        <div class="filter-group">
          <input 
            v-model="searchQuery" 
            placeholder="Rechercher un client..."
            @input="filterSales"
            class="search-input"
          >
        </div>
      </div>
    </div>

    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <h3>Total Ventes</h3>
          <p class="stat-value">{{ filteredSales.length }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-info">
          <h3>Chiffre d'Affaires</h3>
          <p class="stat-value">{{ totalRevenue.toFixed(2) }} FCFA</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <h3>Articles Vendus</h3>
          <p class="stat-value">{{ totalItems }}</p>
        </div>
      </div>
    </div>

    <div class="sales-table-container">
      <table class="sales-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>ID Vente</th>
            <th>Client</th>
            <th>Articles</th>
            <th>Total</th>
            <th>Paiement</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sale in paginatedSales" :key="sale.id">
            <td class="date-cell">
              <div class="date">{{ formatDate(sale.createdAt) }}</div>
              <div class="time">{{ formatTime(sale.createdAt) }}</div>
            </td>
            <td class="sale-id">#{{ sale.id.slice(-6) }}</td>
            <td class="customer">{{ sale.customerName || 'Non renseigné' }}</td>
            <td class="items">
              <div class="items-list">
                <span 
                  v-for="item in sale.items.slice(0, 2)" 
                  :key="item.productId"
                  class="item-tag"
                >
                  {{ item.productName }} (×{{ item.quantity }})
                </span>
                <span v-if="sale.items.length > 2" class="more-items">
                  +{{ sale.items.length - 2 }} autres
                </span>
              </div>
            </td>
            <td class="amount">{{ sale.totalAmount.toFixed(2) }} FCFA</td>
            <td>
              <span :class="`payment-badge payment-${sale.paymentMethod}`">
                {{ getPaymentMethodLabel(sale.paymentMethod) }}
              </span>
            </td>
            <td class="actions">
              <button 
                @click="viewSaleDetails(sale)"
                class="btn-view"
                title="Voir les détails"
              >
                👁️
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredSales.length === 0" class="empty-state">
        <p>Aucune vente trouvée</p>
      </div>

      <!-- Pagination -->
      <div v-if="filteredSales.length > itemsPerPage" class="pagination">
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          Précédent
        </button>
        
        <span class="page-info">
          Page {{ currentPage }} sur {{ totalPages }}
        </span>
        
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          Suivant
        </button>
      </div>
    </div>

    <!-- Modal de détails de vente -->
    <div v-if="selectedSale" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Détails de la vente #{{ selectedSale.id.slice(-6) }}</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        
        <div class="sale-details">
          <div class="detail-row">
            <span class="label">Date:</span>
            <span class="value">{{ formatDateTime(selectedSale.createdAt) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Client:</span>
            <span class="value">{{ selectedSale.customerName || 'Non renseigné' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Paiement:</span>
            <span class="value">{{ getPaymentMethodLabel(selectedSale.paymentMethod) }}</span>
          </div>
          
          <h4>Articles vendus:</h4>
          <div class="items-details">
            <div 
              v-for="item in selectedSale.items" 
              :key="item.productId"
              class="item-detail"
            >
              <span class="item-name">{{ item.productName }}</span>
              <span class="item-quantity">×{{ item.quantity }}</span>
              <span class="item-price">{{ item.price }} FCFA</span>
              <span class="item-total">{{ item.total.toFixed(2) }} FCFA</span>
            </div>
          </div>
          
          <div class="detail-row total">
            <span class="label">Total:</span>
            <span class="value">{{ selectedSale.totalAmount.toFixed(2) }} FCFA</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '../stores/app';
import type { Sale } from '../types';

const appStore = useAppStore();

// États réactifs
const selectedPeriod = ref('all');
const selectedPayment = ref('all');
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(20);
const selectedSale = ref<Sale | null>(null);

// Computed properties
const allSales = computed(() => 
  appStore.sales.slice().sort((a:Sale, b:Sale) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
);

const filteredSales = computed(() => {
  let filtered = allSales.value;

  // Filtre par période
  if (selectedPeriod.value !== 'all') {
    const now = new Date();
    filtered = filtered.filter((sale : Sale) => {
      const saleDate = new Date(sale.createdAt);
      
      switch (selectedPeriod.value) {
        case 'today':
          return saleDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return saleDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return saleDate >= monthAgo;
        default:
          return true;
      }
    });
  }

  // Filtre par méthode de paiement
  if (selectedPayment.value !== 'all') {
    filtered = filtered.filter((sale : Sale) => 
      sale.paymentMethod === selectedPayment.value
    );
  }

  // Filtre par recherche
  if (searchQuery.value) {
    filtered = filtered.filter((sale : Sale) =>
      sale.customerName?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  return filtered;
});

const paginatedSales = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredSales.value.slice(start, end);
});

const totalPages = computed(() => 
  Math.ceil(filteredSales.value.length / itemsPerPage.value)
);

const totalRevenue = computed(() =>
  filteredSales.value.reduce((sum:number, sale:Sale) => sum + sale.totalAmount, 0)
);

const totalItems = computed(() =>
  filteredSales.value.reduce((sum:number, sale:Sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  )
);

// Méthodes
const filterSales = () => {
  currentPage.value = 1;
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('fr-FR');
};

const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatDateTime = (date: Date) => {
  return new Date(date).toLocaleString('fr-FR');
};

const getPaymentMethodLabel = (method: string) => {
  const labels: { [key: string]: string } = {
    cash: 'Espèces',
    card: 'Carte',
    mobile: 'Mobile'
  };
  return labels[method] || method;
};

const viewSaleDetails = (sale: Sale) => {
  selectedSale.value = sale;
};

const closeModal = () => {
  selectedSale.value = null;
};

// Initialisation
onMounted(() => {
  appStore.initializeData();
});
</script>

<style scoped>
.historique-ventes {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.filters {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-weight: bold;
  font-size: 0.9em;
  color: #2c3e50;
}

.filter-group select, .search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.stats-overview {
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

.sales-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.sales-table {
  width: 100%;
  border-collapse: collapse;
}

.sales-table th {
  background: #34495e;
  color: white;
  padding: 15px;
  text-align: left;
  font-weight: 600;
}

.sales-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #ecf0f1;
}

.date-cell {
  white-space: nowrap;
}

.date {
  font-weight: 500;
}

.time {
  font-size: 0.8em;
  color: #7f8c8d;
}

.sale-id {
  font-family: monospace;
  color: #7f8c8d;
}

.customer {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-tag {
  background: #ecf0f1;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.8em;
  color: #2c3e50;
}

.more-items {
  font-size: 0.8em;
  color: #7f8c8d;
  font-style: italic;
}

.amount {
  font-weight: bold;
  color: #27ae60;
}

.payment-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  color: white;
  text-align: center;
  display: inline-block;
  min-width: 70px;
}

.payment-cash { background: #3498db; }
.payment-card { background: #9b59b6; }
.payment-mobile { background: #2ecc71; }

.actions {
  text-align: center;
}

.btn-view {
  background: #3498db;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-top: 1px solid #ecf0f1;
}

.pagination-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.pagination-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.page-info {
  color: #7f8c8d;
}

/* Modal */
.modal-overlay {
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

.modal-content {
  background: white;
  padding: 0;
  border-radius: 10px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ecf0f1;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #7f8c8d;
}

.sale-details {
  padding: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ecf0f1;
}

.detail-row.total {
  border-top: 2px solid #34495e;
  font-weight: bold;
  font-size: 1.1em;
}

.label {
  color: #7f8c8d;
}

.value {
  color: #2c3e50;
  font-weight: 500;
}

.items-details {
  margin: 15px 0;
}

.item-detail {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f8f9fa;
}

.item-name {
  font-weight: 500;
}

.item-quantity, .item-price, .item-total {
  text-align: right;
  color: #7f8c8d;
}

.item-total {
  font-weight: bold;
  color: #2c3e50;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters {
    justify-content: center;
  }
  
  .sales-table {
    font-size: 0.8em;
  }
  
  .sales-table th,
  .sales-table td {
    padding: 8px 10px;
  }
}
</style>