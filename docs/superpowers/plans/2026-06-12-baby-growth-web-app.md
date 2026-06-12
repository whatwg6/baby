# Baby Growth Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete local-first baby growth record MVP with React, TypeScript, Vite, Tailwind CSS, IndexedDB persistence, Chinese UI, and responsive app navigation.

**Architecture:** The app is a client-only React application. UI pages call service modules, services call repository modules, and repositories are the only code that touches IndexedDB. Record types share a common `BabyRecord` envelope with type-specific payloads, so future cloud sync and multi-child support can reuse the same boundary.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Vitest, Testing Library, IndexedDB, lucide-react, Recharts.

---

## File Structure

- Create `package.json`: scripts and dependencies.
- Create `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`: app tooling.
- Create `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`: app entry and Tailwind global styles.
- Create `src/domain/types.ts`: shared `Child`, `BabyRecord`, payload, navigation, and form types.
- Create `src/domain/recordMeta.ts`: Chinese labels, icons, colors, and helper metadata for each record type.
- Create `src/lib/date.ts`: date, age, duration, and grouping utilities.
- Create `src/storage/indexedDb.ts`: low-level IndexedDB setup and transaction helpers.
- Create `src/storage/repository.ts`: child, record, and media persistence methods.
- Create `src/services/childService.ts`, `src/services/recordService.ts`, `src/services/mediaService.ts`, `src/services/exportService.ts`: business logic and derived data.
- Create `src/state/useBabyApp.ts`: app-level React state hook for loading child, records, filters, and mutations.
- Create `src/components/layout/AppShell.tsx`, `Navigation.tsx`, `ChildSummary.tsx`: responsive shell.
- Create `src/components/records/RecordCard.tsx`, `RecordFilters.tsx`, `RecordComposer.tsx`: record display, filtering, and composer form.
- Create `src/pages/HomePage.tsx`, `TimelinePage.tsx`, `DataPage.tsx`, `ProfilePage.tsx`: primary views.
- Create `src/components/data/GrowthChart.tsx`, `SleepSummary.tsx`, `VaccineList.tsx`: data panels.
- Create tests next to implementation as `*.test.ts` or `*.test.tsx`.

## Task 1: Scaffold React, TypeScript, Tailwind, And Tests

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `src/vite-env.d.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create package metadata and scripts**

Create `package.json`:

```json
{
  "name": "baby-growth-web-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "verify": "npm run build && npm run test"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "lucide-react": "^0.468.0",
    "recharts": "^2.15.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@typescript-eslint/eslint-plugin": "^8.19.0",
    "@typescript-eslint/parser": "^8.19.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.17.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2",
    "vite": "^6.0.5",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Add Vite and TypeScript config**

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
  },
});
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "tailwind.config.ts"]
}
```

- [ ] **Step 3: Add Tailwind config and global CSS**

Create `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F2",
        primary: "#4E9F8F",
        coral: "#E98B7C",
        dataBlue: "#5B8DEF",
        dataYellow: "#E8B84A",
        ink: "#25332F",
        muted: "#6F7C76",
        line: "#E7DDD2",
        success: "#4E9F70",
        warning: "#D99A2B",
        danger: "#D95C5C",
      },
      borderRadius: {
        card: "8px",
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "SF Pro Text", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

Create `postcss.config.js`:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Create `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color: #25332f;
  background: #faf7f2;
  font-family: Inter, "SF Pro Display", "SF Pro Text", system-ui, sans-serif;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: #faf7f2;
}

button,
input,
textarea,
select {
  font: inherit;
}
```

- [ ] **Step 4: Add app entry files**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>成长记录</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-6">
        <section className="rounded-card border border-line bg-white p-6 shadow-sm">
          <p className="text-sm text-muted">成长记录</p>
          <h1 className="mt-2 text-2xl font-semibold">宝宝成长记录</h1>
        </section>
      </div>
    </main>
  );
}
```

Create `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and dependencies are installed.

- [ ] **Step 6: Verify scaffold**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json tailwind.config.ts postcss.config.js src
git commit -m "chore: scaffold baby growth web app"
```

## Task 2: Define Domain Types, Metadata, And Date Utilities

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/recordMeta.ts`
- Create: `src/lib/date.ts`
- Create: `src/lib/date.test.ts`

- [ ] **Step 1: Write date utility tests**

Create `src/lib/date.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateAgeText, formatDateLabel, groupRecordsByDay, minutesBetween } from "./date";
import type { BabyRecord } from "../domain/types";

describe("date utilities", () => {
  it("formats a Chinese age label", () => {
    expect(calculateAgeText("2025-06-12", new Date("2026-08-20T00:00:00"))).toBe("1岁2个月");
  });

  it("formats a Chinese date label", () => {
    expect(formatDateLabel("2026-06-12T08:30:00.000Z")).toContain("2026");
  });

  it("calculates minute duration", () => {
    expect(minutesBetween("2026-06-12T10:00", "2026-06-12T11:45")).toBe(105);
  });

  it("groups records by local day in descending order", () => {
    const records = [
      { id: "1", childId: "c1", type: "journal", occurredAt: "2026-06-11T10:00", payload: { body: "a" }, createdAt: "", updatedAt: "" },
      { id: "2", childId: "c1", type: "sleep", occurredAt: "2026-06-12T09:00", payload: { startTime: "", endTime: "" }, createdAt: "", updatedAt: "" },
    ] satisfies BabyRecord[];

    expect(groupRecordsByDay(records).map((group) => group.date)).toEqual(["2026-06-12", "2026-06-11"]);
  });
});
```

- [ ] **Step 2: Run date tests to verify they fail**

Run: `npm run test -- src/lib/date.test.ts`

Expected: FAIL because `src/lib/date.ts` does not exist.

- [ ] **Step 3: Add domain types**

Create `src/domain/types.ts`:

