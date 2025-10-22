export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  quantity: number;
  category: string;
  size?: string;
  color?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'mobile';
  customerName?: string;
  createdAt: Date;
  employeeId: string;
}

export interface Statistics {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
  salesByCategory: { category: string; amount: number }[];
  monthlySales: { month: string; sales: number }[];
}

export interface SalesByCategory { category: string; amount: number; }

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'employee' | 'manager';
  name: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: 'admin' | 'employee' | 'manager';
  permissions: string[];
  description: string;
}

// Ajoutez ces permissions
export const USER_PERMISSIONS = {
  // Ventes
  VIEW_SALES: 'view_sales',
  CREATE_SALES: 'create_sales',
  // Produits
  VIEW_PRODUCTS: 'view_products',
  MANAGE_PRODUCTS: 'manage_products',
  // Utilisateurs
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  // Statistiques
  VIEW_STATS: 'view_stats',
  // Catégories
  MANAGE_CATEGORIES: 'manage_categories'
} as const;

export type UserPermission = typeof USER_PERMISSIONS[keyof typeof USER_PERMISSIONS];