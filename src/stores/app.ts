import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fileStorage } from '../storage/fileStorage';
import type { Product, Category, Sale, Statistics } from '../types';

export const useAppStore = defineStore('app', () => {
  const products = ref<Product[]>([]);
  const categories = ref<Category[]>([]);
  const sales = ref<Sale[]>([]);

  // Initialisation des données
  const initializeData = async () => {
    const data = await fileStorage.loadData();
    
    products.value = data.products.map((product: any) => ({
      ...product,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt)
    }));

    categories.value = data.categories;
    
    sales.value = data.sales.map((sale: any) => ({
      ...sale,
      createdAt: new Date(sale.createdAt),
      items: sale.items || []
    }));
  };

  // Sauvegarder toutes les données
  const saveAllData = async () => {
    const data = await fileStorage.loadData();
    data.products = products.value;
    data.categories = categories.value;
    data.sales = sales.value;
    
    fileStorage.saveDataSilently(data);
    //await fileStorage.saveData(data);
  };

  // Gestion des produits
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    products.value.push(newProduct);
    await saveAllData();
    return newProduct;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const index = products.value.findIndex(p => p.id === id);
    if (index !== -1) {
      products.value[index] = {
        ...products.value[index],
        ...updates,
        updatedAt: new Date()
      };
      await saveAllData();
    }
  };

  const deleteProduct = async (id: string) => {
    products.value = products.value.filter(p => p.id !== id);
    await saveAllData();
  };

  // Gestion des catégories
  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: Date.now().toString()
    };
    
    categories.value.push(newCategory);
    await saveAllData();
    return newCategory;
  };

  // Gestion des catégories
const updateCategory = async (id: string, updates: Partial<Category>) => {
  const index = categories.value.findIndex(c => c.id === id);
  if (index !== -1) {
    categories.value[index] = {
      ...categories.value[index],
      ...updates
    };
    await saveAllData();
  }
};

const deleteCategory = async (id: string) => {
  categories.value = categories.value.filter(c => c.id !== id);
  await saveAllData();
};
  // Gestion des ventes
  const addSale = async (saleData: Omit<Sale, 'id'>) => {
    const newSale: Sale = {
      ...saleData,
      id: Date.now().toString()
    };
    
    sales.value.unshift(newSale);
    
    // Mettre à jour les stocks
    saleData.items.forEach(item => {
      const product = products.value.find(p => p.id === item.productId);
      if (product) {
        product.quantity -= item.quantity;
      }
    });
    
    await saveAllData();
    return newSale;
  };

  // Statistiques
  const getStatistics = computed((): Statistics => {
    // Utilisez les valeurs directes au lieu des computed pour éviter la récursion
    const totalSales = sales.value.length;
    const totalRevenue = sales.value.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProducts = products.value.length;
    const lowStockProducts = products.value.filter(p => p.quantity < 10).length;

    // Calcul direct sans appeler d'autres computed
    const salesByCategory = categories.value.map(category => {
      const amount = sales.value.reduce((sum, sale) => {
        const categoryItems = sale.items.filter(item => {
          const product = products.value.find(p => p.id === item.productId);
          return product?.category === category.name;
        });
        return sum + categoryItems.reduce((itemSum, item) => itemSum + item.total, 0);
      }, 0);
      
      return { category: category.name, amount };
    });

    return {
      totalSales,
      totalRevenue,
      totalProducts,
      lowStockProducts,
      salesByCategory,
      monthlySales: []
    };
  });

  // Réinitialiser les données (gardée pour l'admin)
  const resetData = async () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.')) {
      await fileStorage.resetData();
      await initializeData();
    }
  };

  return {
    products,
    categories,
    sales,
    initializeData,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addSale,
    getStatistics,
    resetData,
    saveAllData
  };
});