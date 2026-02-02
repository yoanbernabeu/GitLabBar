export type PipelineStatus =
  | 'created'
  | 'waiting_for_resource'
  | 'preparing'
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'canceled'
  | 'skipped'
  | 'manual'
  | 'scheduled';

export interface PipelineCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
}

export interface PipelineUser {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
}

export interface Pipeline {
  id: number;
  status: PipelineStatus;
  ref: string;
  sha: string;
  webUrl: string;
  projectId: number;
  projectName: string;
  projectPath: string;
  currentStage?: string;
  commit?: PipelineCommit;
  user?: PipelineUser;
  accountId: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
  duration?: number;
  source: string;
  jobs?: PipelineJob[];
}

export interface GitLabPipelineResponse {
  id: number;
  status: PipelineStatus;
  ref: string;
  sha: string;
  web_url: string;
  project_id: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  finished_at?: string;
  duration?: number;
  source: string;
}

export interface GitLabPipelineDetailResponse extends GitLabPipelineResponse {
  user: {
    id: number;
    username: string;
    name: string;
    avatar_url: string;
  };
}

export type JobStatus = 'created' | 'pending' | 'running' | 'success' | 'failed' | 'canceled' | 'skipped' | 'manual';

export interface PipelineJob {
  id: number;
  name: string;
  stage: string;
  status: JobStatus;
  webUrl: string;
  duration?: number;
  startedAt?: string;
  finishedAt?: string;
}

export interface GitLabJobResponse {
  id: number;
  name: string;
  stage: string;
  status: JobStatus;
  web_url: string;
  duration?: number;
  started_at?: string;
  finished_at?: string;
}
