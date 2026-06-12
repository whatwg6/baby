import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const isMountedRef = useRef(true);
  const recordsRequestRef = useRef(0);
  const activeChildIdRef = useRef<string | null>(null);

  const loadRecords = useCallback(
    async (childId: string) => {
      const requestId = recordsRequestRef.current + 1;
      recordsRequestRef.current = requestId;
      const loadedRecords = await repository.listRecords({ childId });

      if (
        isMountedRef.current &&
        requestId === recordsRequestRef.current &&
        childId === activeChildIdRef.current
      ) {
        setRecords(loadedRecords);
      }

      return loadedRecords;
    },
    [repository],
  );

  useEffect(() => {
    isMountedRef.current = true;

    async function loadInitialState() {
      setIsLoading(true);
      setError(null);

      try {
        const loadedChild = await repository.ensureDefaultChild();
        activeChildIdRef.current = loadedChild.id;
        await loadRecords(loadedChild.id);

        if (isMountedRef.current) {
          setChild(loadedChild);
        }
      } catch (loadError) {
        if (isMountedRef.current) {
          setError(toErrorMessage(loadError));
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialState();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadRecords, repository]);

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
        if (isMountedRef.current) {
          setError(validationErrors[0]);
        }
        return null;
      }

      const activeChild = child ?? (await repository.ensureDefaultChild());

      if (draft.childId !== activeChild.id) {
        if (isMountedRef.current) {
          setError("记录不属于当前宝宝");
        }
        return null;
      }

      if (isMountedRef.current) {
        setError(null);
      }

      try {
        const createdRecord = await repository.createRecord(draft);

        if (isMountedRef.current && !child) {
          setChild(activeChild);
        }

        await loadRecords(activeChild.id);

        return createdRecord;
      } catch (createError) {
        if (isMountedRef.current) {
          setError(toErrorMessage(createError));
        }
        return null;
      }
    },
    [child, loadRecords, repository],
  );

  const persistChild = useCallback(
    async (updatedChild: Child) => {
      if (isMountedRef.current) {
        setError(null);
      }

      try {
        const persistedChild = await repository.updateChild(updatedChild);
        if (isMountedRef.current) {
          activeChildIdRef.current = persistedChild.id;
          setChild(persistedChild);
        }
        await loadRecords(persistedChild.id);

        return persistedChild;
      } catch (updateError) {
        if (isMountedRef.current) {
          setError(toErrorMessage(updateError));
        }
        throw updateError;
      }
    },
    [loadRecords, repository],
  );

  const exportJson = useCallback(async () => {
    if (isMountedRef.current) {
      setError(null);
    }

    try {
      const exportedData = await repository.exportAll();

      return JSON.stringify(exportedData, null, 2);
    } catch (exportError) {
      if (isMountedRef.current) {
        setError(toErrorMessage(exportError));
      }
      throw exportError;
    }
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
