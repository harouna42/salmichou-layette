export interface StoredData {
  users: any[];
  products: any[];
  categories: any[];
  sales: any[];
  lastSave: string;
  version: string;
}

export class FileStorage {
  private fileName = 'salmichou-data.json';
  private data: StoredData | null = null;

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
        }
      ],
      categories: [
        { id: '1', name: 'vêtements', description: 'Vêtements pour bébé' },
        { id: '2', name: 'couches', description: 'Couches et changes' },
        { id: '3', name: 'puériculture', description: 'Articles de puériculture' }
      ],
      sales: [],
      lastSave: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Charger les données depuis un fichier
  async loadData(): Promise<StoredData> {
    try {
      // Essayer de charger depuis le localStorage d'abord (pour la compatibilité)
      const localStorageData = localStorage.getItem('salmichou-data');
      if (localStorageData) {
        this.data = JSON.parse(localStorageData);
        console.log('Données chargées depuis le localStorage');
        if(this.data){
          return this.data;
        }
      }

      // Si pas dans localStorage, essayer de charger depuis un fichier
      // Note: Dans un environnement navigateur, on ne peut pas lire directement des fichiers
      // On va donc utiliser une approche mixte
      
      // Pour l'instant, retourner les données par défaut
      this.data = this.getDefaultData();
      return this.data;

    } catch (error) {
      console.error('Erreur chargement données:', error);
      this.data = this.getDefaultData();
      return this.data;
    }
  }

  // Sauvegarder les données
  async saveData(data: StoredData): Promise<boolean> {
    try {
      this.data = {
        ...data,
        lastSave: new Date().toISOString()
      };

      // 1. Sauvegarde dans le localStorage (pour la session courante)
      localStorage.setItem('salmichou-data', JSON.stringify(this.data));

      // 2. Proposer le téléchargement du fichier
      this.downloadBackup(this.data);

      console.log('Données sauvegardées');
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde données:', error);
      return false;
    }
  }

  // Télécharger un backup
  downloadBackup(data: StoredData) {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `salmichou-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Importer depuis un fichier
  async importFromFile(file: File): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importedData = JSON.parse(content) as StoredData;
          
          // Validation basique
          if (!importedData.users || !importedData.products || !importedData.categories || !importedData.sales) {
            throw new Error('Format de fichier invalide');
          }

          this.data = importedData;
          localStorage.setItem('salmichou-data', JSON.stringify(this.data));
          
          resolve({ success: true, message: 'Données importées avec succès' });
        } catch (error) {
          console.error('Erreur import:', error);
          resolve({ success: false, message: 'Erreur lors de l\'importation du fichier' });
        }
      };

      reader.onerror = () => {
        resolve({ success: false, message: 'Erreur de lecture du fichier' });
      };

      reader.readAsText(file);
    });
  }

  // Obtenir les données courantes
  getCurrentData(): StoredData | null {
    return this.data;
  }

  // Vérifier si des données existent
  async hasExistingData(): Promise<boolean> {
    const data = await this.loadData();
    return data.users.length > 0 || data.products.length > 0 || data.sales.length > 0;
  }

  // Réinitialiser les données
  async resetData(): Promise<void> {
    this.data = this.getDefaultData();
    localStorage.setItem('salmichou-data', JSON.stringify(this.data));
  }
}

export const fileStorage = new FileStorage();