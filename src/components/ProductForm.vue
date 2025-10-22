<template>
  <form @submit.prevent="handleSubmit" class="product-form">
    <h3>{{ isEditing ? 'Modifier' : 'Ajouter' }} un produit</h3>
    
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
        <label>Prix de vente (€):</label>
        <input v-model.number="form.price" type="number" step="0.01" required>
      </div>
      
      <div class="form-group">
        <label>Prix de revient (€):</label>
        <input v-model.number="form.costPrice" type="number" step="0.01" required>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label>Quantité:</label>
        <input v-model.number="form.quantity" type="number" required>
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
        <input v-model="form.size" type="text">
      </div>
      
      <div class="form-group">
        <label>Couleur:</label>
        <input v-model="form.color" type="text">
      </div>
    </div>
    
    <div class="form-actions">
      <button type="submit" class="btn-primary">
        {{ isEditing ? 'Modifier' : 'Ajouter' }}
      </button>
      <button type="button" @click="$emit('cancel')" class="btn-secondary">
        Annuler
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Product, Category } from '@/types';

interface Props {
  product?: Product;
  categories: Category[];
}

interface Emits {
  (e: 'submit', product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): void;
  (e: 'cancel'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isEditing = ref(!!props.product);

const form = ref({
  name: '',
  description: '',
  price: 0,
  costPrice: 0,
  quantity: 0,
  category: '',
  size: '',
  color: ''
});

watch(() => props.product, (newProduct) => {
  if (newProduct) {
    form.value = { ...newProduct };
    isEditing.value = true;
  } else {
    resetForm();
    isEditing.value = false;
  }
}, { immediate: true });

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    price: 0,
    costPrice: 0,
    quantity: 0,
    category: '',
    size: '',
    color: ''
  };
};

const handleSubmit = () => {
  emit('submit', form.value);
  if (!isEditing.value) {
    resetForm();
  }
};
</script>

<style scoped>
.product-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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
}

input, select, textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}
</style>