import { safeStorage } from 'electron';
import Store from 'electron-store';

interface EncryptedTokens {
  [accountId: string]: string; // Base64 encoded encrypted token
}

const tokenStore = new Store<{ tokens: EncryptedTokens }>({
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
    if (!safeStorage.isEncryptionAvailable()) {
      console.error('Encryption is not available on this system');
      return false;
    }

    try {
      const encrypted = safeStorage.encryptString(token);
      const base64 = encrypted.toString('base64');
      const tokens = (tokenStore as any).get('tokens', {});
      tokens[accountId] = base64;
      (tokenStore as any).set('tokens', tokens);
      return true;
    } catch (error) {
      console.error('Failed to save token:', error);
      return false;
    }
  },

  getToken(accountId: string): string | null {
    if (!safeStorage.isEncryptionAvailable()) {
      console.error('Encryption is not available on this system');
      return null;
    }

    try {
      const tokens = (tokenStore as any).get('tokens', {});
      const base64 = tokens[accountId];
      if (!base64) {
        return null;
      }
      const encrypted = Buffer.from(base64, 'base64');
      return safeStorage.decryptString(encrypted);
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
