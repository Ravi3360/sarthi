import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import * as workersService from '@/services/workers';
import type { WorkerProfile } from '@/types/worker';

interface WorkerContextValue {
  worker: WorkerProfile | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  updateWorker: (patch: (draft: WorkerProfile) => WorkerProfile) => Promise<void>;
}

const WorkerContext = createContext<WorkerContextValue | undefined>(undefined);

export function WorkerProvider({ children }: { children: React.ReactNode }) {
  const { uid, mobile } = useAuth();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!uid) {
      setWorker(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const record = await workersService.ensureWorker(uid, mobile ?? '');
      setWorker(record);
    } catch (e) {
      setError('कुछ गड़बड़ हो गई');
    } finally {
      setIsLoading(false);
    }
  }, [uid, mobile]);

  useEffect(() => {
    load();
  }, [load]);

  const updateWorker = useCallback(
    async (patch: (draft: WorkerProfile) => WorkerProfile) => {
      if (!worker) return;
      const draft = patch(worker);
      const saved = await workersService.saveWorker(draft);
      setWorker(saved);
    },
    [worker],
  );

  const value = useMemo<WorkerContextValue>(
    () => ({ worker, isLoading, error, reload: load, updateWorker }),
    [worker, isLoading, error, load, updateWorker],
  );

  return <WorkerContext.Provider value={value}>{children}</WorkerContext.Provider>;
}

export function useWorker(): WorkerContextValue {
  const ctx = useContext(WorkerContext);
  if (!ctx) throw new Error('useWorker must be used within WorkerProvider');
  return ctx;
}
