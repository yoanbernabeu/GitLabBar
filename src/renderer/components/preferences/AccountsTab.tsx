import React, { useState } from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import { GitLabAccount } from '../../../shared/types';

export const AccountsTab: React.FC = () => {
  const { accounts, addAccount, removeAccount, updateAccount, validateToken, isLoading } = useAccounts();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    instanceUrl: 'https://gitlab.com',
    token: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validatedUser, setValidatedUser] = useState<{ username: string; name: string; avatarUrl: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
    setValidatedUser(null);
  };

  const handleValidateToken = async () => {
    if (!formData.instanceUrl || !formData.token) {
      setFormError('Please enter the URL and token');
      return;
    }

    setIsValidating(true);
    setFormError(null);

    try {
      const result = await validateToken(formData.instanceUrl, formData.token);
      if (result.valid && result.user) {
        setValidatedUser(result.user);
        if (!formData.name) {
          setFormData((prev) => ({ ...prev, name: result.user!.name }));
        }
      } else {
        setFormError('Invalid token or connection error');
      }
    } catch {
      setFormError('Error during validation');
    } finally {
      setIsValidating(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatedUser) {
      setFormError('Please validate the token first');
      return;
    }

    const result = await addAccount(formData);
    if (result.success) {
      setFormData({ name: '', instanceUrl: 'https://gitlab.com', token: '' });
      setValidatedUser(null);
      setShowAddForm(false);
    } else {
      setFormError(result.error || 'Error adding account');
    }
  };

  const handleRemoveAccount = async (account: GitLabAccount) => {
    if (window.confirm(`Delete account "${account.name}"?`)) {
      await removeAccount(account.id);
    }
  };

  const handleToggleActive = async (account: GitLabAccount) => {
    await updateAccount(account.id, { isActive: !account.isActive });
  };

  return (
    <div className="preferences-section">
      <h2 className="preferences-section-title">GitLab Accounts</h2>
      <p className="preferences-section-description">
        Manage your GitLab accounts. You can add multiple accounts from different instances.
      </p>

      {accounts.length > 0 && (
        <div className="accounts-list">
          {accounts.map((account) => (
            <div key={account.id} className="account-item">
              {account.avatarUrl ? (
                <img src={account.avatarUrl} alt={account.name} className="account-avatar" />
              ) : (
                <div className="account-avatar" style={{ background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {account.name[0].toUpperCase()}
                </div>
              )}
              <div className="account-info">
                <div className="account-name">{account.name}</div>
                <div className="account-details">
                  @{account.username} • {new URL(account.instanceUrl).hostname}
                </div>
              </div>
              <div className="account-actions">
                <button
                  className={`toggle-switch ${account.isActive ? 'active' : ''}`}
                  onClick={() => handleToggleActive(account)}
                  title={account.isActive ? 'Disable' : 'Enable'}
                />
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleRemoveAccount(account)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showAddForm ? (
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          Add account
        </button>
      ) : (
        <form onSubmit={handleAddAccount} className="account-form">
          <div className="form-group">
            <label className="form-label">GitLab instance URL</label>
            <input
              type="url"
              name="instanceUrl"
              value={formData.instanceUrl}
              onChange={handleInputChange}
              className="form-input"
              placeholder="https://gitlab.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Personal access token</label>
            <input
              type="password"
              name="token"
              value={formData.token}
              onChange={handleInputChange}
              className="form-input"
              placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
              required
            />
            <p className="form-hint">
              Create a token with scopes <code>read_api</code> and <code>read_user</code>
            </p>
          </div>

          {!validatedUser && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleValidateToken}
              disabled={isValidating}
            >
              {isValidating ? 'Validating...' : 'Validate token'}
            </button>
          )}

          {validatedUser && (
            <>
              <div className="message message-success">
                ✓ Connected as {validatedUser.name} (@{validatedUser.username})
              </div>

              <div className="form-group">
                <label className="form-label">Account name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="My GitLab account"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary">
                  Add account
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ name: '', instanceUrl: 'https://gitlab.com', token: '' });
                    setValidatedUser(null);
                    setFormError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {formError && <div className="message message-error">{formError}</div>}
        </form>
      )}
    </div>
  );
};
