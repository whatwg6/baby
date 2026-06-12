import { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { RecordComposer } from "./components/records/RecordComposer";
import type { RecordDraft, RecordType } from "./domain/types";
import { HomePage } from "./pages/HomePage";
import { TimelinePage } from "./pages/TimelinePage";
import { useBabyApp } from "./state/useBabyApp";

export default function App() {
  const app = useBabyApp();
  const [composerType, setComposerType] = useState<RecordType | null>(null);

  function handleViewChange(view: typeof app.activeView) {
    setComposerType(null);
    app.setActiveView(view);
  }

  async function handleSaveRecord(draft: RecordDraft) {
    const createdRecord = await app.createRecord(draft);

    if (createdRecord) {
      setComposerType(null);
    }
  }

  function renderActiveView() {
    if (app.isLoading || !app.child) {
      return (
        <section className="rounded-card border border-line bg-white p-5 shadow-sm">
          <p className="text-sm text-muted">成长记录</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">宝宝成长记录</h2>
        </section>
      );
    }

    if (composerType) {
      return (
        <RecordComposer
          childId={app.child.id}
          initialType={composerType}
          onCancel={() => setComposerType(null)}
          onSave={handleSaveRecord}
        />
      );
    }

    if (app.activeView === "home") {
      return <HomePage records={app.records} onStartRecord={setComposerType} />;
    }

    if (app.activeView === "timeline") {
      return <TimelinePage records={app.visibleRecords} filter={app.filter} onFilterChange={app.setFilter} />;
    }

    return (
      <section className="rounded-card border border-line bg-white p-5 shadow-sm">
        <p className="text-sm text-muted">{app.activeView === "data" ? "数据" : "资料"}</p>
        <h2 className="mt-2 text-xl font-semibold text-ink">{app.activeView === "data" ? "数据视图" : "宝宝资料"}</h2>
      </section>
    );
  }

  return (
    <AppShell activeView={app.activeView} onViewChange={handleViewChange} child={app.child}>
      {app.error ? (
        <p className="mb-4 rounded-card border border-danger/30 bg-white p-3 text-sm text-danger" role="alert">
          {app.error}
        </p>
      ) : null}
      {renderActiveView()}
    </AppShell>
  );
}
