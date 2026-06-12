import { useCallback, useEffect, useMemo, useState } from "react";
import type { BabyRecord, Child, RecordDraft, RecordType, ViewKey } from "../domain/types";
import { validateDraft } from "../services/recordService";
import { createRepository, type Repository } from "../storage/repository";

export type RecordFilter = RecordType | "all";

export type UseBabyAppOptions = {
  repository?: Repository;
};

export type UseBabyAppState = {
  activeView: ViewKey;
  child: Child | null;
  records: BabyRecord[];
  visibleRecords: BabyRecord[];
  filter: RecordFilter;
  error: string | null;
  isLoading: boolean;
  setActiveView: (view: ViewKey) => void;
  setFilter: (filter: RecordFilter) => void;
  createRecord: <T extends RecordType>(draft: RecordDraft<T>) => Promise<BabyRecord<T> | null>;
  updateChild: (child: Child) => Promise<Child>;
  exportJson: () => Promise<string>;
};

const defaultRepository = createRepository();

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "操作失败，请稍后再试";
}

export function useBabyApp(options: UseBabyAppOptions = {}): UseBabyAppState {
  const repository = options.repository ?? defaultRepository;
  const [activeView, setActiveView] = useState<ViewKey>("home");
  const [child, setChild] = useState<Child | null>(null);
  const [records, setRecords] = useState<BabyRecord[]>([]);
  const [filter, setFilter] = useState<RecordFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadRecords = useCallback(
    async (activeChild: Child) => {
      const loadedRecords = await repository.listRecords({ childId: activeChild.id });
      setRecords(loadedRecords);

      return loadedRecords;
    },
    [repository],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadInitialState() {
      setIsLoading(true);
      setError(null);

      try {
        const loadedChild = await repository.ensureDefaultChild();
        const loadedRecords = await repository.listRecords({ childId: loadedChild.id });

        if (isMounted) {
          setChild(loadedChild);
          setRecords(loadedRecords);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(toErrorMessage(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialState();

    return () => {
      isMounted = false;
    };
  }, [repository]);

  const visibleRecords = useMemo(() => {
    if (filter === "all") {
      return records;
    }

    return records.filter((record) => record.type === filter);
  }, [filter, records]);

  const createRecord = useCallback(
    async <T extends RecordType>(draft: RecordDraft<T>): Promise<BabyRecord<T> | null> => {
      const validationErrors = validateDraft(draft);

      if (validationErrors.length > 0) {
        setError(validationErrors[0]);
        return null;
      }

      setError(null);

      try {
        const createdRecord = await repository.createRecord(draft);
        const activeChild = child ?? (await repository.ensureDefaultChild());

        if (!child) {
          setChild(activeChild);
        }

        await loadRecords(activeChild);

        return createdRecord;
      } catch (createError) {
        setError(toErrorMessage(createError));
        return null;
      }
    },
    [child, loadRecords, repository],
  );

  const persistChild = useCallback(
    async (updatedChild: Child) => {
      setError(null);

      try {
        const persistedChild = await repository.updateChild(updatedChild);
        setChild(persistedChild);
        await loadRecords(persistedChild);

        return persistedChild;
      } catch (updateError) {
        setError(toErrorMessage(updateError));
        throw updateError;
      }
    },
    [loadRecords, repository],
  );

  const exportJson = useCallback(async () => {
    const exportedData = await repository.exportAll();

    return JSON.stringify(exportedData, null, 2);
  }, [repository]);

  return {
    activeView,
    child,
    records,
    visibleRecords,
    filter,
    error,
    isLoading,
    setActiveView,
    setFilter,
    createRecord,
    updateChild: persistChild,
    exportJson,
  };
}
