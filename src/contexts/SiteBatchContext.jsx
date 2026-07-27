import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  normalizeSiteBatch,
  readStoredSiteBatch,
  SITE_BATCH_OPTIONS,
  writeStoredSiteBatch,
} from '../lib/domain/siteBatches';

const SiteBatchContext = createContext(null);

export function SiteBatchProvider({ children }) {
  const [siteBatch, setSiteBatchState] = useState(readStoredSiteBatch);
  const [batchCounts, setBatchCounts] = useState(null);

  const setSiteBatch = useCallback((batch) => {
    const normalized = normalizeSiteBatch(batch);
    setSiteBatchState(normalized);
    writeStoredSiteBatch(normalized);
  }, []);

  const value = useMemo(
    () => ({
      siteBatch,
      setSiteBatch,
      batches: SITE_BATCH_OPTIONS,
      batchCounts,
      setBatchCounts,
    }),
    [siteBatch, setSiteBatch, batchCounts],
  );

  return <SiteBatchContext.Provider value={value}>{children}</SiteBatchContext.Provider>;
}

export function useSiteBatch() {
  const ctx = useContext(SiteBatchContext);
  if (!ctx) throw new Error('useSiteBatch must be used within SiteBatchProvider');
  return ctx;
}
