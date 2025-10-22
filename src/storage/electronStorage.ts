export class ElectronStorage {
  private isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  async saveData(data: any): Promise<boolean> {
    try {
      if (this.isElectron) {
        // Utilise l'API Electron pour sauvegarder
        const result = await window.electronAPI.saveFile(JSON.stringify(data, null, 2));
        return result.success;
      } else {
        // Fallback vers le localStorage
        localStorage.setItem('salmichou-data', JSON.stringify(data));
        return true;
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      return false;
    }
  }

  async loadData(): Promise<any> {
    try {
      if (this.isElectron) {
        // Demande à l'utilisateur de choisir un fichier
        const result = await window.electronAPI.openFile();
        if (result.success) {
          return JSON.parse(result.data);
        }
      }
      
      // Fallback vers le localStorage
      const stored = localStorage.getItem('salmichou-data');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Erreur chargement:', error);
      return null;
    }
  }

  async exportBackup(data: any): Promise<void> {
    if (this.isElectron) {
      await this.saveData(data);
    } else {
      // Version navigateur
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
  }
}

export const electronStorage = new ElectronStorage();