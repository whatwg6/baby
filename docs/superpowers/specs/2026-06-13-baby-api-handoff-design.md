# Baby API Handoff Design

## Summary

This document hands off the backend API design for the Baby Growth Web App to a separate backend project. The current repository remains a frontend-only React application. The backend should expose a REST API that can replace the current IndexedDB repository without forcing page-level rewrites.

The first backend version should support the same product surface that exists today:

- Child profile storage.
- Growth records across the six existing record types.
- Image media upload and retrieval.
- JSON backup export.

The first version should not include account registration, family sharing, medical advice, push reminders, video upload, or a full offline conflict-resolution protocol.

## Goals

- Provide a clear API contract for a new backend project.
- Keep request and response shapes close to the existing frontend domain types.
- Make it straightforward for the frontend to add an HTTP repository beside the current IndexedDB repository.
- Preserve room for future authentication, multi-child support, and cloud sync.
- Keep the MVP small enough to implement and test quickly.

## Non-Goals

- Building the backend inside this frontend repository.
- Replacing the existing frontend storage implementation immediately.
- User login, registration, OAuth, or family invitations.
- Multi-user collaboration and permissions.
- Offline-first sync, conflict merging, or push notifications.
- Medical diagnosis, recommendations, or growth-standard interpretation.
- Video storage or share links.

## Recommended API Style

Use REST over HTTPS with JSON request and response bodies. Use multipart form data only for media upload.

Recommended base path:

```text
/api/v1
```

Recommended resource groups:

```text
/children
/records
/media
/exports
```

All timestamps should be ISO 8601 strings in UTC. Date-only fields, such as birthdays and vaccine dates, should use `YYYY-MM-DD`.

## Authentication Assumption

Authentication is out of scope for the first implementation, but the API should not make anonymous global data a permanent assumption.

For MVP development, the backend may use one of these approaches:

1. A single development user or household configured by environment variable.
2. A temporary `X-Household-Id` header for local and staging environments.

The API contract should be written so a future authenticated household or user can own children, records, and media without changing frontend domain objects.

## Domain Models

### Child

```ts
type Child = {
  id: string;
  name: string;
  birthday: string;
  avatarUrl?: string;
  sex?: "female" | "male" | "unspecified";
  createdAt: string;
  updatedAt: string;
};
```

Validation:

- `name` is required after trimming.
- `birthday` is required and must be `YYYY-MM-DD`.
- `sex` is optional and must be one of the allowed values.
- `avatarUrl` is optional and may point to a media URL or an external image URL.

### Record Type

```ts
type RecordType =
  | "journal"
  | "photo"
  | "growth"
  | "vaccine"
  | "sleep"
  | "milestone";
```

### Baby Record

```ts
type BabyRecord<T extends RecordType = RecordType> = {
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
```

Identity fields are immutable after creation:

- `id`
- `childId`
- `type`
- `createdAt`

Patch endpoints may update:

- `occurredAt`
- `title`
- `note`
- `mediaIds`
- `payload`

### Payloads

```ts
type PayloadByType = {
  journal: {
    body: string;
  };
  photo: {
    caption?: string;
    mediaId: string;
  };
  growth: {
    heightCm?: number;
    weightKg?: number;
    headCircumferenceCm?: number;
  };
  vaccine: {
    vaccineName: string;
    dose?: string;
    scheduledDate?: string;
    completedDate?: string;
    location?: string;
  };
  sleep: {
    startTime: string;
    endTime: string;
    quality?: "good" | "normal" | "restless";
    note?: string;
  };
  milestone: {
    category: string;
    description: string;
  };
};
```

Payload validation:

- `journal.body` is required after trimming.
- `photo.mediaId` is required and must refer to an existing image media object owned by the same household.
- `growth` requires at least one of `heightCm`, `weightKg`, or `headCircumferenceCm`.
- Growth measurements must be positive numbers.
- `vaccine.vaccineName` is required after trimming.
- `sleep.startTime` and `sleep.endTime` are required ISO 8601 strings.
- `sleep.endTime` must be later than `sleep.startTime`.
- `sleep.quality` is optional and must be one of the allowed values.
- `milestone.description` is required after trimming.
- `milestone.category` is required after trimming.

### Media

```ts
type MediaAsset = {
  id: string;
  childId: string;
  kind: "image";
  contentType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
};
```

The frontend currently stores image Blobs in IndexedDB. The backend should return URLs or signed URLs instead of raw blobs inside JSON responses.

MVP media constraints:

- Only images are supported.
- Recommended accepted MIME types: `image/jpeg`, `image/png`, `image/webp`.
- Recommended max file size: 8 MB.
- Video is out of scope.

## Response Envelope

For successful single-resource responses:

```json
{
  "data": {}
}
```

For list responses:

