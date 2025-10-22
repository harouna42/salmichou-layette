<template>
  <div class="statistiques-container">
    <h1>Statistiques et Rapports</h1>
    
    <BackupManager />

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <h3>Ventes Total</h3>
          <p class="stat-value">{{ statistics.totalSales }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-info">
          <h3>Chiffre d'Affaires</h3>
          <p class="stat-value">{{ statistics.totalRevenue.toFixed(2) }} FCFA</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <h3>Produits en Stock</h3>
          <p class="stat-value">{{ statistics.totalProducts }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⚠️</div>
        <div class="stat-info">
          <h3>Stock Faible</h3>
          <p class="stat-value">{{ statistics.lowStockProducts }}</p>
        </div>
      </div>
    </div>
    
    <div class="charts-section">
      <div class="chart-card">
        <h3>Ventes par Catégorie</h3>
        <div class="chart">
          <div 
            v-for="item in statistics.salesByCategory" 
            :key="item.category"
            class="chart-bar"
          >
            <div class="bar-label">{{ item.category }}</div>
            <div class="bar-container">
              <div 
                class="bar-fill" 
                :style="{ width: getBarWidth(item.amount) + '%' }"
              ></div>
            </div>
            <div class="bar-value">{{ item.amount.toFixed(2) }} FCFA</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="low-stock-section">
      <h3>Produits en Stock Faible</h3>
      <table class="low-stock-table">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Catégorie</th>
            <th>Stock Actuel</th>
            <th>Prix</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in lowStockProducts" :key="product.id">
            <td>{{ product.name }}</td>
            <td>{{ product.category }}</td>
            <td class="low-stock">{{ product.quantity }}</td>
            <td>{{ formatPrice(product.price) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAppStore } from '../stores/app';
import BackupManager from '../components/BackupManager.vue'; // Import du composant
import type { Product, SalesByCategory} from '../types';
import { formatPrice } from '../utils/format';

const appStore = useAppStore();

const statistics = computed(() => appStore.getStatistics);

const lowStockProducts = computed(() =>
  appStore.products.filter((p : Product) => p.quantity < 10)
);

const getBarWidth = (amount: number) => {
  const maxAmount = Math.max(...statistics.value.salesByCategory.map((item : SalesByCategory) => item.amount));
  return maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
};

onMounted(() => {
  appStore.initializeData();
});
</script>

<style scoped>
.statistiques-container {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

.charts-section, .low-stock-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.chart-bar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.bar-label {
  width: 100px;
  font-size: 0.9em;
}

.bar-container {
  flex: 1;
  background: #ecf0f1;
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
}

.bar-fill {
  background: #3498db;
  height: 100%;
  transition: width 0.3s ease;
}

.bar-value {
  width: 80px;
  text-align: right;
  font-size: 0.9em;
}

.low-stock-table {
  width: 100%;
  border-collapse: collapse;
}

.low-stock-table th,
.low-stock-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.low-stock {
  color: #e74c3c;
  font-weight: bold;
}
</style>