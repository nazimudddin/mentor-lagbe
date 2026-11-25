"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { getSavedTuitions } from "@/lib/action";
import { removeSavedTuition, saveTuition } from "@/lib/mutation";

type SavedTuitionsContextValue = {
  enabled: boolean;
  savedIds: ReadonlySet<string>;
  isSaved: (tuitionId: string) => boolean;
  isSaving: (tuitionId: string) => boolean;
  toggleSaved: (tuitionId: string, tuitionTitle?: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const SavedTuitionsContext = createContext<SavedTuitionsContextValue>({
  enabled: false,
  savedIds: new Set<string>(),
  isSaved: () => false,
  isSaving: () => false,
  toggleSaved: async () => {},
  refresh: async () => {},
});

export function useSavedTuitions() {
  return useContext(SavedTuitionsContext);
}

export function SavedTuitionsProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const saved = await getSavedTuitions();
      setSavedIds(new Set(saved.map((tuition) => tuition.id)));
    } catch {
      // The Saved Tuitions page surfaces its own load error; a background
      // refresh failure should not interrupt the rest of the dashboard.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSaved = async () => {
      try {
        const saved = await getSavedTuitions();
        if (!cancelled) {
          setSavedIds(new Set(saved.map((tuition) => tuition.id)));
        }
      } catch {
        // The Saved Tuitions page surfaces its own load error; a background
        // refresh failure should not interrupt the rest of the dashboard.
      }
    };

    void loadSaved();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSaved = useCallback(
    async (tuitionId: string, tuitionTitle?: string) => {
      if (!tuitionId) return;

      const wasSaved = savedIds.has(tuitionId);

      setPendingIds((current) => new Set(current).add(tuitionId));
      setSavedIds((current) => {
        const next = new Set(current);
        if (wasSaved) next.delete(tuitionId);
        else next.add(tuitionId);
        return next;
      });

      try {
        if (wasSaved) {
          await removeSavedTuition(tuitionId);
          toast.success(
            tuitionTitle
              ? `Removed "${tuitionTitle}" from saved tuitions.`
              : "Removed from saved tuitions."
          );
        } else {
          await saveTuition(tuitionId);
          toast.success(
            tuitionTitle
              ? `Saved "${tuitionTitle}".`
              : "Tuition saved."
          );
        }
      } catch (error) {
        // Revert the optimistic change.
        setSavedIds((current) => {
          const next = new Set(current);
          if (wasSaved) next.add(tuitionId);
          else next.delete(tuitionId);
          return next;
        });

        toast.error(
          error instanceof Error
            ? error.message
            : wasSaved
              ? "Failed to remove saved tuition."
              : "Failed to save tuition."
        );
      } finally {
        setPendingIds((current) => {
          const next = new Set(current);
          next.delete(tuitionId);
          return next;
        });
      }
    },
    [savedIds]
  );

  const value = useMemo<SavedTuitionsContextValue>(
    () => ({
      enabled: true,
      savedIds,
      isSaved: (tuitionId: string) => savedIds.has(tuitionId),
      isSaving: (tuitionId: string) => pendingIds.has(tuitionId),
      toggleSaved,
      refresh,
    }),
    [savedIds, pendingIds, toggleSaved, refresh]
  );

  return (
    <SavedTuitionsContext.Provider value={value}>
      {children}
    </SavedTuitionsContext.Provider>
  );
}
