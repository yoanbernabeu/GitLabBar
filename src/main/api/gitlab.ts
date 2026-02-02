import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  GitLabUser,
  GitLabMergeRequestResponse,
  MergeRequest,
  UserRole,
  GitLabPipelineResponse,
  Pipeline,
  GitLabJobResponse,
  PipelineJob,
  GitLabReleaseResponse,
  GitLabDeploymentResponse,
  Release,
  Deployment,
} from '../../shared/types';

export interface GitLabProject {
  id: number;
  name: string;
  name_with_namespace: string;
  path_with_namespace: string;
  web_url: string;
  namespace: {
    id: number;
    name: string;
    path: string;
    kind: string;
  };
}

export interface GitLabGroup {
  id: number;
  name: string;
  path: string;
  full_name: string;
  full_path: string;
  web_url: string;
  parent_id: number | null;
}

export class GitLabClient {
  private client: AxiosInstance;
  private accountId: string;
  private instanceUrl: string;
  private currentUserId: number | null = null;

  constructor(instanceUrl: string, token: string, accountId: string) {
    this.instanceUrl = instanceUrl.replace(/\/$/, '');
    this.accountId = accountId;

    this.client = axios.create({
      baseURL: `${this.instanceUrl}/api/v4`,
      headers: {
        'PRIVATE-TOKEN': token,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Interceptor to handle rate limiting
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000;
          console.warn(`Rate limited. Waiting ${waitTime}ms before retry.`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          return this.client.request(error.config!);
        }
        throw error;
      }
    );
  }

  async validateToken(): Promise<GitLabUser | null> {
    try {
      const response = await this.client.get<GitLabUser>('/user');
      this.currentUserId = response.data.id;
      return response.data;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  async getCurrentUser(): Promise<GitLabUser | null> {
    return this.validateToken();
  }

  async getMergeRequests(scope: 'assigned_to_me' | 'created_by_me' = 'assigned_to_me'): Promise<MergeRequest[]> {
    try {
      const response = await this.client.get<GitLabMergeRequestResponse[]>('/merge_requests', {
        params: {
          scope,
          state: 'opened',
          per_page: 100,
        },
      });

      const roleMap: Record<string, UserRole> = {
        assigned_to_me: 'assignee',
        created_by_me: 'author',
      };

      return response.data.map((mr) => this.transformMergeRequest(mr, roleMap[scope]));
    } catch (error) {
      console.error('Failed to fetch merge requests:', error);
      return [];
    }
  }

  async getMergeRequestsAsReviewer(): Promise<MergeRequest[]> {
    try {
      // Ensure we have the user ID
      if (!this.currentUserId) {
        await this.validateToken();
      }

      if (!this.currentUserId) {
        console.warn('Could not get current user ID for reviewer MRs');
        return [];
      }

      console.log('Fetching MRs as reviewer for user ID:', this.currentUserId);

      const response = await this.client.get<GitLabMergeRequestResponse[]>('/merge_requests', {
        params: {
          reviewer_id: this.currentUserId,
          scope: 'all',
          state: 'opened',
          per_page: 100,
        },
      });

      console.log('Found', response.data.length, 'MRs as reviewer');

      return response.data.map((mr) => this.transformMergeRequest(mr, 'reviewer'));
    } catch (error) {
      console.error('Failed to fetch merge requests as reviewer:', error);
      return [];
    }
  }

  async getAllMergeRequests(): Promise<MergeRequest[]> {
    const [assigned, reviewRequested, created] = await Promise.all([
      this.getMergeRequests('assigned_to_me'),
      this.getMergeRequestsAsReviewer(),
      this.getMergeRequests('created_by_me'),
    ]);

    // Merge and deduplicate by ID
    const mrMap = new Map<number, MergeRequest>();

    // Priority: reviewer > assignee > author
    created.forEach((mr) => mrMap.set(mr.id, mr));
    assigned.forEach((mr) => mrMap.set(mr.id, mr));
    reviewRequested.forEach((mr) => mrMap.set(mr.id, mr));

    return Array.from(mrMap.values());
  }

  async getUnassignedMergeRequests(projectIds: number[]): Promise<MergeRequest[]> {
    const allMRs: MergeRequest[] = [];

    for (const projectId of projectIds) {
      try {
        const response = await this.client.get<GitLabMergeRequestResponse[]>(
          `/projects/${projectId}/merge_requests`,
          {
            params: {
              state: 'opened',
              reviewer_id: 'None',
              per_page: 50,
            },
          }
        );

        const project = await this.getProject(projectId);

        for (const mr of response.data) {
          // Verify there really is no reviewer
          if (!mr.reviewers || mr.reviewers.length === 0) {
            const transformed = this.transformMergeRequest(mr, 'unassigned');
            if (project) {
              transformed.projectName = project.name;
              transformed.projectPath = project.path_with_namespace;
            }
            allMRs.push(transformed);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch unassigned MRs for project ${projectId}:`, error);
      }
    }

    return allMRs;
  }

  private transformMergeRequest(mr: GitLabMergeRequestResponse, userRole: UserRole): MergeRequest {
    return {
      id: mr.id,
      iid: mr.iid,
      title: mr.title,
      description: mr.description,
      webUrl: mr.web_url,
      projectId: mr.project_id,
      projectName: '', // Sera rempli par getProjectName si besoin
      projectPath: '',
      author: mr.author,
      userRole,
      accountId: this.accountId,
      state: mr.state,
      draft: mr.draft,
      createdAt: mr.created_at,
      updatedAt: mr.updated_at,
      sourceBranch: mr.source_branch,
      targetBranch: mr.target_branch,
      mergeStatus: mr.merge_status,
      hasConflicts: mr.has_conflicts,
      reviewers: mr.reviewers || [],
      assignees: mr.assignees || [],
    };
  }

  async getProject(projectId: number): Promise<GitLabProject | null> {
    try {
      const response = await this.client.get<GitLabProject>(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch project ${projectId}:`, error);
      return null;
    }
  }

  async getPipelines(projectId: number, status?: string): Promise<Pipeline[]> {
    try {
      const params: Record<string, string | number> = {
        per_page: 20,
      };
      if (status) {
        params.status = status;
      }

      const response = await this.client.get<GitLabPipelineResponse[]>(
        `/projects/${projectId}/pipelines`,
        { params }
      );

      const project = await this.getProject(projectId);

      return response.data.map((pipeline) => this.transformPipeline(pipeline, project));
    } catch (error) {
      console.error(`Failed to fetch pipelines for project ${projectId}:`, error);
      return [];
    }
  }

  async getRunningPipelines(projectId: number): Promise<Pipeline[]> {
    return this.getPipelines(projectId, 'running');
  }

  async getAllPipelinesForProjects(projectIds: number[]): Promise<Pipeline[]> {
    const pipelinesPromises = projectIds.map((id) =>
      this.getPipelines(id).catch(() => [])
    );
    const results = await Promise.all(pipelinesPromises);
    return results.flat();
  }

  async getPipelineJobs(projectId: number, pipelineId: number): Promise<PipelineJob[]> {
    try {
      const response = await this.client.get<GitLabJobResponse[]>(
        `/projects/${projectId}/pipelines/${pipelineId}/jobs`,
        { params: { per_page: 100 } }
      );

      return response.data.map((job) => ({
        id: job.id,
        name: job.name,
        stage: job.stage,
        status: job.status,
        webUrl: job.web_url,
        duration: job.duration,
        startedAt: job.started_at,
        finishedAt: job.finished_at,
      }));
    } catch (error) {
      console.error(`Failed to fetch jobs for pipeline ${pipelineId}:`, error);
      return [];
    }
  }

  async getPipelineWithJobs(pipeline: Pipeline): Promise<Pipeline> {
    const [jobs, details] = await Promise.all([
      this.getPipelineJobs(pipeline.projectId, pipeline.id),
      this.getPipelineDetails(pipeline.projectId, pipeline.id),
    ]);
    return {
      ...pipeline,
      jobs,
      user: details?.user,
    };
  }

  async getPipelineDetails(projectId: number, pipelineId: number): Promise<{ user?: { id: number; username: string; name: string; avatar_url: string } } | null> {
    try {
      const response = await this.client.get(`/projects/${projectId}/pipelines/${pipelineId}`);
      return {
        user: response.data.user,
      };
    } catch (error) {
      console.error(`Failed to fetch pipeline details ${pipelineId}:`, error);
      return null;
    }
  }

  async getReleases(projectId: number, limit: number = 5): Promise<Release[]> {
    try {
      const response = await this.client.get<GitLabReleaseResponse[]>(
        `/projects/${projectId}/releases`,
        { params: { per_page: limit, order_by: 'released_at', sort: 'desc' } }
      );

      const project = await this.getProject(projectId);

      return response.data.map((release) => {
        // Generate a unique ID based on projectId and tag_name (simple hash)
        const uniqueKey = `${projectId}-${release.tag_name}`;
        const hash = uniqueKey.split('').reduce((acc, char) => {
          return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0);
        const uniqueId = Math.abs(hash);

        return {
          id: uniqueId,
          tagName: release.tag_name,
          name: release.name || release.tag_name,
          description: release.description || '',
          releasedAt: release.released_at,
          createdAt: release.created_at,
          webUrl: release._links?.self || '',
          projectId,
          projectName: project?.name || '',
          projectPath: project?.path_with_namespace || '',
          author: release.author,
          accountId: this.accountId,
        };
      });
    } catch (error) {
      console.error(`Failed to fetch releases for project ${projectId}:`, error);
      return [];
    }
  }

  async getDeploymentsForTag(projectId: number, tagName: string): Promise<Deployment | undefined> {
    try {
      const response = await this.client.get<GitLabDeploymentResponse[]>(
        `/projects/${projectId}/deployments`,
        {
          params: {
            per_page: 20,
            order_by: 'created_at',
            sort: 'desc',
          },
        }
      );

      // Find a deployment that matches the tag
      const deployment = response.data.find(
        (d) => d.deployable?.ref === tagName && d.deployable?.tag === true
      );

      if (deployment) {
        return {
          id: deployment.id,
          status: deployment.status,
          environment: deployment.environment?.name || 'production',
          deployedAt: deployment.updated_at,
          webUrl: ``, // GitLab n'expose pas directement l'URL du déploiement
        };
      }

      return undefined;
    } catch (error) {
      console.error(`Failed to fetch deployments for tag ${tagName}:`, error);
      return undefined;
    }
  }

  async getReleasesWithDeployments(projectId: number, limit: number = 5): Promise<Release[]> {
    const releases = await this.getReleases(projectId, limit);

    // Fetch deployments for each release
    const releasesWithDeployments = await Promise.all(
      releases.map(async (release) => {
        const deployment = await this.getDeploymentsForTag(projectId, release.tagName);
        return { ...release, deployment };
      })
    );

    return releasesWithDeployments;
  }

  async getRecentActiveProjects(): Promise<GitLabProject[]> {
    try {
      const response = await this.client.get<GitLabProject[]>('/projects', {
        params: {
          membership: true,
          order_by: 'last_activity_at',
          per_page: 50,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recent projects:', error);
      return [];
    }
  }

  async getUserActivePipelines(): Promise<Pipeline[]> {
    try {
      // Fetch recently active projects
      const recentProjects = await this.getRecentActiveProjects();
      console.log(`Found ${recentProjects.length} recent projects`);

      // Fetch running and pending pipelines from these projects
      const pipelinesPromises = recentProjects.map(async (project) => {
        try {
          const [running, pending] = await Promise.all([
            this.client.get<GitLabPipelineResponse[]>(
              `/projects/${project.id}/pipelines`,
              { params: { status: 'running', per_page: 10 } }
            ),
            this.client.get<GitLabPipelineResponse[]>(
              `/projects/${project.id}/pipelines`,
              { params: { status: 'pending', per_page: 10 } }
            ),
          ]);

          const allPipelines = [...running.data, ...pending.data];
          if (allPipelines.length > 0) {
            console.log(`Project ${project.path_with_namespace}: ${allPipelines.length} active pipelines`);
          }
          return allPipelines.map((p) => this.transformPipeline(p, project));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(pipelinesPromises);
      const allPipelines = results.flat();
      console.log(`Total active pipelines found: ${allPipelines.length}`);
      return allPipelines;
    } catch (error) {
      console.error('Failed to fetch user active pipelines:', error);
      return [];
    }
  }

  private transformPipeline(pipeline: GitLabPipelineResponse, project: GitLabProject | null): Pipeline {
    return {
      id: pipeline.id,
      status: pipeline.status,
      ref: pipeline.ref,
      sha: pipeline.sha,
      webUrl: pipeline.web_url,
      projectId: pipeline.project_id,
      projectName: project?.name || '',
      projectPath: project?.path_with_namespace || '',
      accountId: this.accountId,
      createdAt: pipeline.created_at,
      updatedAt: pipeline.updated_at,
      startedAt: pipeline.started_at,
      finishedAt: pipeline.finished_at,
      duration: pipeline.duration,
      source: pipeline.source,
    };
  }

  async searchProjects(query: string): Promise<GitLabProject[]> {
    try {
      const response = await this.client.get<GitLabProject[]>('/projects', {
        params: {
          search: query,
          membership: true,
          per_page: 50,
          order_by: 'last_activity_at',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search projects:', error);
      return [];
    }
  }

  async getGroups(): Promise<GitLabGroup[]> {
    try {
      const response = await this.client.get<GitLabGroup[]>('/groups', {
        params: {
          per_page: 100,
          all_available: false,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      return [];
    }
  }

  async getGroupProjects(groupId: number): Promise<GitLabProject[]> {
    try {
      const response = await this.client.get<GitLabProject[]>(
        `/groups/${groupId}/projects`,
        {
          params: {
            per_page: 100,
            include_subgroups: true,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch projects for group ${groupId}:`, error);
      return [];
    }
  }
}

// Cache of GitLab clients per account
const clientCache = new Map<string, GitLabClient>();

export function getGitLabClient(
  accountId: string,
  instanceUrl: string,
  token: string
): GitLabClient {
  const cacheKey = `${accountId}-${instanceUrl}`;
  let client = clientCache.get(cacheKey);

  if (!client) {
    client = new GitLabClient(instanceUrl, token, accountId);
    clientCache.set(cacheKey, client);
  }

  return client;
}

export function clearClientCache(accountId?: string): void {
  if (accountId) {
    for (const key of clientCache.keys()) {
      if (key.startsWith(accountId)) {
        clientCache.delete(key);
      }
    }
  } else {
    clientCache.clear();
  }
}
