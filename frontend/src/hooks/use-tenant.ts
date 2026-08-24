'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { UserSessionData } from '../types';

export function useTenant(initialEmpresaId?: string) {
  const [session, setSession] = useState<UserSessionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEmpresaId, setActiveEmpresaId] = useState<string>(
    initialEmpresaId || '11111111-1111-1111-1111-111111111111'
  );

  const fetchSession = useCallback(async (empresaId: string) => {
    try {
      setLoading(true);
      setError(null);
      apiClient.setTenant(empresaId);
      const data = await apiClient.getCurrentSession();
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao sincronizar contexto');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const runSync = async () => {
      try {
        apiClient.setTenant(activeEmpresaId);
        const data = await apiClient.getCurrentSession();
        if (isMounted) {
          setSession(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Falha ao sincronizar contexto');
          setLoading(false);
        }
      }
    };

    runSync();

    return () => {
      isMounted = false;
    };
  }, [activeEmpresaId]);

  const switchCompany = (empresaId: string) => {
    setActiveEmpresaId(empresaId);
  };

  return {
    session,
    activeEmpresaId,
    switchCompany,
    loading,
    error,
    refetch: () => fetchSession(activeEmpresaId),
  };
}