```ts
export type RecordType = "journal" | "photo" | "growth" | "vaccine" | "sleep" | "milestone";

export type ViewKey = "home" | "timeline" | "data" | "profile";

export type Child = {
  id: string;
  name: string;
  birthday: string;
  avatarUrl?: string;
  sex?: "female" | "male" | "unspecified";
  createdAt: string;
  updatedAt: string;
};

export type JournalPayload = { body: string };
export type PhotoPayload = { caption?: string; mediaId: string };
export type GrowthPayload = { heightCm?: number; weightKg?: number; headCircumferenceCm?: number };
export type SleepPayload = { startTime: string; endTime: string; quality?: "good" | "normal" | "restless"; note?: string };
export type VaccinePayload = { vaccineName: string; dose?: string; scheduledDate?: string; completedDate?: string; location?: string };
export type MilestonePayload = { category: string; description: string };

export type PayloadByType = {
  journal: JournalPayload;
  photo: PhotoPayload;
  growth: GrowthPayload;
  vaccine: VaccinePayload;
  sleep: SleepPayload;
  milestone: MilestonePayload;
};

export type BabyRecord<T extends RecordType = RecordType> = {
  id: string;
  childId: string;
  type: T;
  occurredAt: string;
  title?: string;
  note?: string;
  mediaIds?: string[];
  payload: PayloadByType[T];
  createdAt: string;
  updatedAt: string;
};

export type MediaAsset = {
  id: string;
  childId: string;
  kind: "image";
  blob: Blob;
  createdAt: string;
};

export type RecordDraft<T extends RecordType = RecordType> = {
  type: T;
  childId: string;
  occurredAt: string;
  title?: string;
  note?: string;
  mediaIds?: string[];
  payload: PayloadByType[T];
};
```

- [ ] **Step 4: Add record metadata**

Create `src/domain/recordMeta.ts`:

```ts
import { Baby, Camera, HeartPulse, Moon, NotebookPen, Ruler, Syringe } from "lucide-react";
import type { RecordType } from "./types";

export const recordTypeOrder: RecordType[] = ["journal", "photo", "growth", "sleep", "vaccine", "milestone"];

export const recordMeta = {
  journal: { label: "日记", actionLabel: "写日记", icon: NotebookPen, colorClass: "text-primary", bgClass: "bg-primary/10" },
  photo: { label: "照片", actionLabel: "传照片", icon: Camera, colorClass: "text-coral", bgClass: "bg-coral/10" },
  growth: { label: "身高体重", actionLabel: "记身高体重", icon: Ruler, colorClass: "text-dataBlue", bgClass: "bg-dataBlue/10" },
  sleep: { label: "睡眠", actionLabel: "记睡眠", icon: Moon, colorClass: "text-ink", bgClass: "bg-ink/10" },
  vaccine: { label: "疫苗", actionLabel: "记疫苗", icon: Syringe, colorClass: "text-success", bgClass: "bg-success/10" },
  milestone: { label: "里程碑", actionLabel: "加里程碑", icon: Baby, colorClass: "text-warning", bgClass: "bg-warning/10" },
} as const satisfies Record<RecordType, {
  label: string;
  actionLabel: string;
  icon: typeof HeartPulse;
  colorClass: string;
  bgClass: string;
}>;
```

- [ ] **Step 5: Add date utilities**

Create `src/lib/date.ts`:

```ts
import type { BabyRecord } from "../domain/types";

export function calculateAgeText(birthday: string, now = new Date()): string {
  const birth = new Date(`${birthday}T00:00:00`);
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years <= 0 && months <= 0) return "未满1个月";
  if (years <= 0) return `${months}个月`;
  return months > 0 ? `${years}岁${months}个月` : `${years}岁`;
}

export function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(new Date(value));
}

export function formatTimeLabel(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function toDayKey(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function minutesBetween(startTime: string, endTime: string): number {
  return Math.max(0, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000));
}

export function groupRecordsByDay(records: BabyRecord[]): Array<{ date: string; records: BabyRecord[] }> {
  const groups = new Map<string, BabyRecord[]>();
  for (const record of records) {
    const key = toDayKey(record.occurredAt);
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, groupedRecords]) => ({
      date,
      records: groupedRecords.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()),
    }));
}
```

- [ ] **Step 6: Run tests**

Run: `npm run test -- src/lib/date.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain src/lib
git commit -m "feat: add baby growth domain model"
```

## Task 3: Implement IndexedDB Repository

**Files:**
- Create: `src/storage/indexedDb.ts`
- Create: `src/storage/repository.ts`
- Create: `src/storage/repository.test.ts`

- [ ] **Step 1: Write repository tests**

Create `src/storage/repository.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createRepository } from "./repository";

describe("repository", () => {
  beforeEach(() => indexedDB.deleteDatabase("baby-growth-test"));

  it("creates a default child once", async () => {
    const repo = createRepository("baby-growth-test");
    const child = await repo.ensureDefaultChild();
    const again = await repo.ensureDefaultChild();
    expect(child.id).toBe(again.id);
    expect(child.name).toBe("宝宝");
  });

  it("creates and lists records by child and type", async () => {
    const repo = createRepository("baby-growth-test");
    const child = await repo.ensureDefaultChild();
    await repo.createRecord({ childId: child.id, type: "journal", occurredAt: "2026-06-12T10:00", payload: { body: "今天会笑了" } });
    await repo.createRecord({ childId: child.id, type: "growth", occurredAt: "2026-06-11T10:00", payload: { heightCm: 72 } });

    expect(await repo.listRecords({ childId: child.id })).toHaveLength(2);
    expect(await repo.listRecords({ childId: child.id, type: "journal" })).toHaveLength(1);
  });

  it("updates and deletes records", async () => {
    const repo = createRepository("baby-growth-test");
    const child = await repo.ensureDefaultChild();
    const record = await repo.createRecord({ childId: child.id, type: "milestone", occurredAt: "2026-06-12T10:00", payload: { category: "动作", description: "第一次站起来" } });
    const updated = await repo.updateRecord(record.id, { title: "站起来了" });
    expect(updated.title).toBe("站起来了");
    await repo.deleteRecord(record.id);
    expect(await repo.listRecords({ childId: child.id })).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run repository tests to verify they fail**

Run: `npm run test -- src/storage/repository.test.ts`

Expected: FAIL because repository files do not exist.

- [ ] **Step 3: Add IndexedDB helper**

Create `src/storage/indexedDb.ts`:

```ts
export const DB_VERSION = 1;

