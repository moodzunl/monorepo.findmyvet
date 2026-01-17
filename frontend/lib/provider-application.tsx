import React, { createContext, useContext, useMemo, useState } from 'react';

export type ProviderType = 'vet' | 'clinic';

export type ProviderApplicationDraft = {
  provider_type?: ProviderType;
  data: Record<string, any>;
};

type ProviderApplicationContextValue = {
  draft: ProviderApplicationDraft;
  setProviderType: (t: ProviderType) => void;
  updateData: (patch: Record<string, any>) => void;
  reset: () => void;
};

const ProviderApplicationContext = createContext<ProviderApplicationContextValue | null>(null);

export function ProviderApplicationProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<ProviderApplicationDraft>({ data: {} });

  const value = useMemo<ProviderApplicationContextValue>(() => {
    return {
      draft,
      setProviderType: (t) =>
        setDraft((prev) => ({
          provider_type: t,
          data: prev.data,
        })),
      updateData: (patch) =>
        setDraft((prev) => ({
          provider_type: prev.provider_type,
          data: { ...(prev.data || {}), ...(patch || {}) },
        })),
      reset: () => setDraft({ data: {} }),
    };
  }, [draft]);

  return (
    <ProviderApplicationContext.Provider value={value}>
      {children}
    </ProviderApplicationContext.Provider>
  );
}

export function useProviderApplication() {
  const ctx = useContext(ProviderApplicationContext);
  if (!ctx) {
    throw new Error('useProviderApplication must be used within ProviderApplicationProvider');
  }
  return ctx;
}


