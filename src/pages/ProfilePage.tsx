import { useEffect, useState } from "react";
import type { Child } from "../domain/types";

export type ProfilePageProps = {
  child: Child;
  onSave: (child: Child) => Promise<unknown>;
  onExport: () => Promise<string>;
};

export function ProfilePage({ child, onSave, onExport }: ProfilePageProps) {
  const [draft, setDraft] = useState(child);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setDraft(child);
  }, [child]);

  async function handleSave() {
    const now = new Date().toISOString();
    await onSave({ ...draft, updatedAt: now });
    setStatus("档案已保存");
  }

  async function handleExport() {
    const json = await onExport();
    const blob = new Blob([json], { type: "application/json" });
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "baby-growth-backup.json";
    link.click();
    globalThis.URL.revokeObjectURL(url);
    setStatus("JSON 已导出");
  }

  return (
    <section className="max-w-2xl space-y-5">
      <header>
        <p className="text-sm text-muted">宝宝信息与备份</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">宝宝档案</h2>
      </header>

      <div className="rounded-card border border-line bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-ink">
            昵称
            <input
              className="min-h-11 rounded-card border border-line px-3 py-2 text-ink outline-none focus:border-primary"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-ink">
            生日
            <input
              type="date"
              className="min-h-11 rounded-card border border-line px-3 py-2 text-ink outline-none focus:border-primary"
              value={draft.birthday}
              onChange={(event) => setDraft((current) => ({ ...current, birthday: event.target.value }))}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            保存档案
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-card border border-line px-4 py-2 text-sm font-semibold text-muted transition hover:border-primary/50 hover:text-primary"
          >
            导出 JSON
          </button>
        </div>

        {status ? (
          <p className="mt-3 rounded-card bg-cream p-3 text-sm text-muted" role="status">
            {status}
          </p>
        ) : null}
      </div>
    </section>
  );
}
