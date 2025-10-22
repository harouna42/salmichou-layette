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
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erreur lecture données:', error);
    }

    // Retourner les données par défaut si vide
    return this.getDefaultData();
  }

  // Sauvegarder toutes les données
  saveData(data: StoredData): void {
    try {
      data.lastSave = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(data));
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