import { AppShell } from "./components/layout/AppShell";
import { useBabyApp } from "./state/useBabyApp";

export default function App() {
  const app = useBabyApp();

  return (
    <AppShell activeView={app.activeView} onViewChange={app.setActiveView} child={app.child}>
      <section className="rounded-card border border-line bg-white p-5 shadow-sm">
        <p className="text-sm text-muted">成长记录</p>
        <h2 className="mt-2 text-xl font-semibold text-ink">宝宝成长记录</h2>
        {app.isLoading ? <p className="mt-3 text-sm text-muted">正在准备成长记录...</p> : null}
        {app.error ? <p className="mt-3 text-sm text-danger">{app.error}</p> : null}
      </section>
    </AppShell>
  );
}
