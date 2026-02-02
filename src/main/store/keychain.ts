import { safeStorage } from 'electron';
import Store from 'electron-store';

interface TokenData {
  value: string;
  encrypted: boolean;
}

interface TokensStore {
  [accountId: string]: TokenData;
}

const tokenStore = new Store<{ tokens: TokensStore }>({
  name: 'tokens',
  defaults: {
    tokens: {},
  },
});

export const keychain = {
  isEncryptionAvailable(): boolean {
    return safeStorage.isEncryptionAvailable();
  },

  saveToken(accountId: string, token: string): boolean {
    try {
      const tokens = (tokenStore as any).get('tokens', {});

      if (safeStorage.isEncryptionAvailable()) {
        // Use secure encryption when available
        const encrypted = safeStorage.encryptString(token);
        const base64 = encrypted.toString('base64');
        tokens[accountId] = { value: base64, encrypted: true };
      } else {
        // Fallback: store with basic obfuscation (not secure, but functional)
        // Note: This is for unsigned apps during development
        console.warn('safeStorage not available, using fallback storage (less secure)');
        const obfuscated = Buffer.from(token).toString('base64');
        tokens[accountId] = { value: obfuscated, encrypted: false };
      }

      (tokenStore as any).set('tokens', tokens);
      return true;
    } catch (error) {
      console.error('Failed to save token:', error);
      return false;
    }
  },

  getToken(accountId: string): string | null {
    try {
      const tokens = (tokenStore as any).get('tokens', {});
      const tokenData = tokens[accountId];

      if (!tokenData) {
        return null;
      }

      if (tokenData.encrypted) {
        if (!safeStorage.isEncryptionAvailable()) {
          console.error('Token was encrypted but safeStorage is not available');
          return null;
        }
        const encrypted = Buffer.from(tokenData.value, 'base64');
        return safeStorage.decryptString(encrypted);
      } else {
        // Fallback: decode basic obfuscation
        return Buffer.from(tokenData.value, 'base64').toString('utf-8');
      }
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  },

  deleteToken(accountId: string): boolean {
    try {
      const tokens = (tokenStore as any).get('tokens', {});
      delete tokens[accountId];
      (tokenStore as any).set('tokens', tokens);
      return true;
    } catch (error) {
      console.error('Failed to delete token:', error);
      return false;
    }
  },

  hasToken(accountId: string): boolean {
    const tokens = (tokenStore as any).get('tokens', {});
    return accountId in tokens;
  },
};
