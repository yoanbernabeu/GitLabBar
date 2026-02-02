import { useState, useEffect, useCallback } from 'react';
import { MergeRequest, Pipeline } from '../../shared/types';

interface PollingData {
  mergeRequests: MergeRequest[];
  pipelines: Pipeline[];
  lastUpdated: Date;
  status: 'green' | 'orange' | 'red' | 'gray';
  error?: string;
}

interface UseGitLabDataResult {
  mergeRequests: MergeRequest[];
  pipelines: Pipeline[];
  lastUpdated: Date | null;
  status: string;
  error: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useGitLabData(): UseGitLabDataResult {
  const [mergeRequests, setMergeRequests] = useState<MergeRequest[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [status, setStatus] = useState<string>('gray');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateFromData = useCallback((data: PollingData) => {
    setMergeRequests(data.mergeRequests);
    setPipelines(data.pipelines);
    setLastUpdated(new Date(data.lastUpdated));
    setStatus(data.status);
    setError(data.error || null);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await window.gitlabbar.gitlab.refresh();
      updateFromData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du rafraîchissement');
    } finally {
      setIsLoading(false);
    }
  }, [updateFromData]);

  useEffect(() => {
    // Charger les données initiales
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [mrs, pipes] = await Promise.all([
          window.gitlabbar.gitlab.getMRs(),
          window.gitlabbar.gitlab.getPipelines(),
        ]);
        setMergeRequests(mrs);
        setPipelines(pipes);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();

    // S'abonner aux mises à jour
    const unsubscribe = window.gitlabbar.on.dataUpdated(updateFromData);

    return () => {
      unsubscribe();
    };
  }, [updateFromData]);

  return {
    mergeRequests,
    pipelines,
    lastUpdated,
    status,
    error,
    isLoading,
    refresh,
  };
}

// Grouper les MRs par rôle
export function groupMergeRequestsByRole(mergeRequests: MergeRequest[]) {
  const groups = {
    reviewer: [] as MergeRequest[],
    assignee: [] as MergeRequest[],
    author: [] as MergeRequest[],
    mentioned: [] as MergeRequest[],
  };

  for (const mr of mergeRequests) {
    if (groups[mr.userRole]) {
      groups[mr.userRole].push(mr);
    }
  }

  return groups;
}