export type StoreName = "children" | "records" | "media";

export function openDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("children")) db.createObjectStore("children", { keyPath: "id" });
      if (!db.objectStoreNames.contains("records")) {
        const store = db.createObjectStore("records", { keyPath: "id" });
        store.createIndex("childId", "childId");
        store.createIndex("type", "type");
        store.createIndex("occurredAt", "occurredAt");
      }
      if (!db.objectStoreNames.contains("media")) db.createObjectStore("media", { keyPath: "id" });
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function withStore<T>(
  dbName: string,
  storeName: StoreName,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T> | Promise<IDBRequest<T>>,
): Promise<T> {
  const db = await openDatabase(dbName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    Promise.resolve(operation(store))
      .then((request) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
}
```

- [ ] **Step 4: Add repository implementation**

Create `src/storage/repository.ts`:

```ts
import type { BabyRecord, Child, MediaAsset, RecordDraft, RecordType } from "../domain/types";
import { withStore } from "./indexedDb";

const DEFAULT_DB_NAME = "baby-growth";

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function createRepository(dbName = DEFAULT_DB_NAME) {
  return {
    async ensureDefaultChild(): Promise<Child> {
      const existing = await withStore<Child[]>(dbName, "children", "readonly", (store) => store.getAll());
      if (existing[0]) return existing[0];
      const timestamp = nowIso();
      const child: Child = {
        id: createId("child"),
        name: "宝宝",
        birthday: new Date().toISOString().slice(0, 10),
        sex: "unspecified",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await withStore(dbName, "children", "readwrite", (store) => store.put(child));
      return child;
    },

    async updateChild(child: Child): Promise<Child> {
      const next = { ...child, updatedAt: nowIso() };
      await withStore(dbName, "children", "readwrite", (store) => store.put(next));
      return next;
    },

    async createRecord<T extends RecordType>(draft: RecordDraft<T>): Promise<BabyRecord<T>> {
      const timestamp = nowIso();
      const record: BabyRecord<T> = { id: createId("record"), createdAt: timestamp, updatedAt: timestamp, ...draft };
      await withStore(dbName, "records", "readwrite", (store) => store.put(record));
      return record;
    },

    async updateRecord(id: string, patch: Partial<BabyRecord>): Promise<BabyRecord> {
      const current = await withStore<BabyRecord | undefined>(dbName, "records", "readonly", (store) => store.get(id));
      if (!current) throw new Error("记录不存在");
      const next = { ...current, ...patch, id, updatedAt: nowIso() };
      await withStore(dbName, "records", "readwrite", (store) => store.put(next));
      return next;
    },

    async deleteRecord(id: string): Promise<void> {
      await withStore(dbName, "records", "readwrite", (store) => store.delete(id));
    },

    async listRecords(filter: { childId: string; type?: RecordType }): Promise<BabyRecord[]> {
      const records = await withStore<BabyRecord[]>(dbName, "records", "readonly", (store) => store.getAll());
      return records
        .filter((record) => record.childId === filter.childId && (!filter.type || record.type === filter.type))
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    },

    async saveMedia(asset: Omit<MediaAsset, "id" | "createdAt">): Promise<MediaAsset> {
      const media: MediaAsset = { id: createId("media"), createdAt: nowIso(), ...asset };
      await withStore(dbName, "media", "readwrite", (store) => store.put(media));
      return media;
    },

    async getMedia(id: string): Promise<MediaAsset | undefined> {
      return withStore<MediaAsset | undefined>(dbName, "media", "readonly", (store) => store.get(id));
    },

    async exportAll() {
      const [children, records, media] = await Promise.all([
        withStore<Child[]>(dbName, "children", "readonly", (store) => store.getAll()),
        withStore<BabyRecord[]>(dbName, "records", "readonly", (store) => store.getAll()),
        withStore<MediaAsset[]>(dbName, "media", "readonly", (store) => store.getAll()),
      ]);
      return { exportedAt: nowIso(), children, records, mediaCount: media.length };
    },
  };
}

export type BabyRepository = ReturnType<typeof createRepository>;
```

- [ ] **Step 5: Run repository tests**

Run: `npm run test -- src/storage/repository.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/storage
git commit -m "feat: add indexeddb repository"
```

## Task 4: Add Services And Derived Data

**Files:**
- Create: `src/services/recordService.ts`
- Create: `src/services/recordService.test.ts`
- Create: `src/services/childService.ts`
- Create: `src/services/mediaService.ts`
- Create: `src/services/exportService.ts`

- [ ] **Step 1: Write record service tests**

Create `src/services/recordService.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildGrowthSeries, buildSleepSummary, summarizeRecord, validateDraft } from "./recordService";
import type { BabyRecord, RecordDraft } from "../domain/types";

describe("recordService", () => {
  it("validates required fields", () => {
    const draft = { childId: "c1", type: "journal", occurredAt: "2026-06-12T10:00", payload: { body: "" } } satisfies RecordDraft<"journal">;
    expect(validateDraft(draft)).toEqual(["请填写日记内容"]);
  });

  it("summarizes records in Chinese", () => {
    const record = { id: "1", childId: "c1", type: "growth", occurredAt: "2026-06-12T10:00", payload: { heightCm: 72, weightKg: 8.5 }, createdAt: "", updatedAt: "" } satisfies BabyRecord<"growth">;
    expect(summarizeRecord(record)).toContain("72cm");
  });

  it("builds growth series sorted by time", () => {
    const records = [
      { id: "2", childId: "c1", type: "growth", occurredAt: "2026-06-13T10:00", payload: { weightKg: 8.8 }, createdAt: "", updatedAt: "" },
      { id: "1", childId: "c1", type: "growth", occurredAt: "2026-06-12T10:00", payload: { heightCm: 72 }, createdAt: "", updatedAt: "" },
    ] satisfies BabyRecord[];
    expect(buildGrowthSeries(records).map((point) => point.date)).toEqual(["2026-06-12", "2026-06-13"]);
  });

  it("builds sleep summary", () => {
    const records = [
      { id: "1", childId: "c1", type: "sleep", occurredAt: "2026-06-12T10:00", payload: { startTime: "2026-06-12T10:00", endTime: "2026-06-12T12:00" }, createdAt: "", updatedAt: "" },
    ] satisfies BabyRecord[];
    expect(buildSleepSummary(records).totalMinutes).toBe(120);
  });
});
```

- [ ] **Step 2: Run service tests to verify they fail**

Run: `npm run test -- src/services/recordService.test.ts`

Expected: FAIL because service files do not exist.

- [ ] **Step 3: Add record service**

Create `src/services/recordService.ts`:

```ts
import type { BabyRecord, RecordDraft } from "../domain/types";
import { minutesBetween, toDayKey } from "../lib/date";

export function validateDraft(draft: RecordDraft): string[] {
  const errors: string[] = [];
  if (!draft.occurredAt) errors.push("请选择记录时间");
  if (draft.type === "journal" && !draft.payload.body.trim()) errors.push("请填写日记内容");
  if (draft.type === "photo" && !draft.payload.mediaId) errors.push("请选择照片");
  if (draft.type === "growth" && !draft.payload.heightCm && !draft.payload.weightKg && !draft.payload.headCircumferenceCm) errors.push("请至少填写一项成长数据");
  if (draft.type === "sleep" && (!draft.payload.startTime || !draft.payload.endTime)) errors.push("请填写睡眠开始和结束时间");
  if (draft.type === "vaccine" && !draft.payload.vaccineName.trim()) errors.push("请填写疫苗名称");
  if (draft.type === "milestone" && !draft.payload.description.trim()) errors.push("请填写里程碑内容");
  return errors;
}

export function summarizeRecord(record: BabyRecord): string {
  switch (record.type) {
    case "journal":
      return record.payload.body;
    case "photo":
      return record.payload.caption || "一张新的照片";
    case "growth":
      return [
        record.payload.heightCm ? `${record.payload.heightCm}cm` : "",
        record.payload.weightKg ? `${record.payload.weightKg}kg` : "",
        record.payload.headCircumferenceCm ? `头围${record.payload.headCircumferenceCm}cm` : "",
      ].filter(Boolean).join(" · ");
    case "sleep":
      return `睡了 ${Math.round(minutesBetween(record.payload.startTime, record.payload.endTime) / 60 * 10) / 10} 小时`;
    case "vaccine":
      return [record.payload.vaccineName, record.payload.dose].filter(Boolean).join(" · ");
    case "milestone":
      return record.payload.description;
  }
}

export function buildGrowthSeries(records: BabyRecord[]) {
  return records
    .filter((record): record is BabyRecord<"growth"> => record.type === "growth")
    .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime())
    .map((record) => ({ date: toDayKey(record.occurredAt), ...record.payload }));
}

export function buildSleepSummary(records: BabyRecord[]) {
  const sleeps = records.filter((record): record is BabyRecord<"sleep"> => record.type === "sleep");
  const totalMinutes = sleeps.reduce((sum, record) => sum + minutesBetween(record.payload.startTime, record.payload.endTime), 0);
  return {
    count: sleeps.length,
    totalMinutes,
    averageMinutes: sleeps.length ? Math.round(totalMinutes / sleeps.length) : 0,
  };
}
```

- [ ] **Step 4: Add thin service wrappers**

Create `src/services/childService.ts`:

```ts
import type { BabyRepository } from "../storage/repository";

export function createChildService(repository: BabyRepository) {
  return {
    getCurrentChild: () => repository.ensureDefaultChild(),
    updateChild: repository.updateChild,
  };
}
```

Create `src/services/mediaService.ts`:

```ts
import type { BabyRepository } from "../storage/repository";

export function createMediaService(repository: BabyRepository) {
  return {
    saveImage: (childId: string, blob: Blob) => repository.saveMedia({ childId, kind: "image", blob }),
    getImage: repository.getMedia,
  };
}
```

Create `src/services/exportService.ts`:

```ts
import type { BabyRepository } from "../storage/repository";

export function createExportService(repository: BabyRepository) {
  return {
    async buildJsonBackup() {
      return JSON.stringify(await repository.exportAll(), null, 2);
    },
  };
}
```

- [ ] **Step 5: Run service tests**

Run: `npm run test -- src/services/recordService.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services
git commit -m "feat: add record services"
```

## Task 5: Build App State Hook

**Files:**
- Create: `src/state/useBabyApp.ts`
- Create: `src/state/useBabyApp.test.tsx`

- [ ] **Step 1: Write hook test**

Create `src/state/useBabyApp.test.tsx`:

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useBabyApp } from "./useBabyApp";

describe("useBabyApp", () => {
  beforeEach(() => indexedDB.deleteDatabase("baby-growth"));

  it("loads a default child and can create a record", async () => {
    const { result } = renderHook(() => useBabyApp());
    await waitFor(() => expect(result.current.child?.name).toBe("宝宝"));
    await result.current.createRecord({ childId: result.current.child!.id, type: "journal", occurredAt: "2026-06-12T10:00", payload: { body: "今天很开心" } });
    await waitFor(() => expect(result.current.records).toHaveLength(1));
  });
});
```

- [ ] **Step 2: Run hook test to verify it fails**

Run: `npm run test -- src/state/useBabyApp.test.tsx`

Expected: FAIL because hook does not exist.

- [ ] **Step 3: Implement hook**

Create `src/state/useBabyApp.ts`:

```ts
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BabyRecord, Child, RecordDraft, RecordType, ViewKey } from "../domain/types";
import { validateDraft } from "../services/recordService";
import { createRepository } from "../storage/repository";

const repository = createRepository();

export function useBabyApp() {
  const [activeView, setActiveView] = useState<ViewKey>("home");
  const [child, setChild] = useState<Child | null>(null);
  const [records, setRecords] = useState<BabyRecord[]>([]);
  const [filter, setFilter] = useState<RecordType | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshRecords = useCallback(async (nextChild = child) => {
    if (!nextChild) return;
    const nextRecords = await repository.listRecords({ childId: nextChild.id });
    setRecords(nextRecords);
  }, [child]);

  useEffect(() => {
    let cancelled = false;
    repository.ensureDefaultChild()
      .then(async (defaultChild) => {
        if (cancelled) return;
        setChild(defaultChild);
        setRecords(await repository.listRecords({ childId: defaultChild.id }));
      })
      .catch(() => setError("本地存储不可用，暂时无法保存记录。"))
      .finally(() => setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const createRecord = useCallback(async (draft: RecordDraft) => {
    const errors = validateDraft(draft);
    if (errors.length) {
      setError(errors[0]);
      return null;
    }
    const record = await repository.createRecord(draft);
    await refreshRecords(child);
    setError(null);
    return record;
  }, [child, refreshRecords]);

  const updateChild = useCallback(async (nextChild: Child) => {
    const updated = await repository.updateChild(nextChild);
    setChild(updated);
    return updated;
  }, []);

  const exportJson = useCallback(async () => JSON.stringify(await repository.exportAll(), null, 2), []);

  const visibleRecords = useMemo(
    () => records.filter((record) => filter === "all" || record.type === filter),
    [records, filter],
  );

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
    updateChild,
    exportJson,
  };
}
```

- [ ] **Step 4: Run hook test**

Run: `npm run test -- src/state/useBabyApp.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state
git commit -m "feat: add app state hook"
```

## Task 6: Build App Shell And Navigation

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Navigation.tsx`
- Create: `src/components/layout/ChildSummary.tsx`
- Create: `src/components/layout/AppShell.test.tsx`

- [ ] **Step 1: Write shell test**

Create `src/components/layout/AppShell.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("renders navigation and child summary", () => {
    render(
      <AppShell
        activeView="home"
        onViewChange={vi.fn()}
        child={{ id: "c1", name: "小满", birthday: "2025-06-12", createdAt: "", updatedAt: "" }}
      >
        <p>内容</p>
      </AppShell>,
    );
    expect(screen.getByText("小满")).toBeInTheDocument();
    expect(screen.getAllByText("首页")[0]).toBeInTheDocument();
    expect(screen.getByText("内容")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run shell test to verify it fails**

Run: `npm run test -- src/components/layout/AppShell.test.tsx`

Expected: FAIL because shell files do not exist.

- [ ] **Step 3: Implement layout components**

Create `src/components/layout/Navigation.tsx`:

```tsx
import { BarChart3, Home, UserRound, Rows3 } from "lucide-react";
import type { ViewKey } from "../../domain/types";

const items = [
  { key: "home", label: "首页", icon: Home },
  { key: "timeline", label: "时间线", icon: Rows3 },
  { key: "data", label: "数据", icon: BarChart3 },
  { key: "profile", label: "档案", icon: UserRound },
] satisfies Array<{ key: ViewKey; label: string; icon: typeof Home }>;

export function Navigation({ activeView, onViewChange }: { activeView: ViewKey; onViewChange: (view: ViewKey) => void }) {
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-line bg-white md:hidden">
        <div className="grid grid-cols-4">
          {items.map((item) => <NavButton key={item.key} item={item} active={activeView === item.key} onClick={() => onViewChange(item.key)} />)}
        </div>
      </nav>
      <nav className="hidden w-24 shrink-0 border-r border-line bg-white px-3 py-5 md:block">
        <div className="space-y-2">
          {items.map((item) => <NavButton key={item.key} item={item} active={activeView === item.key} onClick={() => onViewChange(item.key)} />)}
        </div>
      </nav>
    </>
  );
}

function NavButton({ item, active, onClick }: { item: (typeof items)[number]; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col items-center gap-1 px-2 py-3 text-xs font-medium ${active ? "text-primary" : "text-muted"}`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span>{item.label}</span>
    </button>
  );
}
```

Create `src/components/layout/ChildSummary.tsx`:

```tsx
import type { Child } from "../../domain/types";
import { calculateAgeText } from "../../lib/date";

export function ChildSummary({ child }: { child: Child | null }) {
  if (!child) return <div className="h-14 rounded-card bg-white" />;
  return (
    <section className="flex items-center justify-between gap-3 border-b border-line bg-cream px-4 py-4 md:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-card bg-primary/10 text-lg font-semibold text-primary">
          {child.avatarUrl ? <img src={child.avatarUrl} alt={child.name} className="h-full w-full object-cover" /> : child.name.slice(0, 1)}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-ink">{child.name}</h1>
          <p className="text-sm text-muted">{calculateAgeText(child.birthday)}</p>
        </div>
      </div>
      <p className="hidden text-sm text-muted sm:block">{new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date())}</p>
    </section>
  );
}
```

Create `src/components/layout/AppShell.tsx`:

```tsx
import type { ReactNode } from "react";
import type { Child, ViewKey } from "../../domain/types";
import { ChildSummary } from "./ChildSummary";
import { Navigation } from "./Navigation";

export function AppShell({ activeView, onViewChange, child, children }: { activeView: ViewKey; onViewChange: (view: ViewKey) => void; child: Child | null; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream text-ink md:flex">
      <Navigation activeView={activeView} onViewChange={onViewChange} />
      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        <ChildSummary child={child} />
        <main className="mx-auto w-full max-w-6xl px-4 py-5 md:px-8">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire shell into App**

Replace `src/App.tsx` with:

```tsx
import { AppShell } from "./components/layout/AppShell";
import { useBabyApp } from "./state/useBabyApp";

export default function App() {
  const app = useBabyApp();
  return (
    <AppShell activeView={app.activeView} onViewChange={app.setActiveView} child={app.child}>
      <section className="rounded-card border border-line bg-white p-5">
        <p className="text-sm text-muted">正在准备成长记录...</p>
      </section>
    </AppShell>
  );
}
```

- [ ] **Step 5: Run shell test**

Run: `npm run test -- src/components/layout/AppShell.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/layout
git commit -m "feat: add app shell navigation"
```

## Task 7: Build Record Cards, Filters, And Composer Forms

**Files:**
- Create: `src/components/records/RecordCard.tsx`
- Create: `src/components/records/RecordFilters.tsx`
- Create: `src/components/records/RecordComposer.tsx`
- Create: `src/components/records/RecordCard.test.tsx`

- [ ] **Step 1: Write record card test**

Create `src/components/records/RecordCard.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecordCard } from "./RecordCard";

describe("RecordCard", () => {
  it("renders a Chinese summary", () => {
    render(<RecordCard record={{ id: "r1", childId: "c1", type: "growth", occurredAt: "2026-06-12T10:00", payload: { heightCm: 72, weightKg: 8.5 }, createdAt: "", updatedAt: "" }} />);
    expect(screen.getByText("身高体重")).toBeInTheDocument();
    expect(screen.getByText(/72cm/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run component test to verify it fails**

Run: `npm run test -- src/components/records/RecordCard.test.tsx`

Expected: FAIL because record components do not exist.

- [ ] **Step 3: Add RecordCard and filters**

Create `src/components/records/RecordCard.tsx`:

```tsx
import { recordMeta } from "../../domain/recordMeta";
import type { BabyRecord } from "../../domain/types";
import { formatTimeLabel } from "../../lib/date";
import { summarizeRecord } from "../../services/recordService";

export function RecordCard({ record }: { record: BabyRecord }) {
  const meta = recordMeta[record.type];
  const Icon = meta.icon;
  return (
    <article className="rounded-card border border-line bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-card ${meta.bgClass} ${meta.colorClass}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">{record.title || meta.label}</h3>
            <span className="text-xs text-muted">{formatTimeLabel(record.occurredAt)}</span>
          </div>
          <p className="mt-1 break-words text-sm text-ink">{summarizeRecord(record)}</p>
          {record.note ? <p className="mt-2 break-words text-xs text-muted">{record.note}</p> : null}
        </div>
      </div>
    </article>
  );
}
```

Create `src/components/records/RecordFilters.tsx`:

```tsx
import { recordMeta, recordTypeOrder } from "../../domain/recordMeta";
import type { RecordType } from "../../domain/types";

export function RecordFilters({ value, onChange }: { value: RecordType | "all"; onChange: (type: RecordType | "all") => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="记录类型筛选">
      <FilterButton label="全部" active={value === "all"} onClick={() => onChange("all")} />
      {recordTypeOrder.map((type) => <FilterButton key={type} label={recordMeta[type].label} active={value === type} onClick={() => onChange(type)} />)}
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`shrink-0 rounded-card border px-3 py-2 text-sm ${active ? "border-primary bg-primary text-white" : "border-line bg-white text-muted"}`}>
      {label}
    </button>
  );
}
```

- [ ] **Step 4: Add composer with type-specific inline forms**

Create `src/components/records/RecordComposer.tsx`:

```tsx
import { useState } from "react";
import { recordMeta, recordTypeOrder } from "../../domain/recordMeta";
import type { RecordDraft, RecordType } from "../../domain/types";

function currentLocalDateTime() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function RecordComposer({ childId, initialType, onCancel, onSave }: { childId: string; initialType: RecordType; onCancel: () => void; onSave: (draft: RecordDraft) => Promise<void> }) {
  const [type, setType] = useState<RecordType>(initialType);
  const [occurredAt, setOccurredAt] = useState(currentLocalDateTime());
  const [text, setText] = useState("");
  const [secondary, setSecondary] = useState("");

  async function submit() {
    const base = { childId, type, occurredAt };
    const draft =
      type === "journal" ? { ...base, payload: { body: text } } :
      type === "photo" ? { ...base, payload: { caption: text, mediaId: "manual-photo-entry" } } :
      type === "growth" ? { ...base, payload: { heightCm: Number(text) || undefined, weightKg: Number(secondary) || undefined } } :
      type === "sleep" ? { ...base, payload: { startTime: text, endTime: secondary || occurredAt } } :
      type === "vaccine" ? { ...base, payload: { vaccineName: text, dose: secondary } } :
      { ...base, payload: { category: secondary || "成长", description: text } };
    await onSave(draft as RecordDraft);
  }

  return (
    <section className="rounded-card border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {recordTypeOrder.map((recordType) => (
          <button key={recordType} type="button" onClick={() => setType(recordType)} className={`rounded-card border px-3 py-2 text-sm ${type === recordType ? "border-primary bg-primary text-white" : "border-line text-muted"}`}>
            {recordMeta[recordType].label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm font-medium text-ink">
          记录时间
          <input className="rounded-card border border-line px-3 py-2" type="datetime-local" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-medium text-ink">
          {type === "growth" ? "身高 cm" : type === "sleep" ? "开始时间" : type === "vaccine" ? "疫苗名称" : type === "milestone" ? "里程碑内容" : "内容"}
          <textarea className="min-h-24 rounded-card border border-line px-3 py-2" value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        {(type === "growth" || type === "sleep" || type === "vaccine" || type === "milestone") ? (
          <label className="grid gap-1 text-sm font-medium text-ink">
            {type === "growth" ? "体重 kg" : type === "sleep" ? "结束时间" : type === "vaccine" ? "剂次" : "分类"}
            <input className="rounded-card border border-line px-3 py-2" value={secondary} onChange={(event) => setSecondary(event.target.value)} />
          </label>
        ) : null}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-card border border-line px-4 py-2 text-sm text-muted">取消</button>
        <button type="button" onClick={submit} className="rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white">保存</button>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run record component test**

Run: `npm run test -- src/components/records/RecordCard.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/records
git commit -m "feat: add record display and composer"
```

## Task 8: Build Home And Timeline Pages

**Files:**
- Create: `src/pages/HomePage.tsx`
- Create: `src/pages/TimelinePage.tsx`
- Modify: `src/App.tsx`
- Create: `src/pages/HomePage.test.tsx`

- [ ] **Step 1: Write home page test**

Create `src/pages/HomePage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("shows quick actions and recent records", () => {
    render(<HomePage childId="c1" records={[{ id: "r1", childId: "c1", type: "journal", occurredAt: "2026-06-12T10:00", payload: { body: "第一次叫妈妈" }, createdAt: "", updatedAt: "" }]} onStartRecord={vi.fn()} />);
    expect(screen.getByText("写日记")).toBeInTheDocument();
    expect(screen.getByText("最近记录")).toBeInTheDocument();
    expect(screen.getByText("第一次叫妈妈")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run page test to verify it fails**

Run: `npm run test -- src/pages/HomePage.test.tsx`

Expected: FAIL because pages do not exist.

- [ ] **Step 3: Add HomePage**

Create `src/pages/HomePage.tsx`:

```tsx
import { recordMeta, recordTypeOrder } from "../domain/recordMeta";
import type { BabyRecord, RecordType } from "../domain/types";
import { RecordCard } from "../components/records/RecordCard";

export function HomePage({ childId, records, onStartRecord }: { childId: string; records: BabyRecord[]; onStartRecord: (type: RecordType) => void }) {
  const recent = records.slice(0, 5);
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <section className="space-y-4">
        <div>
          <p className="text-sm text-muted">今天</p>
          <h2 className="text-2xl font-semibold text-ink">记录一个新的成长瞬间</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {recordTypeOrder.map((type) => {
            const meta = recordMeta[type];
            const Icon = meta.icon;
            return (
              <button key={type} type="button" onClick={() => onStartRecord(type)} className="rounded-card border border-line bg-white p-4 text-left shadow-sm transition hover:border-primary">
                <Icon className={`h-5 w-5 ${meta.colorClass}`} aria-hidden="true" />
                <span className="mt-3 block text-sm font-semibold text-ink">{meta.actionLabel}</span>
              </button>
            );
          })}
        </div>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">最近记录</h2>
          {recent.length ? recent.map((record) => <RecordCard key={record.id} record={record} />) : <p className="rounded-card border border-line bg-white p-4 text-sm text-muted">今天还没有记录新的瞬间。</p>}
        </section>
      </section>
      <aside className="rounded-card border border-line bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">小结</h2>
        <p className="mt-2 text-sm text-muted">已保存 {records.length} 条记录。</p>
        <p className="mt-4 text-xs text-muted">当前孩子 ID：{childId}</p>
      </aside>
    </div>
  );
}
```

- [ ] **Step 4: Add TimelinePage**

Create `src/pages/TimelinePage.tsx`:

```tsx
import { RecordCard } from "../components/records/RecordCard";
import { RecordFilters } from "../components/records/RecordFilters";
import type { BabyRecord, RecordType } from "../domain/types";
import { formatDateLabel, groupRecordsByDay } from "../lib/date";

export function TimelinePage({ records, filter, onFilterChange }: { records: BabyRecord[]; filter: RecordType | "all"; onFilterChange: (type: RecordType | "all") => void }) {
  const groups = groupRecordsByDay(records);
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">全部记录</p>
          <h2 className="text-2xl font-semibold text-ink">时间线</h2>
        </div>
        <RecordFilters value={filter} onChange={onFilterChange} />
      </div>
      {groups.length ? groups.map((group) => (
        <section key={group.date} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted">{formatDateLabel(group.date)}</h3>
          {group.records.map((record) => <RecordCard key={record.id} record={record} />)}
        </section>
      )) : <p className="rounded-card border border-line bg-white p-4 text-sm text-muted">还没有记录。</p>}
    </section>
  );
}
```

- [ ] **Step 5: Wire pages into App**

Replace `src/App.tsx` with:

```tsx
import { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { RecordComposer } from "./components/records/RecordComposer";
import type { RecordType } from "./domain/types";
import { HomePage } from "./pages/HomePage";
import { TimelinePage } from "./pages/TimelinePage";
import { useBabyApp } from "./state/useBabyApp";

export default function App() {
  const app = useBabyApp();
  const [composerType, setComposerType] = useState<RecordType | null>(null);

  return (
    <AppShell activeView={app.activeView} onViewChange={app.setActiveView} child={app.child}>
      {app.error ? <p className="mb-4 rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{app.error}</p> : null}
      {composerType && app.child ? (
        <RecordComposer
          childId={app.child.id}
          initialType={composerType}
          onCancel={() => setComposerType(null)}
          onSave={async (draft) => {
            const record = await app.createRecord(draft);
            if (record) setComposerType(null);
          }}
        />
      ) : null}
      {!composerType && app.child && app.activeView === "home" ? <HomePage childId={app.child.id} records={app.records} onStartRecord={setComposerType} /> : null}
      {!composerType && app.activeView === "timeline" ? <TimelinePage records={app.visibleRecords} filter={app.filter} onFilterChange={app.setFilter} /> : null}
      {!composerType && app.activeView !== "home" && app.activeView !== "timeline" ? <p className="rounded-card border border-line bg-white p-4 text-sm text-muted">请选择首页或时间线继续记录。</p> : null}
    </AppShell>
  );
}
```

- [ ] **Step 6: Run home page test**

Run: `npm run test -- src/pages/HomePage.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/pages
git commit -m "feat: add home and timeline pages"
```

## Task 9: Build Data And Profile Pages Plus JSON Export

**Files:**
- Create: `src/components/data/GrowthChart.tsx`
- Create: `src/components/data/SleepSummary.tsx`
- Create: `src/components/data/VaccineList.tsx`
- Create: `src/pages/DataPage.tsx`
- Create: `src/pages/ProfilePage.tsx`
- Modify: `src/App.tsx`
- Create: `src/pages/DataPage.test.tsx`

- [ ] **Step 1: Write data page test**

Create `src/pages/DataPage.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataPage } from "./DataPage";

describe("DataPage", () => {
  it("renders growth, sleep, and vaccine panels", () => {
    render(<DataPage records={[]} />);
    expect(screen.getByText("成长趋势")).toBeInTheDocument();
    expect(screen.getByText("睡眠概览")).toBeInTheDocument();
    expect(screen.getByText("疫苗记录")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run data page test to verify it fails**

Run: `npm run test -- src/pages/DataPage.test.tsx`

Expected: FAIL because data page does not exist.

- [ ] **Step 3: Add data components**

Create `src/components/data/GrowthChart.tsx`:

```tsx
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BabyRecord } from "../../domain/types";
import { buildGrowthSeries } from "../../services/recordService";

export function GrowthChart({ records }: { records: BabyRecord[] }) {
  const data = buildGrowthSeries(records);
  return (
    <section className="rounded-card border border-line bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">成长趋势</h2>
      <div className="mt-4 h-56">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="heightCm" stroke="#5B8DEF" name="身高 cm" />
              <Line type="monotone" dataKey="weightKg" stroke="#E98B7C" name="体重 kg" />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-muted">还没有身高体重记录。</p>}
      </div>
    </section>
  );
}
```

Create `src/components/data/SleepSummary.tsx`:

```tsx
import type { BabyRecord } from "../../domain/types";
import { buildSleepSummary } from "../../services/recordService";

export function SleepSummary({ records }: { records: BabyRecord[] }) {
  const summary = buildSleepSummary(records);
  return (
    <section className="rounded-card border border-line bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">睡眠概览</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="记录次数" value={`${summary.count}`} />
        <Stat label="平均时长" value={`${Math.round(summary.averageMinutes / 60 * 10) / 10} 小时`} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-card bg-cream p-3"><p className="text-xs text-muted">{label}</p><p className="mt-1 text-xl font-semibold text-ink">{value}</p></div>;
}
```

Create `src/components/data/VaccineList.tsx`:

```tsx
import type { BabyRecord } from "../../domain/types";

export function VaccineList({ records }: { records: BabyRecord[] }) {
  const vaccines = records.filter((record): record is BabyRecord<"vaccine"> => record.type === "vaccine");
  return (
    <section className="rounded-card border border-line bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">疫苗记录</h2>
      <div className="mt-3 space-y-2">
        {vaccines.length ? vaccines.map((record) => (
          <div key={record.id} className="rounded-card bg-cream p-3">
            <p className="text-sm font-semibold text-ink">{record.payload.vaccineName}</p>
            <p className="text-xs text-muted">{record.payload.completedDate || record.payload.scheduledDate || "未填写日期"}</p>
          </div>
        )) : <p className="text-sm text-muted">还没有疫苗记录。</p>}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add DataPage and ProfilePage**

Create `src/pages/DataPage.tsx`:

```tsx
import { GrowthChart } from "../components/data/GrowthChart";
import { SleepSummary } from "../components/data/SleepSummary";
import { VaccineList } from "../components/data/VaccineList";
import type { BabyRecord } from "../domain/types";

export function DataPage({ records }: { records: BabyRecord[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2"><GrowthChart records={records} /></div>
      <SleepSummary records={records} />
      <VaccineList records={records} />
    </div>
  );
}
```

Create `src/pages/ProfilePage.tsx`:

```tsx
import { useState } from "react";
import type { Child } from "../domain/types";

export function ProfilePage({ child, onSave, onExport }: { child: Child; onSave: (child: Child) => Promise<void>; onExport: () => Promise<string> }) {
  const [draft, setDraft] = useState(child);
  async function downloadJson() {
    const json = await onExport();
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "baby-growth-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="max-w-2xl space-y-4">
      <h2 className="text-2xl font-semibold text-ink">宝宝档案</h2>
      <div className="rounded-card border border-line bg-white p-4 shadow-sm">
        <label className="grid gap-1 text-sm font-medium text-ink">昵称<input className="rounded-card border border-line px-3 py-2" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
        <label className="mt-3 grid gap-1 text-sm font-medium text-ink">生日<input type="date" className="rounded-card border border-line px-3 py-2" value={draft.birthday} onChange={(event) => setDraft({ ...draft, birthday: event.target.value })} /></label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => onSave(draft)} className="rounded-card bg-primary px-4 py-2 text-sm font-semibold text-white">保存档案</button>
          <button type="button" onClick={downloadJson} className="rounded-card border border-line px-4 py-2 text-sm text-muted">导出 JSON</button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Wire data and profile into App**

Add imports to `src/App.tsx`:

```tsx
import { DataPage } from "./pages/DataPage";
import { ProfilePage } from "./pages/ProfilePage";
```

Replace the fallback page block with:

```tsx
      {!composerType && app.activeView === "data" ? <DataPage records={app.records} /> : null}
      {!composerType && app.activeView === "profile" && app.child ? <ProfilePage child={app.child} onSave={app.updateChild} onExport={app.exportJson} /> : null}
```

- [ ] **Step 6: Run data page test**

Run: `npm run test -- src/pages/DataPage.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/data src/pages src/App.tsx
git commit -m "feat: add data profile and export views"
```

## Task 10: Final Verification, Polish, And Run The App

**Files:**
- Modify as needed after verification.

- [ ] **Step 1: Run full test suite**

Run: `npm run test`

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: TypeScript and Vite build pass.

- [ ] **Step 3: Run app locally**

Run: `npm run dev`

Expected: Vite prints a local URL, usually `http://localhost:5173/`.

- [ ] **Step 4: Browser manual verification**

Open `http://localhost:5173/` in the in-app browser and verify:

- Home is the first screen, not a landing page.
- Mobile-width layout has bottom navigation.
- Desktop-width layout has left navigation.
- Quick actions open the composer.
- Each record type can be saved.
- Refresh keeps saved records.
- Timeline filters records by type.
- Data page shows panels without overlap.
- Profile can update name and birthday.
- JSON export downloads a file.

- [ ] **Step 5: Fix any verification issues**

For each issue, make the smallest targeted code change, then rerun:

```bash
npm run test
npm run build
```

Expected: both pass after fixes.

- [ ] **Step 6: Commit final polish**

```bash
git add .
git commit -m "chore: verify baby growth app mvp"
```

## Self-Review

- Spec coverage: The plan covers Vite React TypeScript Tailwind scaffold, IndexedDB persistence, default child profile, home quick actions, all six record types, timeline filters, data summaries, profile editing, JSON export, Chinese UI, responsive navigation, tests, and manual verification.
- Scope control: Login, cloud sync, collaboration, medical advice, reminders, video, and share links remain out of scope.
- Type consistency: The plan consistently uses `Child`, `BabyRecord`, `RecordDraft`, `RecordType`, `PayloadByType`, `childId`, `occurredAt`, and `payload`.
- Red-flag scan: The plan contains no unresolved markers. The first composer implements all record types in one focused file; later extraction into per-type form files can happen only if the file becomes difficult to maintain.
