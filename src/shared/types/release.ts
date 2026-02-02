export interface Release {
  id: number;
  tagName: string;
  name: string;
  description: string;
  releasedAt: string;
  createdAt: string;
  webUrl: string;
  projectId: number;
  projectName: string;
  projectPath: string;
  author: {
    id: number;
    username: string;
    name: string;
    avatar_url: string;
  };
  deployment?: Deployment;
  accountId: string;
}

export interface Deployment {
  id: number;
  status: 'created' | 'running' | 'success' | 'failed' | 'canceled';
  environment: string;
  deployedAt?: string;
  webUrl: string;
}

export interface GitLabReleaseResponse {
  id: number;
  tag_name: string;
  name: string;
  description: string;
  released_at: string;
  created_at: string;
  _links: {
    self: string;
  };
  author: {
    id: number;
    username: string;
    name: string;
    avatar_url: string;
  };
}

export interface GitLabDeploymentResponse {
  id: number;
  status: 'created' | 'running' | 'success' | 'failed' | 'canceled';
  environment: {
    id: number;
    name: string;
    external_url?: string;
  };
  deployable?: {
    id: number;
    ref: string;
    tag: boolean;
  };
  created_at: string;
  updated_at: string;
}
