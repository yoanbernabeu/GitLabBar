export type UserRole = 'author' | 'assignee' | 'reviewer' | 'mentioned' | 'unassigned';

export interface MergeRequestAuthor {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
}

export interface MergeRequest {
  id: number;
  iid: number;
  title: string;
  description: string;
  webUrl: string;
  projectId: number;
  projectName: string;
  projectPath: string;
  author: MergeRequestAuthor;
  userRole: UserRole;
  accountId: string;
  state: 'opened' | 'closed' | 'merged';
  draft: boolean;
  createdAt: string;
  updatedAt: string;
  sourceBranch: string;
  targetBranch: string;
  mergeStatus: string;
  hasConflicts: boolean;
  reviewers: MergeRequestAuthor[];
  assignees: MergeRequestAuthor[];
  userNotesCount: number;
  userMentionedInNotes: boolean;
}

export interface GitLabMergeRequestResponse {
  id: number;
  iid: number;
  title: string;
  description: string;
  web_url: string;
  project_id: number;
  author: MergeRequestAuthor;
  state: 'opened' | 'closed' | 'merged';
  draft: boolean;
  created_at: string;
  updated_at: string;
  source_branch: string;
  target_branch: string;
  merge_status: string;
  has_conflicts: boolean;
  reviewers: MergeRequestAuthor[];
  assignees: MergeRequestAuthor[];
  user_notes_count: number;
}
