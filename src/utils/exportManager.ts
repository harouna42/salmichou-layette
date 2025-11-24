import type { Product, Category, Sale, User } from '../types';

export class ExportManager {
  // Exporter les produits
  static exportProducts(products: Product[]): { success: boolean; data?: string; error?: string } {
    try {
      const exportData = {
        type: 'products',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: products
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      return { success: true, data: dataStr };
    } catch (error) {
      return { success: false, error: 'Erreur lors de l\'export des produits' };
    }
  }

  // Exporter les catégories
  static exportCategories(categories: Category[]): { success: boolean; data?: string; error?: string } {
    try {
      const exportData = {
        type: 'categories',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: categories
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      return { success: true, data: dataStr };
    } catch (error) {
      return { success: false, error: 'Erreur lors de l\'export des catégories' };
    }
  }

  // Exporter les ventes
  static exportSales(sales: Sale[]): { success: boolean; data?: string; error?: string } {
    try {
      const exportData = {
        type: 'sales',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: sales
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      return { success: true, data: dataStr };
    } catch (error) {
      return { success: false, error: 'Erreur lors de l\'export des ventes' };
    }
  }

  // Exporter les utilisateurs
  static exportUsers(users: User[]): { success: boolean; data?: string; error?: string } {
    try {
      const exportData = {
        type: 'users',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: users.map(user => ({
          ...user,
          password: undefined // Ne pas exporter les mots de passe
        }))
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      return { success: true, data: dataStr };
    } catch (error) {
      return { success: false, error: 'Erreur lors de l\'export des utilisateurs' };
    }
  }

  // Exporter tout
  static exportAll(data: { products: Product[]; categories: Category[]; sales: Sale[]; users: User[] }): { success: boolean; data?: string; error?: string } {
    try {
      const exportData = {
        type: 'full_backup',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: {
          products: data.products,
          categories: data.categories,
          sales: data.sales,
          users: data.users.map(user => ({
            ...user,
            password: undefined
          }))
        }
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      return { success: true, data: dataStr };
    } catch (error) {
      return { success: false, error: 'Erreur lors de l\'export complet' };
    }
  }

  // Télécharger un fichier
  static downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Générer un nom de fichier avec timestamp
  static generateFilename(type: string): string {
    const date = new Date();
    const timestamp = date.toISOString().split('T')[0] + '_' + 
                     date.getHours() + '-' + date.getMinutes();
    return `salmichou_${type}_${timestamp}.json`;
  }
}