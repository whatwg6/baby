# Baby Growth Web App Design

## Summary

Build a local-first Web App for recording a child's growth. The first version should feel like a balanced family growth archive: fast enough for daily logging, warm enough for reviewing memories, and structured enough for growth, sleep, vaccine, and milestone data.

The app starts with one child as the primary experience, while the data model supports multiple children later. It uses browser-local storage first and keeps the persistence layer abstract so cloud sync can be added without rewriting the UI.

The first UI language is Simplified Chinese.

## Goals

- Let parents quickly add common growth records from the home screen.
- Show recent activity and a full timeline for emotional review.
- Provide a dedicated data view for growth, sleep, and vaccine records.
- Persist data locally across refreshes.
- Keep the architecture ready for future multi-child support and cloud sync.
- Use a warm, clear UI that feels like a family tool, not a medical dashboard or a marketing page.

## Non-Goals

- Login, registration, or account management.
- Cloud sync.
- Multi-user collaboration.
- Medical advice or growth-standard diagnosis.
- Push notifications or complex reminders.
- Video upload.
- Share links or permission management.

## Product Shape

The app has four primary views:

1. Home
2. Timeline
3. Data
4. Profile

Adding a record is not a primary navigation destination. It opens from quick actions on Home or from an add button on Timeline.

## Home

Home is the main working surface. It should show:

- Current child summary with name, age, avatar, and today's date.
- Quick actions:
  - Journal
  - Photo
  - Height and weight
  - Sleep
  - Vaccine
  - Milestone
- Recent records, sorted by occurrence time descending.
- A compact data summary on wider screens, such as latest height/weight and recent sleep.

Home should not be a landing page. The first screen must be the usable app experience.

## Timeline

Timeline shows all records across types, grouped by date and sorted descending.

Capabilities:

- Filter by record type.
- Show different card treatments per type while preserving a shared card structure.
- Open a record for viewing and editing.
- Add a new record.

Every record card should display:

- Type icon
- Title or compact summary
- Occurrence time
- Optional note
- Optional media thumbnail

## Data

Data focuses on structured records:

- Growth trend for height, weight, and optional head circumference.
- Sleep summary from sleep records.
- Vaccine list with scheduled and completed dates.

This view records and visualizes user-entered data. It must not make medical claims or imply diagnosis.

## Profile

Profile shows and edits child details:

- Name
- Birthday
- Avatar, optional
- Optional sex or other lightweight metadata

The first version displays one child, but the data model includes `childId` everywhere so a child switcher can be added later.

## Record Types

The first version supports:

- Journal
- Photo
- Growth
- Vaccine
- Sleep
- Milestone

Each record shares common metadata and stores type-specific fields in `payload`.

## Data Model

```ts
type Child = {
  id: string;
  name: string;
  birthday: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
};

type RecordType =
  | "journal"
  | "photo"
  | "growth"
  | "vaccine"
  | "sleep"
  | "milestone";

type BabyRecord = {
  id: string;
  childId: string;
  type: RecordType;
  occurredAt: string;
  title?: string;
  note?: string;
  mediaIds?: string[];
  payload: unknown;
  createdAt: string;
  updatedAt: string;
};

type MediaAsset = {
  id: string;
  childId: string;
  kind: "image";
  blob: Blob;
  createdAt: string;
};
```

Type-specific payloads:

```ts
type JournalPayload = {
  body: string;
};

type PhotoPayload = {
  caption?: string;
  mediaId: string;
};

type GrowthPayload = {
  heightCm?: number;
  weightKg?: number;
  headCircumferenceCm?: number;
};

type SleepPayload = {
  startTime: string;
  endTime: string;
  quality?: "good" | "normal" | "restless";
  note?: string;
};

type VaccinePayload = {
  vaccineName: string;
  dose?: string;
  scheduledDate?: string;
  completedDate?: string;
  location?: string;
};

type MilestonePayload = {
  category: string;
  description: string;
};
```

## Storage

Use IndexedDB for first-version persistence. It is a better fit than `localStorage` because the app needs structured records and photo assets.

Storage must be accessed through a repository layer. UI components should never call IndexedDB directly.

