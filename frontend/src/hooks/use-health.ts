'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { HealthCheckResponse } from '../types';

export function useHealth(autoRefreshIntervalMs: number = 10000) {
  const [data, setData] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.getHealth();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao obter status de saúde do sistema');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const runFetch = async () => {
      try {
        const res = await apiClient.getHealth();
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Falha ao obter status de saúde do sistema');
          setLoading(false);
        }
      }
    };

    runFetch();

    if (autoRefreshIntervalMs > 0) {
      const interval = setInterval(runFetch, autoRefreshIntervalMs);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [autoRefreshIntervalMs]);

  return { data, loading, error, refetch: fetchHealth };
}
