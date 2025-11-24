import { CryptoUtils } from '../utils/crypto';

export interface StoredData {
  users: any[];
  products: any[];
  categories: any[];
  sales: any[];
  lastSave: string;
}

export class JSONStorage {
  private storageKey = 'salmichou-data';

  // Charger toutes les données
  loadData(): StoredData {
    try {
      const defaultData = {
        products: [],
        categories: [],
        sales: [],
        users: [],
        lastSave: new Date().toISOString()
      };

      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return defaultData;

     const data = JSON.parse(stored);
      
      // ✅ DÉCHIFFRER les utilisateurs au chargement
      if (data.users && Array.isArray(data.users)) {
        data.users = data.users.map((user: any) => CryptoUtils.decryptUserData(user));
      }
      
      return {
        products: data.products || [],
        categories: data.categories || [],
        sales: data.sales || [],
        users: data.users || [],
        lastSave: data.lastSave || new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur lecture données:', error);
    // Retourner les données par défaut si vide
    return this.getDefaultData();
    }

  }

  // Sauvegarder toutes les données
  saveData(data: StoredData): void {
    try {
      const dataToSave = { ...data };
      
      // ✅ CHIFFRER les utilisateurs avant sauvegarde
      if (dataToSave.users && Array.isArray(dataToSave.users)) {
        dataToSave.users = dataToSave.users.map((user: any) => CryptoUtils.encryptUserData(user));
      }
      
      dataToSave.lastSave = new Date().toISOString();
      localStorage.setItem('salmichou-data', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Erreur sauvegarde données:', error);
    }
  }

  // Données par défaut
  private getDefaultData(): StoredData {
    return {
      users: [
        {
          id: '1',
          username: 'admin',
          password: 'admin123',
          role: 'admin',
          name: 'Administrateur Principal',
          email: 'admin@salmichou.cm',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          username: 'gestionnaire',
          password: 'gest123',
          role: 'manager',
          name: 'Gestionnaire Boutique',
          email: 'gestion@salmichou.cm',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          username: 'vendeur',
          password: 'vend123',
          role: 'employee',
          name: 'Vendeur Principal',
          phone: '+237 6XX XX XX XX',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      products: [
        {
          id: '1',
          name: 'Body bébé coton',
          description: 'Body 100% coton bio',
          price: 10000,
          costPrice: 5500,
          quantity: 25,
          category: 'vêtements',
          size: '0-3 mois',
          color: 'Blanc',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Pyjama grenouillère',
          description: 'Pyjama chaud velours',
          price: 19500,
          costPrice: 9800,
          quantity: 15,
          category: 'vêtements',
          size: '3-6 mois',
          color: 'Bleu',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Couches taille 2',
          description: 'Lot de 24 couches',
          price: 8500,
          costPrice: 4500,
          quantity: 50,
          category: 'couches',
          size: '3-6 kg',
          color: 'Blanc',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      categories: [
        { id: '1', name: 'vêtements', description: 'Vêtements pour bébé' },
        { id: '2', name: 'couches', description: 'Couches et changes' },
        { id: '3', name: 'puériculture', description: 'Articles de puériculture' }
      ],
      sales: [],
      lastSave: new Date().toISOString()
    };
  }

  // Export des données pour sauvegarde externe
  exportData(): string {
    const data = this.loadData();
    return JSON.stringify(data, null, 2);
  }

  // Import des données depuis un fichier
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData) as StoredData;
      
      // Validation basique
      if (!data.users || !data.products || !data.categories || !data.sales) {
        throw new Error('Format de données invalide');
      }

      this.saveData(data);
      return true;
    } catch (error) {
      console.error('Erreur import données:', error);
      return false;
    }
  }

  // Réinitialiser les données
  resetData(): void {
    const defaultData = this.getDefaultData();
    this.saveData(defaultData);
  }

  // Obtenir la date de dernière sauvegarde
  getLastSave(): Date {
    const data = this.loadData();
    return new Date(data.lastSave);
  }
}

export const jsonStorage = new JSONStorage();