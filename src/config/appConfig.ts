export interface AppConfig {
  sessionDuration: number; // en minutes
  autoBackup: boolean;
  backupInterval: number; // en minutes
  language: 'fr' | 'en'; // ✅ Ajouter la langue
  theme: string;
}

export const defaultConfig: AppConfig = {
  sessionDuration: 8, // 8 heures par défaut
  autoBackup: false,
  backupInterval: 60,
  language: 'fr',
  theme: 'light'
};

export const appConfig = {
  // Charger la configuration
  loadConfig(): AppConfig {
    try {
      const stored = localStorage.getItem('salmichou-config');
      if (!stored) return defaultConfig;

      const config = JSON.parse(stored);
      return {
        ...defaultConfig,
        ...config
      };
    } catch (error) {
      console.error('Erreur chargement configuration:', error);
      return defaultConfig;
    }
  },

  // Sauvegarder la configuration
  saveConfig(config: AppConfig): void {
    try {
      localStorage.setItem('salmichou-config', JSON.stringify(config));
    } catch (error) {
      console.error('Erreur sauvegarde configuration:', error);
    }
  },

  // Exporter la configuration
  exportConfig(config: AppConfig): string {
    return JSON.stringify(config, null, 2);
  },

  // Importer la configuration
  importConfig(configStr: string): { success: boolean; config?: AppConfig; error?: string } {
    try {
      const importedConfig = JSON.parse(configStr);
      const mergedConfig = {
        ...defaultConfig,
        ...importedConfig
      };
      this.saveConfig(mergedConfig);
      return { success: true, config: mergedConfig };
    } catch (error) {
      return { success: false, error: 'Configuration invalide' };
    }
  }
};