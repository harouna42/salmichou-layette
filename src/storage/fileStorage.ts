// src/storage/fileStorage.ts
import type { Product, Category, Sale, User } from '../types';

interface AppData {
  products: Product[];
  categories: Category[];
  sales: Sale[];
  users: User[];
  lastSave: string;
}

export const fileStorage = {
  // Charger les données
  loadData(): AppData {
    try {
      const defaultData: AppData = {
        products: [],
        categories: [],
        sales: [],
        users: [],
        lastSave: new Date().toISOString()
      };

      const stored = localStorage.getItem('salmichou-data');
      if (!stored) return defaultData;

      const data = JSON.parse(stored);
      return {
        products: data.products || [],
        categories: data.categories || [],
        sales: data.sales || [],
        users: data.users || [],
        lastSave: data.lastSave || new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur chargement données:', error);
      return this.getDefaultData();
    }
  },

  // Sauvegarder les données
  saveData(data: AppData): void {
    try {
      data.lastSave = new Date().toISOString();
      localStorage.setItem('salmichou-data', JSON.stringify(data));
    } catch (error) {
      console.error('Erreur sauvegarde données:', error);
    }
  },

  // Données par défaut
  getDefaultData(): AppData {
    return {
      products: [],
      categories: [],
      sales: [],
      users: [],
      lastSave: new Date().toISOString()
    };
  },

  // Obtenir les données actuelles
  getCurrentData(): AppData {
    return this.loadData();
  },

    // ✅ NOUVELLE MÉTHODE : Sauvegarde silencieuse (pas de téléchargement)
  saveDataSilently(data: AppData): void {
    try {
      data.lastSave = new Date().toISOString();
      localStorage.setItem('salmichou-data', JSON.stringify(data));
      console.log('Données sauvegardées silencieusement');
    } catch (error) {
      console.error('Erreur sauvegarde silencieuse:', error);
    }
  },

  // Télécharger une sauvegarde
  downloadBackup(data: AppData): void {
    const backupData = {
      ...data,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salmichou-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Importer depuis un fichier (CORRIGÉ)
  importFromFile(file: File, importType: string = 'auto'): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importedData = JSON.parse(content);
          
          // ✅ CORRECTION : Utiliser this.loadData()
          const currentData = this.loadData();
          
          // Détection automatique du type
          let actualImportType = importType;
          if (importType === 'auto') {
            if (importedData.type === 'products') actualImportType = 'products';
            else if (importedData.type === 'categories') actualImportType = 'categories';
            else if (importedData.type === 'sales') actualImportType = 'sales';
            else if (importedData.type === 'users') actualImportType = 'users';
            else if (importedData.type === 'full_backup') actualImportType = 'full';
            else actualImportType = 'full';
          }
          
          switch (actualImportType) {
            case 'products':
              currentData.products = importedData.data || importedData.products || [];
              break;
              
            case 'categories':
              currentData.categories = importedData.data || importedData.categories || [];
              break;
              
            case 'sales':
              currentData.sales = importedData.data || importedData.sales || [];
              break;
              
            case 'users':
              currentData.users = importedData.data || importedData.users || [];
              break;
              
            case 'full':
            default:
              if (importedData.data) {
                currentData.products = importedData.data.products || currentData.products;
                currentData.categories = importedData.data.categories || currentData.categories;
                currentData.sales = importedData.data.sales || currentData.sales;
                currentData.users = importedData.data.users || currentData.users;
              } else {
                currentData.products = importedData.products || currentData.products;
                currentData.categories = importedData.categories || currentData.categories;
                currentData.sales = importedData.sales || currentData.sales;
                currentData.users = importedData.users || currentData.users;
              }
              break;
          }
          
          currentData.lastSave = new Date().toISOString();
          // ✅ CORRECTION : Utiliser this.saveData()
          this.saveData(currentData);
          
          resolve({ 
            success: true, 
            message: `Données importées avec succès (${actualImportType})` 
          });
          
        } catch (error) {
          console.error('Erreur import:', error);
          resolve({ 
            success: false, 
            message: 'Fichier invalide ou corrompu' 
          });
        }
      };
      
      reader.onerror = () => {
        resolve({ 
          success: false, 
          message: 'Erreur de lecture du fichier' 
        });
      };
      
      reader.readAsText(file);
    });
  },

  // Réinitialiser les données
  resetData(): void {
    const defaultData = this.getDefaultData();
    this.saveData(defaultData);
  }
};