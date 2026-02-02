import { useState, useEffect, useCallback } from 'react';
import { GitLabAccount, GitLabAccountInput } from '../../shared/types';

interface UseAccountsResult {
  accounts: GitLabAccount[];
  isLoading: boolean;
  error: string | null;
  addAccount: (input: GitLabAccountInput) => Promise<{ success: boolean; error?: string }>;
  removeAccount: (accountId: string) => Promise<{ success: boolean; error?: string }>;
  updateAccount: (accountId: string, updates: Partial<Omit<GitLabAccount, 'id'>>) => Promise<{ success: boolean; error?: string }>;
  validateToken: (instanceUrl: string, token: string) => Promise<{ valid: boolean; user?: { username: string; name: string; avatarUrl: string } }>;
  refreshAccounts: () => Promise<void>;
}

export function useAccounts(): UseAccountsResult {
  const [accounts, setAccounts] = useState<GitLabAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await window.gitlabbar.accounts.getAll();
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des comptes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addAccount = useCallback(async (input: GitLabAccountInput) => {
    try {
      const result = await window.gitlabbar.accounts.add(input);
      if (result.success) {
        await refreshAccounts();
      }
      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
    }
  }, [refreshAccounts]);

  const removeAccount = useCallback(async (accountId: string) => {
    try {
      const result = await window.gitlabbar.accounts.remove(accountId);
      if (result.success) {
        await refreshAccounts();
      }
      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
    }
  }, [refreshAccounts]);

  const updateAccount = useCallback(async (accountId: string, updates: Partial<Omit<GitLabAccount, 'id'>>) => {
    try {
      const result = await window.gitlabbar.accounts.update(accountId, updates);
      if (result.success) {
        await refreshAccounts();
      }
      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
    }
  }, [refreshAccounts]);

  const validateToken = useCallback(async (instanceUrl: string, token: string) => {
    return window.gitlabbar.accounts.validateToken(instanceUrl, token);
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  return {
    accounts,
    isLoading,
    error,
    addAccount,
    removeAccount,
    updateAccount,
    validateToken,
    refreshAccounts,
  };
}