```json
{
  "data": [],
  "page": {
    "limit": 50,
    "cursor": "opaque-next-cursor",
    "nextCursor": "opaque-next-cursor-or-null"
  }
}
```

For errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请检查输入内容",
    "details": [
      {
        "field": "payload.body",
        "message": "请填写日记内容"
      }
    ]
  }
}
```

Recommended error codes:

- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `MEDIA_TOO_LARGE`
- `UNSUPPORTED_MEDIA_TYPE`
- `STORAGE_UNAVAILABLE`
- `INTERNAL_ERROR`

## Endpoints

### Get Children

```http
GET /api/v1/children
```

Returns children visible to the current household.

Response:

```json
{
  "data": [
    {
      "id": "child_123",
      "name": "宝宝",
      "birthday": "2026-06-13",
      "sex": "unspecified",
      "createdAt": "2026-06-13T00:00:00.000Z",
      "updatedAt": "2026-06-13T00:00:00.000Z"
    }
  ]
}
```

### Create Child

```http
POST /api/v1/children
Content-Type: application/json
```

Request:

```json
{
  "name": "宝宝",
  "birthday": "2026-06-13",
  "sex": "unspecified",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

Response:

```json
{
  "data": {
    "id": "child_123",
    "name": "宝宝",
    "birthday": "2026-06-13",
    "sex": "unspecified",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2026-06-13T00:00:00.000Z",
    "updatedAt": "2026-06-13T00:00:00.000Z"
  }
}
```

### Update Child

```http
PATCH /api/v1/children/{childId}
Content-Type: application/json
```

Request:

```json
{
  "name": "小橙子",
  "birthday": "2026-06-13",
  "sex": "female",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

Response:

```json
{
  "data": {
    "id": "child_123",
    "name": "小橙子",
    "birthday": "2026-06-13",
    "sex": "female",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2026-06-13T00:00:00.000Z",
    "updatedAt": "2026-06-13T01:00:00.000Z"
  }
}
```

### List Records

```http
GET /api/v1/records?childId=child_123&type=growth&limit=50&cursor=opaque
```

Query parameters:

- `childId` is required for MVP.
- `type` is optional and filters by record type.
- `limit` is optional and defaults to 50.
- `cursor` is optional and used for pagination.

Sorting:

- Sort by `occurredAt` descending.
- Use `id` as a stable tiebreaker.

Response:

```json
{
  "data": [
    {
      "id": "record_123",
      "childId": "child_123",
      "type": "growth",
      "occurredAt": "2026-06-13T08:30:00.000Z",
      "title": "满月体检",
      "note": "状态很好",
      "mediaIds": [],
      "payload": {
        "heightCm": 55,
        "weightKg": 4.2,
        "headCircumferenceCm": 38
      },
      "createdAt": "2026-06-13T08:35:00.000Z",
      "updatedAt": "2026-06-13T08:35:00.000Z"
    }
  ],
  "page": {
    "limit": 50,
    "cursor": null,
    "nextCursor": null
  }
}
```

### Create Record

```http
POST /api/v1/records
Content-Type: application/json
```

Request:

```json
{
  "childId": "child_123",
  "type": "journal",
  "occurredAt": "2026-06-13T08:30:00.000Z",
  "title": "早晨",
  "note": "今天醒来心情很好",
  "mediaIds": [],
  "payload": {
    "body": "第一次完整睡过一个长觉。"
  }
}
```

Response:

```json
{
  "data": {
    "id": "record_123",
    "childId": "child_123",
    "type": "journal",
    "occurredAt": "2026-06-13T08:30:00.000Z",
    "title": "早晨",
    "note": "今天醒来心情很好",
    "mediaIds": [],
    "payload": {
      "body": "第一次完整睡过一个长觉。"
    },
    "createdAt": "2026-06-13T08:35:00.000Z",
    "updatedAt": "2026-06-13T08:35:00.000Z"
  }
}
```

### Update Record

```http
PATCH /api/v1/records/{recordId}
Content-Type: application/json
```

Request:

```json
{
  "occurredAt": "2026-06-13T08:45:00.000Z",
  "title": "早晨记录",
  "note": "补充了一点细节",
  "payload": {
    "body": "第一次完整睡过一个长觉，醒来还笑了。"
  }
}
```

Response:

```json
{
  "data": {
    "id": "record_123",
    "childId": "child_123",
    "type": "journal",
    "occurredAt": "2026-06-13T08:45:00.000Z",
    "title": "早晨记录",
    "note": "补充了一点细节",
    "mediaIds": [],
    "payload": {
      "body": "第一次完整睡过一个长觉，醒来还笑了。"
    },
    "createdAt": "2026-06-13T08:35:00.000Z",
    "updatedAt": "2026-06-13T09:00:00.000Z"
  }
}
```

The backend must reject attempts to change `id`, `childId`, `type`, or `createdAt`.

### Delete Record

```http
DELETE /api/v1/records/{recordId}
```

Response:

```json
{
  "data": {
    "deleted": true
  }
}
```

The backend may hard-delete records in the MVP. If sync is added later, switch to soft deletes with tombstones.

### Upload Media

```http
POST /api/v1/media
Content-Type: multipart/form-data
```

Form fields:

- `childId`: required.
- `file`: required image file.

Response:

```json
{
  "data": {
    "id": "media_123",
    "childId": "child_123",
    "kind": "image",
    "contentType": "image/jpeg",
    "sizeBytes": 123456,
    "url": "https://cdn.example.com/media/media_123.jpg",
    "createdAt": "2026-06-13T08:30:00.000Z"
  }
}
```

### Get Media Metadata

```http
GET /api/v1/media/{mediaId}
```

Response:

```json
{
  "data": {
    "id": "media_123",
    "childId": "child_123",
    "kind": "image",
    "contentType": "image/jpeg",
    "sizeBytes": 123456,
    "url": "https://cdn.example.com/media/media_123.jpg",
    "createdAt": "2026-06-13T08:30:00.000Z"
  }
}
```

### Export JSON Backup

```http
GET /api/v1/exports/json?childId=child_123
```

`childId` is optional. If omitted, export all children visible to the current household.

Response:

```json
{
  "data": {
    "exportedAt": "2026-06-13T10:00:00.000Z",
    "children": [],
    "records": [],
    "media": [
      {
        "id": "media_123",
        "childId": "child_123",
        "kind": "image",
        "contentType": "image/jpeg",
        "sizeBytes": 123456,
        "url": "https://cdn.example.com/media/media_123.jpg",
        "createdAt": "2026-06-13T08:30:00.000Z"
      }
    ]
  }
}
```

The MVP export may include media metadata and URLs rather than embedding binary image data. A later full backup format can include a ZIP archive with JSON plus media files.

## Frontend Integration Notes

The current frontend data boundary is already close to what the backend needs. The backend integration should primarily add a new repository implementation with the same shape as `src/storage/repository.ts`.

Recommended frontend migration path:

1. Keep the current IndexedDB repository as the local-only implementation.
2. Add an HTTP repository that implements the same methods:
   - `ensureDefaultChild`
   - `updateChild`
   - `createRecord`
   - `updateRecord`
   - `deleteRecord`
   - `listRecords`
   - `saveMedia`
   - `getMedia`
   - `exportAll`
3. Choose the repository by environment configuration.
4. Keep pages and most services unchanged.

The backend should avoid response shapes that require page components to know about transport details.

## Suggested Database Tables

The backend project can choose its own database. A relational schema maps cleanly to the current domain:

```text
households
children
records
media_assets
```

Suggested `children` fields:

```text
id
household_id
name
birthday
avatar_url
sex
created_at
updated_at
```

Suggested `records` fields:

```text
id
household_id
child_id
type
occurred_at
title
note
media_ids
payload_json
created_at
updated_at
deleted_at
```

Suggested `media_assets` fields:

```text
id
household_id
child_id
kind
content_type
size_bytes
storage_key
url
created_at
deleted_at
```

`payload_json` should be validated at the service layer according to `type`.

## Concurrency And Idempotency

For the REST MVP:

- The backend should return `updatedAt` on every mutable resource.
- `PATCH` may use last-write-wins in the MVP.
- Future versions can support optimistic concurrency with `If-Match` or a `version` field.

For create endpoints:

- The MVP can rely on server-generated IDs.
- Future mobile/offline clients may send a client-generated idempotency key.

## Future Sync Extension

Do not build sync in the first backend version, but keep the design compatible with it.

Future sync will likely need:

- Server-side `updatedAt` and `deletedAt`.
- Tombstones for deleted records.
- A `/sync/pull?since=...` endpoint.
- A `/sync/push` endpoint accepting client mutations.
- Conflict policy per resource type.
- Client-generated mutation IDs for idempotency.

This should be a separate project phase after the basic API is stable.

## Testing Expectations For Backend Project

Minimum backend test coverage:

- Child create, list, and patch.
- Record create, list, filter by type, patch, and delete.
- Payload validation for all six record types.
- Rejection of immutable record field changes.
- Media upload size and MIME checks.
- Export shape.
- Not-found and validation error response formats.

Recommended contract tests:

- Generate example `Child`, `BabyRecord`, and `MediaAsset` fixtures from this document.
- Verify the frontend HTTP repository can consume backend responses without adapting page components.

## Open Decisions For Backend Team

The backend project should decide these during implementation:

- Runtime and framework, such as Fastify, NestJS, Spring Boot, or Go.
- Database engine.
- Object storage provider for images.
- Temporary MVP household strategy.
- Whether the first deploy target is local-only, LAN, staging, or public cloud.

These decisions should not change the REST contract above.
