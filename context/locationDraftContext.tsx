import React, { createContext, useContext, useMemo, useState } from 'react';
import { Coordinates } from '@/lib/location/distance';

export interface LocationDraft {
  name:        string;
  address:     string;
  coordinates: Coordinates;
}

interface LocationDraftContextType {
  draft: LocationDraft | null;
  setDraft: (draft: LocationDraft) => void;
  clearDraft: () => void;
}

const LocationDraftContext = createContext<LocationDraftContextType | undefined>(undefined);

/**
 * Hands a chosen location from the picker back to the add-reminder screen.
 *
 * This replaces `router.back()` followed by `router.setParams()`. That pattern
 * was a race: setParams applies to whichever route is current when it runs, and
 * `back()` had already been called, so the values could land on the wrong route
 * or arrive after the destination had read its params.
 */
export function LocationDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraftState] = useState<LocationDraft | null>(null);

  const value = useMemo(
    () => ({
      draft,
      setDraft: (next: LocationDraft) => setDraftState(next),
      clearDraft: () => setDraftState(null),
    }),
    [draft]
  );

  return (
    <LocationDraftContext.Provider value={value}>
      {children}
    </LocationDraftContext.Provider>
  );
}

export function useLocationDraft() {
  const ctx = useContext(LocationDraftContext);
  if (!ctx) throw new Error('useLocationDraft must be used inside LocationDraftProvider');
  return ctx;
}
