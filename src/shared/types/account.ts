export interface GitLabAccount {
  id: string;
  name: string;
  instanceUrl: string;
  username: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface GitLabAccountInput {
  name: string;
  instanceUrl: string;
  token: string;
}

export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
  web_url: string;
}
