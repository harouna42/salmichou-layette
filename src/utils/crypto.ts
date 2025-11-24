// src/utils/crypto.ts - Version améliorée
export class CryptoUtils {
  private static readonly ENCRYPTION_PREFIX = 'enc:';
  private static readonly KEY = this.generateKey();

  private static generateKey(): string {
    // Générer une clé basée sur un salt fixe + variable
    const salt = 'salmichou-layette-2024-secure';
    let key = '';
    for (let i = 0; i < salt.length; i++) {
      key += String.fromCharCode(salt.charCodeAt(i) + 1);
    }
    return btoa(key).substring(0, 16);
  }

  static encrypt(text: string): string {
    if (!text) return text;
    
    try {
      // Méthode de chiffrement simple mais efficace
      let result = '';
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const keyChar = this.KEY.charCodeAt(i % this.KEY.length);
        result += String.fromCharCode(charCode ^ keyChar);
      }
      
      return this.ENCRYPTION_PREFIX + btoa(result);
    } catch (error) {
      console.error('Erreur chiffrement:', error);
      return text;
    }
  }

  static decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.startsWith(this.ENCRYPTION_PREFIX)) {
      return encryptedText;
    }
    
    try {
      const base64Text = encryptedText.substring(this.ENCRYPTION_PREFIX.length);
      const encrypted = atob(base64Text);
      
      let result = '';
      for (let i = 0; i < encrypted.length; i++) {
        const charCode = encrypted.charCodeAt(i);
        const keyChar = this.KEY.charCodeAt(i % this.KEY.length);
        result += String.fromCharCode(charCode ^ keyChar);
      }
      
      return result;
    } catch (error) {
      console.error('Erreur déchiffrement:', error);
      return encryptedText;
    }
  }

  static isEncrypted(text: string): boolean {
    return text && text.startsWith(this.ENCRYPTION_PREFIX);
  }

  // Les méthodes encryptUserData et decryptUserData restent les mêmes
  static encryptUserData(user: any): any {
    if (!user) return user;
    
    const encryptedUser = { ...user };
    if (user.password) {
      encryptedUser.password = this.encrypt(user.password);
    }
    return encryptedUser;
  }

  static decryptUserData(user: any): any {
    if (!user) return user;
    
    const decryptedUser = { ...user };
    if (user.password && this.isEncrypted(user.password)) {
      decryptedUser.password = this.decrypt(user.password);
    }
    return decryptedUser;
  }
}