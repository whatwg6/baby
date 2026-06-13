import type { ReactNode } from "react";
import type { Child, ViewKey } from "../../domain/types";
import { ChildSummary } from "./ChildSummary";
import { Navigation } from "./Navigation";

export type AppShellProps = {
  activeView: ViewKey;
  onViewChange: (view: ViewKey) => void;
  child: Child | null;
  children: ReactNode;
};

export function AppShell({ activeView, onViewChange, child, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-transparent text-ink md:flex">
      <Navigation activeView={activeView} onViewChange={onViewChange} />
      <div className="min-w-0 flex-1 pb-24 md:pb-0">
        <ChildSummary child={child} />
        <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
