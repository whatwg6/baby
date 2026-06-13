import { useEffect, useRef, useState } from "react";
import type { Child } from "../domain/types";

export type ProfilePageProps = {
  child: Child;
  onSave: (child: Child) => Promise<unknown>;
  onExport: () => Promise<string>;
};

export function ProfilePage({ child, onSave, onExport }: ProfilePageProps) {
  const [draft, setDraft] = useState(child);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const isSavingRef = useRef(false);
  const isExportingRef = useRef(false);

  useEffect(() => {
    setDraft(child);
  }, [child]);

  async function handleSave() {
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setStatus(null);

    try {
      const now = new Date().toISOString();
      await onSave({ ...draft, updatedAt: now });
      setStatus("档案已保存");
    } catch {
      setStatus("档案保存失败，请稍后再试");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  async function handleExport() {
    if (isExportingRef.current) {
      return;
    }

    isExportingRef.current = true;
    setIsExporting(true);
    setStatus(null);

    let url: string | null = null;

    try {
      const json = await onExport();
      const blob = new Blob([json], { type: "application/json" });
      url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "baby-growth-backup.json";
      link.click();
      setStatus("JSON 已导出");
    } catch {
      setStatus("JSON 导出失败，请稍后再试");
    } finally {
      if (url) {
        globalThis.URL.revokeObjectURL(url);
      }
      isExportingRef.current = false;
      setIsExporting(false);
    }
  }

  return (
    <section className="max-w-2xl space-y-5">
      <header className="rounded-card border border-line bg-white p-5 shadow-panel">
        <p className="text-sm text-muted">宝宝信息与备份</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">宝宝档案</h2>
        <p className="mt-2 text-sm leading-6 text-muted">维护基础信息，或导出一份本地 JSON 备份。</p>
      </header>

      <div className="rounded-card border border-line bg-white p-4 shadow-panel sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-ink">
            昵称
            <input
              className="min-h-11 rounded-card border border-line px-3 py-2 text-ink shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-ink">
            生日
            <input
              type="date"
              className="min-h-11 rounded-card border border-line px-3 py-2 text-ink shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={draft.birthday}
              onChange={(event) => setDraft((current) => ({ ...current, birthday: event.target.value }))}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-primary/90"
          >
            {isSaving ? "保存中..." : "保存档案"}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-card border border-line bg-white px-4 py-2 text-sm font-semibold text-muted shadow-sm transition hover:border-primary/50 hover:text-primary"
          >
            {isExporting ? "导出中..." : "导出 JSON"}
          </button>
        </div>

        {status ? (
          <p className="mt-3 rounded-card border border-line bg-mist p-3 text-sm text-muted" role="status">
            {status}
          </p>
        ) : null}
      </div>
    </section>
  );
}
