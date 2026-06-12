import { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { RecordComposer } from "./components/records/RecordComposer";
import type { RecordDraft, RecordType } from "./domain/types";
import { DataPage } from "./pages/DataPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
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

    if (app.activeView === "data") {
      return <DataPage records={app.records} />;
    }

    if (app.activeView === "profile") {
      return <ProfilePage child={app.child} onSave={app.updateChild} onExport={app.exportJson} />;
    }

    return null;
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
