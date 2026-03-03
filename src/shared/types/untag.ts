export interface UntagCommit {
  id: string;
  shortId: string;
  title: string;
  authorName: string;
  committedDate: string;
}

export interface UntagProject {
  projectId: number;
  projectName: string;
  projectPath: string;
  projectWebUrl: string;
  defaultBranch: string;
  lastTagName: string;
  lastTagDate: string;
  commitsAhead: number;
  lastCommitDate: string;
  commits: UntagCommit[];
  accountId: string;
}

// GitLab API response types
export interface GitLabTagResponse {
  name: string;
  message: string;
  target: string;
  commit: {
    id: string;
    short_id: string;
    title: string;
    created_at: string;
    parent_ids: string[];
    message: string;
    author_name: string;
    author_email: string;
    authored_date: string;
    committer_name: string;
    committer_email: string;
    committed_date: string;
  };
  release: {
    tag_name: string;
    description: string;
  } | null;
  protected: boolean;
}

export interface GitLabCompareCommit {
  id: string;
  short_id: string;
  title: string;
  author_name: string;
  author_email: string;
  created_at: string;
  committed_date: string;
  message: string;
}

export interface GitLabCompareResponse {
  commit: {
    id: string;
    short_id: string;
    title: string;
  } | null;
  commits: GitLabCompareCommit[];
  diffs: unknown[];
  compare_timeout: boolean;
  compare_same_ref: boolean;
}
