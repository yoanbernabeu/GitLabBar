import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import { GitLabAccount } from '../../shared/types/account';
import { keychain } from './keychain';

interface AccountsStore {
  accounts: GitLabAccount[];
}

const accountsStore = new Store<AccountsStore>({
  name: 'accounts',
  defaults: {
    accounts: [],
  },
});

export const accounts = {
  getAll(): GitLabAccount[] {
    return (accountsStore as any).get('accounts', []);
  },

  getById(id: string): GitLabAccount | undefined {
    const allAccounts = this.getAll();
    return allAccounts.find((account) => account.id === id);
  },

  getActive(): GitLabAccount[] {
    return this.getAll().filter((account) => account.isActive);
  },

  add(account: Omit<GitLabAccount, 'id'>, token: string): GitLabAccount | null {
    const id = uuidv4();
    const newAccount: GitLabAccount = {
      ...account,
      id,
    };

    // Save the token securely
    const tokenSaved = keychain.saveToken(id, token);
    if (!tokenSaved) {
      console.error('Failed to save token for account');
      return null;
    }

    const allAccounts = this.getAll();
    allAccounts.push(newAccount);
    (accountsStore as any).set('accounts', allAccounts);

    return newAccount;
  },

  update(id: string, updates: Partial<Omit<GitLabAccount, 'id'>>): GitLabAccount | null {
    const allAccounts = this.getAll();
    const index = allAccounts.findIndex((account) => account.id === id);

    if (index === -1) {
      return null;
    }

    allAccounts[index] = {
      ...allAccounts[index],
      ...updates,
    };

    (accountsStore as any).set('accounts', allAccounts);
    return allAccounts[index];
  },

  updateToken(id: string, token: string): boolean {
    return keychain.saveToken(id, token);
  },

  remove(id: string): boolean {
    const allAccounts = this.getAll();
    const filteredAccounts = allAccounts.filter((account) => account.id !== id);

    if (filteredAccounts.length === allAccounts.length) {
      return false;
    }

    (accountsStore as any).set('accounts', filteredAccounts);
    keychain.deleteToken(id);
    return true;
  },

  setActive(id: string, isActive: boolean): GitLabAccount | null {
    return this.update(id, { isActive });
  },

  getToken(id: string): string | null {
    return keychain.getToken(id);
  },

  hasAccounts(): boolean {
    return this.getAll().length > 0;
  },
};