Suggested layers:

- `RecordService`: validation, sorting, record transformations, chart-friendly derived data.
- `ChildService`: current child access and profile updates.
- `MediaService`: image persistence and retrieval.
- `Repository`: IndexedDB reads and writes.

Future cloud sync can replace or extend the repository without changing page components.

## UI Specification

Overall feel: warm, clean, trustworthy. The app should feel like a family growth archive plus a light parenting tool. Avoid childish decoration, medical-dashboard severity, and marketing-page composition.

Color palette:

- Background: `#FAF7F2`
- Primary: `#4E9F8F`
- Accent: `#E98B7C`
- Data blue: `#5B8DEF`
- Data yellow: `#E8B84A`
- Primary text: `#25332F`
- Secondary text: `#6F7C76`
- Border: `#E7DDD2`
- Success: `#4E9F70`
- Warning: `#D99A2B`
- Error: `#D95C5C`

Typography:

- Use system fonts, with `Inter`, `SF Pro`, and `system-ui` as preferred options.
- Page titles: 24-28px, semibold.
- Section titles: 18-20px, semibold.
- Body: 14-16px.
- Supporting text: 12-13px.
- Do not use negative letter spacing.
- Do not scale font sizes directly with viewport width.

Layout:

- Mobile-first.
- Desktop content max width around 1120px.
- Mobile navigation uses a bottom nav.
- Desktop navigation uses a narrow left rail.
- Cards use an 8px border radius.
- Do not nest cards inside cards.
- Page sections should be full-width bands or unframed layouts with constrained inner content.
- Buttons and labels must not overflow on mobile or desktop.

Components:

- Quick actions use an icon plus a short label.
- Type filters use segmented controls or pill filters.
- Binary values use toggles or checkboxes.
- Numeric values use inputs or steppers.
- Date and time use native inputs in the first version.
- Use `lucide-react` for icons.
- Empty states should be warm and direct, such as "今天还没有记录新的瞬间。"
- Avoid long instructional copy inside the app UI.

Responsive behavior:

- Phone: single column, bottom navigation, quick actions in 2-3 columns.
- Tablet and desktop: home can use two columns, with the activity stream on the left and summaries on the right.

## Technical Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- IndexedDB
- `lucide-react` for icons
- A lightweight charting library, such as Recharts, for growth and sleep visualizations

Use custom components for the first version instead of a heavy UI framework.

## Component Boundaries

```txt
AppShell
  Navigation
  ChildSummary
  HomePage
    QuickActions
    RecentRecords
  TimelinePage
    RecordFilters
    RecordCard
  DataPage
    GrowthChart
    SleepSummary
    VaccineList
  ProfilePage
    ChildProfileForm
  RecordComposer
    JournalForm
    PhotoForm
    GrowthForm
    SleepForm
    VaccineForm
    MilestoneForm
```

## Error Handling

- If IndexedDB is unavailable, show a clear blocking error that local saving is not available.
- Validate required fields inline before saving.
- If an image is too large or cannot be stored, show a recoverable error.
- After a successful write, return to Home or Timeline and display the new record.
- Keep destructive actions explicit. Deleting a record should require confirmation.

## Testing And Verification

Repository tests:

- Create, read, update, and delete records.
- Filter records by child.
- Filter records by type.
- Sort records by `occurredAt`.

Form tests:

- Required field validation.
- Successful save for each record type.
- Error display when storage fails.

Page tests:

- Home shows recent records.
- Timeline groups and sorts records correctly.
- Data page derives growth and sleep summaries from records.
- Profile updates child data.

Manual verification:

- Add each record type.
- Refresh and confirm data persists.
- Filter Timeline by type.
- View growth and sleep data.
- Export JSON backup.

## First Implementation Slice

The first implementation should create a complete local MVP:

1. Project scaffold with Vite, React, TypeScript, and Tailwind CSS.
2. App shell and responsive navigation.
3. IndexedDB repository.
4. Default child profile creation.
5. Home quick actions and recent records.
6. Record composer for all first-version record types.
7. Timeline with filters.
8. Data page summaries.
9. Profile page.
10. JSON export.
