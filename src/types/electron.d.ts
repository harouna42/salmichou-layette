export interface ElectronAPI {
  saveFile: (data: string) => Promise<{ success: boolean; path?: string }>;
  openFile: () => Promise<{ success: boolean; data?: string }>;
  platform: string;
  version: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}