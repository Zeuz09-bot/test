# FlowDay — Complete Agent Specification Document

> **Purpose of this document:** This is the single source of truth for building FlowDay. It is written for AI coding agents and human developers alike. Every section covers what to build, why it exists, how it connects to everything else, how to verify it works, and how to debug it when it doesn't. Read the entire document before writing a single line of code.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Architectural Philosophy](#2-architectural-philosophy)
3. [System Architecture Diagram](#3-system-architecture-diagram)
4. [Tech Stack — Full 13-Layer Map](#4-tech-stack--full-13-layer-map)
5. [Project Structure](#5-project-structure)
6. [Database Schema](#6-database-schema)
7. [Data Sync Engine](#7-data-sync-engine)
8. [Feature Modules](#8-feature-modules)
9. [API Contracts](#9-api-contracts)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [Push Notifications](#11-push-notifications)
12. [CI/CD Pipeline](#12-cicd-pipeline)
13. [Error Tracking & Monitoring](#13-error-tracking--monitoring)
14. [Security Checklist](#14-security-checklist)
15. [Testing Strategy](#15-testing-strategy)
16. [Environment Configuration](#16-environment-configuration)
17. [Compatibility Matrix](#17-compatibility-matrix)
18. [Debugging Guide](#18-debugging-guide)
19. [Build & Release Guide](#19-build--release-guide)
20. [Glossary](#20-glossary)

---

## 1. Product Overview

### What is FlowDay?

FlowDay is a mobile-first personal productivity OS that replaces the 3–4 app setup most ambitious people run (to-do list + habit tracker + calendar + notes). It ties tasks, habits, goals, focus sessions, and daily reviews into one opinionated daily loop.

### The Core Daily Loop

```
Morning notification
  → Briefing screen (what's due, habits for today)
  → Day planner (time-block your tasks)
  → Execute tasks (enter focus mode per task)
  → Quick-capture notes during the day
  → Evening notification
  → Review screen (score, reschedule, streaks)
  → Repeat
```

### Key Design Principle

**Opinionated over flexible.** The app tells you what to do next. It does not give you a blank canvas. Every screen has a clear primary action. Complexity is hidden behind progressive disclosure.

### Target User

Someone with 3–10 ongoing goals, multiple daily commitments, and a track record of starting productivity systems but abandoning them because the setup overhead outweighed the value.

### MVP Scope (v1.0 — 8 weeks)

- Task creation with deadline, priority, goal link
- Day planner with hourly time-blocking
- Habit tracker with daily check-in and streaks
- Goal creation with progress tracking
- Morning briefing notification
- Evening review screen
- Local-first data (SQLite) with optional cloud sync
- Email + Google OAuth login

### v1.1 Scope (4 weeks post-MVP)

- Focus mode with Pomodoro timer + system DND
- Quick-capture notes with reminder scheduling
- Smart deadline alerts
- Weekly habit heatmap
- Milestone tracking on goals

---

## 2. Architectural Philosophy

### Local-First

**Rule:** The SQLite database on the device is the source of truth. The app must be 100% functional with no internet connection. Supabase is the sync target, not the primary store.

**Why:** Push notification reliability, offline use, and disaster recovery are all solved by this single decision. If Supabase goes down, users lose nothing.

**Implication for agents:** Every write operation touches SQLite first. Supabase writes happen asynchronously via a sync queue. Never block the UI waiting for a Supabase response.

### Unidirectional Data Flow

```
User Action → Zustand Store → SQLite → UI re-render
                                ↓ (async)
                           Sync Queue → Supabase
```

React Query handles Supabase reads for non-critical data (cloud-only analytics). Zustand + SQLite handle all core app state.

### Single Responsibility Per Module

Each feature module (tasks, habits, goals, focus, notes, review) owns its own:
- SQLite table(s)
- Zustand store slice
- Supabase table + RLS policies
- React Native screens
- Unit tests

Modules communicate through the Zustand store, never by importing each other's internal functions.

### No Over-Engineering at MVP

At MVP, avoid: microservices, message queues, GraphQL, WebSockets (Supabase Realtime is opt-in for v1.1). Use the simplest solution that works. Complexity is added in v1.1 and v1.2 when real usage patterns are understood.

---

## 3. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER'S DEVICE                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              React Native App (Expo)                 │   │
│  │                                                     │   │
│  │  ┌──────────────┐    ┌──────────────────────────┐  │   │
│  │  │  Expo Router │    │     Zustand Stores        │  │   │
│  │  │  (screens/   │◄──►│  tasks | habits | goals  │  │   │
│  │  │   navigation)│    │  focus | notes | auth     │  │   │
│  │  └──────────────┘    └──────────┬───────────────┘  │   │
│  │                                 │                    │   │
│  │  ┌──────────────────────────────▼───────────────┐  │   │
│  │  │           expo-sqlite (local DB)              │  │   │
│  │  │   tasks · habits · goals · notes · sessions  │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │         Sync Engine (background)              │  │   │
│  │  │   sync_queue table → Supabase REST API        │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                     │   │
│  │  ┌──────────────┐    ┌──────────────────────────┐  │   │
│  │  │     MMKV     │    │   expo-notifications      │  │   │
│  │  │  (prefs,     │    │   (scheduled local +      │  │   │
│  │  │   tokens)    │    │    Expo Push remote)      │  │   │
│  │  └──────────────┘    └──────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    HTTPS (TLS 1.3)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD (AWS)                      │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐ │
│  │  Supabase    │   │  PostgreSQL  │   │  Edge Functions│ │
│  │  Auth (JWT)  │   │  (replica)   │   │  (Deno runtime)│ │
│  │  + RLS       │   │  + RLS       │   │  - push sender │ │
│  └──────────────┘   └──────────────┘   │  - day scorer  │ │
│                                        │  - streak calc  │ │
│  ┌──────────────┐   ┌──────────────┐   └────────────────┘ │
│  │  Supabase    │   │  pg_cron     │                       │
│  │  Storage     │   │  (scheduled  │                       │
│  │  (avatars)   │   │   jobs)      │                       │
│  └──────────────┘   └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                               │
│                                                             │
│  Expo Push API ──► APNs (iOS) / FCM (Android)              │
│  Sentry ──────────► Error tracking + performance            │
│  PostHog ─────────► Product analytics                       │
│  GitHub Actions ──► CI/CD pipeline                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Tech Stack — Full 13-Layer Map

### Layer 1 — Frontend

| Item | Choice | Version |
|------|--------|---------|
| Framework | Expo (React Native) | SDK 51 |
| Language | TypeScript | 5.x |
| Navigation | Expo Router | v3 |
| UI Components | React Native Paper | v5 |
| Charts | Victory Native | v37 |
| State | Zustand | v4 |
| Server state | TanStack Query | v5 |
| Forms | React Hook Form + Zod | latest |
| Animations | React Native Reanimated | v3 |

**Agent note:** Use `npx create-expo-app@latest` with the TypeScript template. Do not use Expo Go for development — use a development build (`eas build --profile development`).

### Layer 2 — Backend

| Item | Choice |
|------|--------|
| Server runtime | Supabase Edge Functions (Deno) |
| Scheduled jobs | pg_cron (inside Supabase) |
| Business logic | Edge Functions for: push triggers, score computation, streak calculation |

**Agent note:** Edge Functions are deployed via `supabase functions deploy <name>`. They live in `supabase/functions/`. Each function is a separate Deno module.

### Layer 3 — Databases

| Item | Choice |
|------|--------|
| Local (primary) | expo-sqlite via `expo-sqlite` package |
| Cloud (replica) | Supabase PostgreSQL |
| Local prefs | MMKV (not SQLite — faster for key-value) |

**Agent note:** SQLite schema is managed by a migration runner in `src/db/migrations/`. Every schema change is a new numbered migration file. The cloud schema mirrors the local schema exactly, with added `user_id` foreign keys and `synced_at` timestamps.

### Layer 4 — APIs

| Item | Choice |
|------|--------|
| Client ↔ Supabase | Supabase JS client (`@supabase/supabase-js`) |
| Real-time (v1.1) | Supabase Realtime channels |
| Push notifications | Expo Push API (`https://exp.host/--/api/v2/push/send`) |

### Layer 5 — Caching

| Item | Choice | Purpose |
|------|--------|---------|
| MMKV | `@react-native-mmkv` | Auth tokens, user prefs, notification schedules |
| TanStack Query | in-memory | Supabase API response deduplication, stale-while-revalidate |
| SQLite | on-disk | All app data (the cache IS the DB) |

### Layer 6 — Load Balancing

Handled entirely by Supabase infrastructure (pgBouncer). No configuration needed. At 50k+ users, evaluate Supabase Pro plan connection limits and consider Neon.tech for dedicated Postgres.

### Layer 7 — Auth & Authorization

| Item | Choice |
|------|--------|
| Auth provider | Supabase Auth |
| Session storage | MMKV (encrypted) |
| Token type | JWT (access + refresh) |
| OAuth providers | Google (v1.0), Apple (v1.1 — required for iOS App Store) |
| Authorization model | Row-Level Security (RLS) on all Postgres tables |

**RLS rule (applies to every table):**
```sql
CREATE POLICY "users_own_data" ON <table>
  USING (auth.uid() = user_id);
```

### Layer 8 — Cloud Infrastructure

| Item | Choice |
|------|--------|
| Backend host | Supabase Cloud (AWS us-east-1) |
| Mobile build | Expo Application Services (EAS) |
| OTA updates | EAS Update |
| Asset CDN | Supabase Storage + Cloudflare |

### Layer 9 — CI/CD

See Section 12 for full pipeline detail.

| Trigger | Action |
|---------|--------|
| PR opened | Type-check, lint, unit tests |
| Merge to `main` | Staging EAS build + Supabase migration |
| Tag `v*.*.*` | Production build + App Store submit |

### Layer 10 — Rate Limiting

| Surface | Limit | Enforced by |
|---------|-------|-------------|
| Auth login attempts | 10/hour per IP | Supabase Auth |
| REST API | 500 req/min per project | Supabase gateway |
| Push sends | 100/sec | Expo Push API |
| Edge Functions | Per-user guard in function body | Custom middleware |

### Layer 11 — Security & Encryption

| Item | Implementation |
|------|---------------|
| Transport | TLS 1.3 (Supabase + Cloudflare) |
| Data at rest | AES-256 (Supabase managed RDS) |
| Local DB | SQLite file stored in app sandbox (iOS Secure Enclave, Android Keystore) |
| Secrets | EAS Secrets (build-time), Supabase Vault (runtime) |
| Auth tokens | MMKV with encryption enabled |

### Layer 12 — Error Tracking & Monitoring

| Tool | Purpose | Free tier |
|------|---------|-----------|
| Sentry | Crash reporting, performance | 5k errors/month |
| PostHog | Product analytics, funnels | 1M events/month |
| Supabase Dashboard | DB query logs, slow queries | Included |

### Layer 13 — Disaster Recovery

| Risk | Recovery mechanism |
|------|-------------------|
| Cloud DB failure | Local SQLite continues functioning; sync resumes on recovery |
| Bad OTA update | EAS Update channel rollback (instant, no store review) |
| Bad native build | App Store rollback via previous binary |
| Data corruption | Supabase PITR (7-day window on Pro plan) |
| User deletes account | 30-day soft-delete before hard purge |

---

## 5. Project Structure

```
flowday/
├── app/                          # Expo Router screens (file-based routing)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/
│   │   ├── index.tsx             # Home / briefing screen
│   │   ├── planner.tsx           # Day planner
│   │   ├── goals.tsx             # Goals & habits
│   │   └── review.tsx            # Evening review
│   ├── task/[id].tsx             # Task detail screen
│   ├── focus/[taskId].tsx        # Focus mode screen
│   └── _layout.tsx               # Root layout (auth gate)
│
├── src/
│   ├── db/                       # SQLite layer
│   │   ├── client.ts             # expo-sqlite connection singleton
│   │   ├── migrations/           # Numbered SQL migration files
│   │   │   ├── 001_initial.sql
│   │   │   ├── 002_focus_sessions.sql
│   │   │   └── runner.ts         # Applies pending migrations on app start
│   │   └── queries/              # Typed query functions per table
│   │       ├── tasks.ts
│   │       ├── habits.ts
│   │       ├── goals.ts
│   │       ├── notes.ts
│   │       └── focus_sessions.ts
│   │
│   ├── stores/                   # Zustand store slices
│   │   ├── taskStore.ts
│   │   ├── habitStore.ts
│   │   ├── goalStore.ts
│   │   ├── focusStore.ts
│   │   ├── noteStore.ts
│   │   └── authStore.ts
│   │
│   ├── sync/                     # Supabase sync engine
│   │   ├── queue.ts              # Enqueue/dequeue sync operations
│   │   ├── worker.ts             # Processes queue when online
│   │   └── conflict.ts           # Conflict resolution logic
│   │
│   ├── api/                      # Supabase client wrappers
│   │   ├── client.ts             # Supabase JS client singleton
│   │   ├── auth.ts               # Auth operations
│   │   └── sync.ts               # Cloud read/write helpers
│   │
│   ├── notifications/            # Push & local notifications
│   │   ├── scheduler.ts          # Schedule morning/evening alerts
│   │   ├── permissions.ts        # Request + check permissions
│   │   └── handlers.ts           # Handle notification tap actions
│   │
│   ├── components/               # Reusable UI components
│   │   ├── TaskCard.tsx
│   │   ├── HabitDot.tsx
│   │   ├── GoalProgressBar.tsx
│   │   ├── FocusTimer.tsx
│   │   ├── TimeBlock.tsx
│   │   └── DayScore.tsx
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useTasks.ts
│   │   ├── useHabits.ts
│   │   ├── useGoals.ts
│   │   ├── useFocus.ts
│   │   └── useSync.ts
│   │
│   ├── utils/
│   │   ├── dates.ts              # Date helpers (no moment.js — use date-fns)
│   │   ├── scoring.ts            # Day score calculation logic
│   │   ├── streaks.ts            # Habit streak calculation
│   │   └── uuid.ts               # Local UUID generation (crypto.randomUUID)
│   │
│   └── types/                    # Shared TypeScript types
│       ├── task.ts
│       ├── habit.ts
│       ├── goal.ts
│       ├── note.ts
│       ├── focus.ts
│       └── sync.ts
│
├── supabase/
│   ├── functions/                # Edge Functions (Deno)
│   │   ├── send-push/index.ts
│   │   ├── compute-score/index.ts
│   │   └── calculate-streaks/index.ts
│   ├── migrations/               # Cloud SQL migrations
│   │   └── 20240101000000_initial.sql
│   └── config.toml               # Supabase project config
│
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── e2e/                      # Detox tests
│
├── .github/
│   └── workflows/
│       ├── pr-checks.yml
│       └── deploy.yml
│
├── eas.json                      # EAS build profiles
├── app.json                      # Expo config
├── tsconfig.json
└── package.json
```

---

## 6. Database Schema

### Design Rules

1. Every local SQLite table has a UUID `id` column (generated client-side via `crypto.randomUUID()`).
2. Every cloud Postgres table has the same columns plus `user_id UUID REFERENCES auth.users(id)`.
3. Soft deletes everywhere — use `deleted_at TIMESTAMP` instead of hard deletes. This enables conflict-free sync.
4. All timestamps are stored as ISO 8601 strings in SQLite, as `TIMESTAMPTZ` in Postgres.
5. Booleans in SQLite are stored as INTEGER (0/1).

### SQLite Local Schema (migration 001)

```sql
-- Users (local cache of auth session)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('health','career','learning','finance','relationships','personal')),
  target_date TEXT,
  progress_pct REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','paused','archived')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_id TEXT REFERENCES goals(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','dropped')),
  deadline TEXT,
  scheduled_date TEXT,
  scheduled_start_time TEXT,
  estimated_minutes INTEGER,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT
);

-- Sub-tasks
CREATE TABLE IF NOT EXISTS subtasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT
);

-- Habits
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_id TEXT REFERENCES goals(id),
  title TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily','weekdays','weekends','custom')),
  custom_days TEXT,             -- JSON array e.g. "[1,3,5]" for Mon/Wed/Fri
  reminder_time TEXT,           -- "HH:MM" 24-hour format
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT
);

-- Habit logs (one row per day per habit)
CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES habits(id),
  user_id TEXT NOT NULL,
  log_date TEXT NOT NULL,       -- "YYYY-MM-DD"
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT,
  UNIQUE(habit_id, log_date)
);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_id TEXT REFERENCES goals(id),
  task_id TEXT REFERENCES tasks(id),
  content TEXT NOT NULL,
  reminder_at TEXT,
  reminder_sent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  synced_at TEXT
);

-- Focus sessions
CREATE TABLE IF NOT EXISTS focus_sessions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id),
  user_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  planned_minutes INTEGER NOT NULL DEFAULT 25,
  actual_minutes INTEGER,
  session_type TEXT NOT NULL DEFAULT 'pomodoro' CHECK (session_type IN ('pomodoro','freeform')),
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT
);

-- Day reviews
CREATE TABLE IF NOT EXISTS day_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  review_date TEXT NOT NULL,    -- "YYYY-MM-DD"
  tasks_total INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  habits_total INTEGER NOT NULL DEFAULT 0,
  habits_completed INTEGER NOT NULL DEFAULT 0,
  focus_minutes INTEGER NOT NULL DEFAULT 0,
  focus_sessions INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0, -- 0-100
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT,
  UNIQUE(user_id, review_date)
);

-- Sync queue (local only — not synced to cloud)
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload TEXT NOT NULL,        -- JSON stringified record
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline) WHERE deleted_at IS NULL AND status != 'completed';
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id, log_date);
CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue(attempts, created_at);
```

### Supabase PostgreSQL Schema

The cloud schema mirrors the local schema with additions:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Goals (cloud version)
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  target_date DATE,
  progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_goals" ON goals
  FOR ALL USING (auth.uid() = user_id);

-- (Repeat pattern for tasks, subtasks, habits, habit_logs, notes,
--  focus_sessions, day_reviews — same columns, same RLS policy pattern)

-- Updated_at trigger (apply to all tables)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Schema Compatibility Rule

**Critical:** When adding a column to the local SQLite schema, add it to the cloud Postgres schema in the same PR. Write both migrations together. CI will fail if either is missing.

---

## 7. Data Sync Engine

### Concept

The sync engine runs as a background service. It watches for records in the `sync_queue` table and pushes them to Supabase when the device is online. It is not a real-time bidirectional sync — it is a write-ahead log flusher.

### Write Path

```
User creates a task
  → task written to SQLite (tasks table)
  → sync_queue row inserted: { operation: 'INSERT', table: 'tasks', record_id: id, payload: JSON }
  → UI updates immediately from SQLite
  → Background: sync worker polls queue every 30 seconds
  → Worker sends payload to Supabase REST API
  → On success: sync_queue row deleted, task.synced_at updated
  → On failure: attempt count incremented, retry with exponential backoff
```

### Read Path (initial load / new device)

```
User logs in on new device
  → Auth token stored in MMKV
  → Supabase fetches all records for user_id where deleted_at IS NULL
  → Records written to local SQLite
  → App renders from SQLite
```

### Conflict Resolution

Strategy: **Last-write-wins by updated_at timestamp.**

```typescript
// src/sync/conflict.ts
export function resolveConflict(local: Record, remote: Record): Record {
  const localTime = new Date(local.updated_at).getTime();
  const remoteTime = new Date(remote.updated_at).getTime();
  return localTime >= remoteTime ? local : remote;
}
```

This is sufficient for v1.0. For v1.1, consider CRDTs for habit_logs (which are append-only and conflict-free by design).

### Sync Worker Implementation

```typescript
// src/sync/worker.ts
import NetInfo from '@react-native-community/netinfo';
import { getDb } from '../db/client';
import { supabase } from '../api/client';

const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 30_000;

export async function startSyncWorker() {
  setInterval(async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;
    await flushQueue();
  }, POLL_INTERVAL_MS);
}

async function flushQueue() {
  const db = getDb();
  const pending = await db.getAllAsync<SyncQueueRow>(
    `SELECT * FROM sync_queue WHERE attempts < ? ORDER BY created_at ASC LIMIT 50`,
    [MAX_ATTEMPTS]
  );

  for (const row of pending) {
    try {
      const payload = JSON.parse(row.payload);
      if (row.operation === 'DELETE') {
        await supabase.from(row.table_name).delete().eq('id', row.record_id);
      } else {
        await supabase.from(row.table_name).upsert(payload);
      }
      await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [row.id]);
      await db.runAsync(
        `UPDATE ${row.table_name} SET synced_at = ? WHERE id = ?`,
        [new Date().toISOString(), row.record_id]
      );
    } catch (err) {
      await db.runAsync(
        `UPDATE sync_queue SET attempts = attempts + 1, last_attempt_at = ? WHERE id = ?`,
        [new Date().toISOString(), row.id]
      );
    }
  }
}
```

### Debugging Sync

- Check `sync_queue` table in SQLite for stuck rows (attempts >= 5)
- Check `synced_at IS NULL` on any records table to find unsynced rows
- Enable Supabase dashboard logs to see incoming requests
- Use `NetInfo` debug screen (dev only) to simulate offline/online transitions

---

## 8. Feature Modules

### Module 1: Tasks

**Purpose:** Create, schedule, prioritize, and complete work items. Tasks are the atomic unit of FlowDay — everything else (goals, habits, focus, review) relates to tasks.

**SQLite tables:** `tasks`, `subtasks`

**Zustand store:** `taskStore.ts`

```typescript
interface TaskStore {
  tasks: Task[];
  todaysTasks: Task[];          // derived: scheduled_date = today
  overdueTasks: Task[];          // derived: deadline < today AND status != completed
  loadTasks: () => Promise<void>;
  createTask: (data: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  scheduleTask: (id: string, date: string, startTime?: string) => Promise<void>;
}
```

**Business rules:**
- A task with a `deadline` of today that is not `scheduled_date = today` triggers a smart alert notification.
- `completed_at` is set when status changes to 'completed'. Never manually editable.
- Soft delete: `deleted_at` set on delete; filtered out of all queries with `WHERE deleted_at IS NULL`.
- Priority order for display: high → medium → low, then by deadline ASC.

**Screens:** Task list (embedded in Home), Task detail (`/task/[id]`)

**Key queries:**

```typescript
// src/db/queries/tasks.ts

// Get today's tasks
export async function getTodaysTasks(db: SQLiteDatabase): Promise<Task[]> {
  const today = new Date().toISOString().split('T')[0];
  return db.getAllAsync<Task>(
    `SELECT t.*, g.title as goal_title, g.category as goal_category
     FROM tasks t
     LEFT JOIN goals g ON t.goal_id = g.id
     WHERE t.scheduled_date = ? AND t.deleted_at IS NULL
     ORDER BY
       CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
       t.deadline ASC NULLS LAST`,
    [today]
  );
}
```

---

### Module 2: Habits

**Purpose:** Track daily repeating behaviors. Streaks are the primary motivation mechanic — the visual streak count is the retention hook.

**SQLite tables:** `habits`, `habit_logs`

**Business rules:**
- A habit log for today is created (completed = 0) when the app opens each morning, for every active habit that is scheduled for today.
- Streak calculation: consecutive days where `completed = 1` going backwards from today. If today is not yet completed, the streak is from yesterday backwards.
- If a day is missed, streak resets to 0.
- Habits have a `reminder_time` — a local push notification is scheduled at that time daily.

**Streak algorithm:**

```typescript
// src/utils/streaks.ts
export function calculateStreak(logs: HabitLog[], today: string): number {
  const sorted = logs
    .filter(l => l.completed)
    .sort((a, b) => b.log_date.localeCompare(a.log_date));

  if (sorted.length === 0) return 0;

  let streak = 0;
  let current = today;

  // Walk backwards through dates
  for (const log of sorted) {
    if (log.log_date === current || log.log_date === getPreviousDay(current)) {
      streak++;
      current = log.log_date;
    } else {
      break;
    }
  }
  return streak;
}
```

---

### Module 3: Goals

**Purpose:** Provide the "why" behind tasks and habits. Every task and habit can be linked to a goal. Goals have a progress percentage that is derived (not manually set) from linked task completion.

**SQLite tables:** `goals`

**Business rules:**
- `progress_pct` is computed as: `completed tasks / total non-deleted tasks linked to goal × 100`.
- Goals have a `status`: active, completed (auto-set when progress_pct = 100), paused, archived.
- Goals display with a color corresponding to their `category` (health=green, career=blue, learning=purple, finance=amber, relationships=pink, personal=teal).
- A goal with no linked tasks shows 0% progress.

**Progress update trigger:**

```typescript
// Called after every task status change
export async function recomputeGoalProgress(goalId: string, db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ total: number; completed: number }>(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
     FROM tasks
     WHERE goal_id = ? AND deleted_at IS NULL`,
    [goalId]
  );
  const pct = result?.total > 0 ? (result.completed / result.total) * 100 : 0;
  await db.runAsync(`UPDATE goals SET progress_pct = ?, updated_at = ? WHERE id = ?`, [
    Math.round(pct), new Date().toISOString(), goalId
  ]);
  // Also enqueue sync
  enqueueSync('UPDATE', 'goals', goalId, { progress_pct: Math.round(pct) });
}
```

---

### Module 4: Focus Mode

**Purpose:** Distraction-free task execution. Implements Pomodoro timing with system DND integration. This is the feature that differentiates FlowDay from a plain to-do app.

**SQLite tables:** `focus_sessions`

**Business rules:**
- A session is created when the user taps "Start focus." `started_at` is recorded immediately.
- Default session: 25 minutes work, 5 minutes break. After 4 sessions: 15-minute long break.
- System DND is enabled via `expo-intent-launcher` (Android) and `react-native-do-not-disturb` (iOS). If permissions are denied, the timer still runs without DND.
- `completed = 1` only if the timer completes naturally. If the user exits early, `completed = 0` and `actual_minutes` reflects real time spent.
- When a session completes, the task's `status` is NOT automatically set to complete — the user must explicitly check it off.

**Session state machine:**

```
IDLE → RUNNING → BREAK → RUNNING (repeat) → LONG_BREAK → IDLE
         ↓                  ↓
      PAUSED            EARLY_EXIT
         ↓
      RUNNING
```

---

### Module 5: Notes

**Purpose:** Quick idea capture with optional reminders. Notes can be linked to a task or goal, or stand alone. Notes are the "inbox" of FlowDay — captured fast, organized later.

**SQLite tables:** `notes`

**Business rules:**
- Notes are created from a bottom sheet FAB available on every screen.
- If `reminder_at` is set, a local push notification is scheduled at that time.
- Notes can be promoted to tasks via a "Convert to task" action.
- Notes are never auto-deleted. Users must explicitly delete.

---

### Module 6: Day Review

**Purpose:** Close the daily loop. Compute the day score, surface incomplete tasks for rescheduling, update habit streaks, and show goal progress. Triggered by the evening notification.

**SQLite tables:** `day_reviews`

**Day score algorithm:**

```typescript
// src/utils/scoring.ts
export function computeDayScore(input: {
  tasksTotal: number;
  tasksCompleted: number;
  habitsTotal: number;
  habitsCompleted: number;
  focusMinutes: number;
}): number {
  if (input.tasksTotal === 0 && input.habitsTotal === 0) return 0;

  const taskScore = input.tasksTotal > 0
    ? (input.tasksCompleted / input.tasksTotal) * 50    // 50% weight
    : 25; // neutral if no tasks

  const habitScore = input.habitsTotal > 0
    ? (input.habitsCompleted / input.habitsTotal) * 35  // 35% weight
    : 17.5;

  const focusScore = Math.min(input.focusMinutes / 120, 1) * 15; // 15% weight, cap at 2hrs

  return Math.round(taskScore + habitScore + focusScore);
}
```

---

## 9. API Contracts

### Supabase REST (auto-generated)

All endpoints follow the pattern: `https://<project-ref>.supabase.co/rest/v1/<table>`

The Supabase JS client abstracts these. Use the client, not raw fetch.

```typescript
// src/api/client.ts
import { createClient } from '@supabase/supabase-js';
import { MMKV } from 'react-native-mmkv';
import type { Database } from '../types/supabase'; // generated by supabase gen types

const storage = new MMKV({ id: 'supabase-auth' });

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: {
        getItem: (key) => storage.getString(key) ?? null,
        setItem: (key, val) => storage.set(key, val),
        removeItem: (key) => storage.delete(key),
      },
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
```

### Edge Function: send-push

**Trigger:** Called by pg_cron at scheduled times, or on-demand from app.

**Input:**
```json
{
  "user_id": "uuid",
  "type": "morning_briefing" | "evening_review" | "deadline_alert" | "habit_reminder",
  "data": {
    "tasks_due": 3,
    "habits_today": 5,
    "task_title": "string (for deadline_alert)"
  }
}
```

**Output:**
```json
{ "sent": true, "ticket_id": "string" }
```

**Implementation:** Reads the user's Expo push token from the `push_tokens` table, calls `https://exp.host/--/api/v2/push/send`.

### Edge Function: compute-score

**Trigger:** Called by the app at end of day when the review screen loads.

**Input:** `{ user_id: string, date: string }` (YYYY-MM-DD)

**Output:** Full `DayReview` record including computed score.

---

## 10. Authentication & Authorization

### Auth Flow

```
App launch
  → Check MMKV for valid session token
  → If valid: go to Home screen, start sync worker
  → If expired: call supabase.auth.refreshSession()
  → If refresh fails: go to Login screen
  → If no token: go to Login screen

Login
  → Email/password: supabase.auth.signInWithPassword()
  → Google OAuth: supabase.auth.signInWithOAuth({ provider: 'google' })
  → On success: store session in MMKV, navigate to Home

Logout
  → supabase.auth.signOut()
  → Clear MMKV auth keys
  → Clear Zustand stores
  → Navigate to Login
  → DO NOT clear SQLite (offline data preserved)
```

### Auth Guard (Expo Router layout)

```typescript
// app/_layout.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function RootLayout() {
  const { session, loading } = useAuthStore();
  if (loading) return <SplashScreen />;
  if (!session) return <Redirect href="/(auth)/login" />;
  return <Slot />;  // render child routes
}
```

### RLS Verification

After any schema change, verify RLS is working:

```sql
-- Test as anonymous user (should return 0 rows)
SET role anon;
SELECT * FROM tasks;

-- Test as authenticated user (should return only their rows)
SET request.jwt.claim.sub = 'user-uuid-here';
SET role authenticated;
SELECT * FROM tasks;
```

---

## 11. Push Notifications

### Architecture

```
Two types of notifications:

1. LOCAL (scheduled on-device, no server needed)
   - Habit reminders (daily at habit.reminder_time)
   - Note reminders (at note.reminder_at)
   - These survive offline mode perfectly

2. REMOTE (sent via Expo Push API from Edge Function)
   - Morning briefing (user's configured time)
   - Evening review prompt (user's configured time)
   - Smart deadline alerts (computed server-side)
```

### Permission Request Flow

```typescript
// src/notifications/permissions.ts
import * as Notifications from 'expo-notifications';

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}
```

### Scheduling a Habit Reminder

```typescript
// src/notifications/scheduler.ts
import * as Notifications from 'expo-notifications';

export async function scheduleHabitReminder(habit: Habit) {
  if (!habit.reminder_time) return;
  const [hour, minute] = habit.reminder_time.split(':').map(Number);

  await Notifications.cancelScheduledNotificationAsync(`habit-${habit.id}`);
  await Notifications.scheduleNotificationAsync({
    identifier: `habit-${habit.id}`,
    content: {
      title: 'Habit reminder',
      body: `Time for: ${habit.title}`,
      data: { type: 'habit_reminder', habitId: habit.id },
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}
```

### Registering Push Token

```typescript
// Called once after auth
export async function registerPushToken(userId: string) {
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });
  await supabase.from('push_tokens').upsert({
    user_id: userId,
    token: token.data,
    platform: Platform.OS,
    updated_at: new Date().toISOString(),
  });
}
```

---

## 12. CI/CD Pipeline

### PR Checks (`.github/workflows/pr-checks.yml`)

Runs on every pull request to `main`:

```yaml
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx tsc --noEmit          # TypeScript type check
      - run: npx eslint . --max-warnings 0  # Lint (zero warnings)
      - run: npx jest --coverage        # Unit tests
      - run: npx supabase db diff       # Verify migrations are consistent
```

### Deploy Pipeline (`.github/workflows/deploy.yml`)

```yaml
on:
  push:
    branches: [main]     # → staging build
    tags: ['v*.*.*']     # → production build + submit

jobs:
  staging:
    if: github.ref == 'refs/heads/main'
    steps:
      - run: npx supabase db push --linked   # Apply DB migrations
      - run: npx eas build --platform all --profile staging --non-interactive
      - run: npx eas update --branch staging --message "${{ github.sha }}"

  production:
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - run: npx supabase db push --linked
      - run: npx eas build --platform all --profile production --non-interactive
      - run: npx eas submit --platform all --latest
```

### EAS Build Profiles (`eas.json`)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_ENV": "development" }
    },
    "staging": {
      "distribution": "internal",
      "env": { "APP_ENV": "staging" },
      "android": { "buildType": "apk" }
    },
    "production": {
      "distribution": "store",
      "env": { "APP_ENV": "production" }
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "your@apple.id", "ascAppId": "123456789" },
      "android": { "serviceAccountKeyPath": "./google-service-account.json" }
    }
  }
}
```

---

## 13. Error Tracking & Monitoring

### Sentry Setup

```typescript
// app/_layout.tsx (root)
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.APP_ENV,
  tracesSampleRate: process.env.APP_ENV === 'production' ? 0.1 : 1.0,
  enableAutoSessionTracking: true,
  enableNativeFramesTracking: true,
});
```

### What to Track

| Event | How |
|-------|-----|
| Unhandled JS errors | Automatic (Sentry default) |
| Sync failures | `Sentry.captureException(err, { tags: { module: 'sync' } })` |
| Slow SQLite queries | Sentry Performance spans around query execution |
| Notification failures | Capture with push token as context |
| Auth errors | Capture with error code, no PII |

### PostHog Events

```typescript
// Key product events to track
posthog.capture('task_created', { priority, has_goal: !!goal_id, has_deadline: !!deadline });
posthog.capture('task_completed', { time_to_complete_hours });
posthog.capture('habit_checked_in', { habit_id, current_streak });
posthog.capture('focus_session_completed', { duration_minutes, task_id });
posthog.capture('day_review_opened', { score, tasks_completed, habits_completed });
```

---

## 14. Security Checklist

Before every production release, verify:

- [ ] All Postgres tables have RLS enabled and policies applied
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in client-side code (only anon key)
- [ ] All environment variables use `EXPO_PUBLIC_` prefix for client vars, EAS Secrets for build vars
- [ ] MMKV storage initialized with encryption (`encryptionKey` from Keychain/Keystore)
- [ ] No user PII logged to Sentry (scrub email, name from breadcrumbs)
- [ ] Push tokens stored with user_id FK — no orphaned tokens
- [ ] Auth token refresh tested: expire token manually, verify app auto-refreshes
- [ ] Soft delete verified: deleted records don't appear in any query
- [ ] SQL injection impossible: all SQLite queries use parameterized `?` placeholders
- [ ] Deep links validated: Expo Router handles only known routes

---

## 15. Testing Strategy

### Unit Tests (Jest)

Target: all utility functions, store actions, and query builders.

```
__tests__/unit/
├── utils/scoring.test.ts       # Day score edge cases
├── utils/streaks.test.ts       # Streak calculation with gaps
├── utils/dates.test.ts         # Timezone-safe date helpers
├── stores/taskStore.test.ts    # CRUD operations with mocked DB
└── sync/conflict.test.ts       # Conflict resolution logic
```

**Critical test cases:**
- Score = 0 when no tasks and no habits
- Streak resets correctly after a missed day
- Sync queue handles 5 consecutive failures gracefully
- RLS: user A cannot read user B's data (integration test against Supabase local)

### Integration Tests

Run against Supabase local (`supabase start`):

```typescript
// __tests__/integration/sync.test.ts
it('syncs a task to Supabase after creation', async () => {
  const task = await taskStore.createTask({ title: 'Test', priority: 'high' });
  await flushQueue();
  const { data } = await supabase.from('tasks').select().eq('id', task.id);
  expect(data).toHaveLength(1);
  expect(data![0].title).toBe('Test');
});
```

### E2E Tests (Detox)

Cover the 3 critical flows:

1. Sign up → set goals → set habits → see home screen
2. Create task → schedule it → enter focus mode → complete it → see it marked done
3. Open evening review → see score → reschedule incomplete task

---

## 16. Environment Configuration

### `.env.local` (development — never commit)

```bash
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...local_anon_key
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/yyy
EXPO_PUBLIC_POSTHOG_KEY=phc_xxx
APP_ENV=development
```

### EAS Secrets (staging + production)

Set via `eas secret:create`:

```bash
eas secret:create --scope project --name SUPABASE_URL --value https://xxx.supabase.co
eas secret:create --scope project --name SUPABASE_ANON_KEY --value eyJ...
eas secret:create --scope project --name SENTRY_DSN --value https://...
eas secret:create --scope project --name POSTHOG_KEY --value phc_...
```

### `app.json` Extra Config

```json
{
  "expo": {
    "extra": {
      "eas": { "projectId": "your-eas-project-id" },
      "supabaseUrl": "$SUPABASE_URL",
      "supabaseAnonKey": "$SUPABASE_ANON_KEY"
    }
  }
}
```

---

## 17. Compatibility Matrix

### Package Compatibility (verified)

| Package | Version | Compatible with Expo SDK 51 | Notes |
|---------|---------|----------------------------|-------|
| expo-sqlite | ~14.0.0 | Yes | New API (not legacy SQLite) |
| @supabase/supabase-js | ^2.43.0 | Yes | Use with custom MMKV storage |
| react-native-mmkv | ^2.12.0 | Yes | Requires new architecture |
| @tanstack/react-query | ^5.40.0 | Yes | |
| zustand | ^4.5.0 | Yes | |
| react-native-reanimated | ~3.10.0 | Yes | Must be in babel.config.js |
| expo-notifications | ~0.28.0 | Yes | Background handler required |
| @sentry/react-native | ~5.22.0 | Yes | |
| victory-native | ^37.0.0 | Yes | Requires Skia |

### New Architecture (Fabric/TurboModules)

Expo SDK 51 has New Architecture enabled by default. Packages that do NOT support it:

- `react-native-do-not-disturb` — use `expo-intent-launcher` instead for DND on Android; iOS DND requires `react-native-focus-mode` (test carefully)
- Avoid any package with `NativeModules` in its source that hasn't been updated since 2023

### iOS vs Android Differences

| Feature | iOS | Android |
|---------|-----|---------|
| DND mode | Focus mode API (limited) | Full DND via NotificationManager |
| Push tokens | APNs device token | FCM token |
| Scheduled notifications | Works in background | Requires exact alarm permission (Android 12+) |
| SQLite location | App sandbox (encrypted) | App private dir |
| Background tasks | 30-second limit | More flexible with WorkManager |

---

## 18. Debugging Guide

### SQLite Issues

**Symptom:** App crashes on startup with "no such table"
**Cause:** Migration runner didn't run, or ran in wrong order
**Fix:** Check `src/db/migrations/runner.ts`. Add console.log around each migration execution. Verify migration numbers are sequential.

**Symptom:** Data visible in one screen but not another
**Cause:** Stale Zustand store — store loaded before migration completed
**Fix:** Ensure `loadTasks()` (and equivalent) is called AFTER `runMigrations()` completes in app startup sequence.

**Symptom:** SQLite writes succeed but sync queue is empty
**Cause:** `enqueueSync()` not called after write, or called with wrong table name
**Fix:** Check each `db.runAsync` in query files — every write should be followed by `enqueueSync()`.

### Sync Issues

**Symptom:** Data on device but not in Supabase
**Fix steps:**
1. Open SQLite Explorer (Expo Dev Tools) — check `sync_queue` table
2. If rows exist with `attempts >= 5`, log the `payload` — likely a schema mismatch
3. Check Supabase Dashboard → Logs for rejected requests (401 = bad token, 400 = schema mismatch, 403 = RLS failure)
4. Verify the Supabase table has the same columns as the SQLite payload

**Symptom:** Sync succeeds but wrong data in Supabase
**Cause:** Conflict resolution picked remote over local incorrectly
**Fix:** Add logging to `resolveConflict()`. Check `updated_at` timestamp accuracy — if device clock is wrong, timestamps are wrong.

### Auth Issues

**Symptom:** User gets logged out randomly
**Cause:** JWT refresh failing silently
**Fix:** Add `supabase.auth.onAuthStateChange` listener in `authStore.ts`. Log every state change in development. Check MMKV for corrupted token data.

**Symptom:** RLS policy rejecting valid user requests
**Fix:** In Supabase SQL editor: `SELECT auth.uid();` — if null, token is not being passed. Check `Authorization: Bearer <token>` header in network tab.

### Notification Issues

**Symptom:** Notifications not appearing
**Fix steps:**
1. Check `expo-notifications` permission status — `Notifications.getPermissionsAsync()`
2. Verify `Notifications.setNotificationHandler` is set in `app/_layout.tsx`
3. For local: check `Notifications.getAllScheduledNotificationsAsync()` — is the notification in the list?
4. For remote: check Expo push receipt API for delivery status

**Symptom:** Notification taps don't navigate correctly
**Fix:** Verify `Notifications.addNotificationResponseReceivedListener` is set up and calls `router.push()` with the correct route.

### Build Issues

**Symptom:** EAS build fails with "missing native module"
**Fix:** The package requires a native build — cannot use Expo Go. Confirm `eas build --profile development` was used for testing, not `expo start`.

**Symptom:** TypeScript errors only in CI
**Cause:** Local TypeScript version differs from CI
**Fix:** Pin TypeScript in `package.json` with exact version (`"typescript": "5.4.5"` not `"^5.4.5"`).

---

## 19. Build & Release Guide

### Initial Setup (one-time)

```bash
# Install Expo CLI and EAS CLI
npm install -g expo-cli eas-cli

# Login to EAS
eas login

# Initialize project
npx create-expo-app@latest flowday --template expo-template-blank-typescript
cd flowday

# Link to EAS project
eas init

# Initialize Supabase
npx supabase init
npx supabase start   # Starts local Supabase (Docker required)

# Install all packages
npm install @supabase/supabase-js expo-sqlite react-native-mmkv \
  zustand @tanstack/react-query expo-notifications expo-router \
  react-native-paper victory-native @sentry/react-native \
  posthog-react-native react-hook-form zod date-fns \
  @react-native-community/netinfo
```

### Daily Development Workflow

```bash
# Start local Supabase
npx supabase start

# Start Expo development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Run tests
npx jest --watch

# Check types
npx tsc --noEmit --watch
```

### Deploying a New Version

```bash
# 1. Run full test suite
npx jest

# 2. Apply DB migrations to production Supabase
npx supabase db push --linked

# 3. Tag the release
git tag v1.0.0
git push origin v1.0.0

# 4. GitHub Actions triggers production build automatically
# Monitor at: https://expo.dev/accounts/[account]/projects/flowday/builds
```

### OTA Update (JS-only fix, no store review)

```bash
# Deploy a JS bundle update to all production users
npx eas update --branch production --message "Fix: habit streak calculation"

# Rollback if bad
npx eas update --branch production --message "Rollback" --republish --groupId <previous-group-id>
```

---

## 20. Glossary

| Term | Definition |
|------|-----------|
| Local-first | Architecture where the device SQLite DB is the source of truth; cloud is a replica |
| Sync queue | SQLite table (`sync_queue`) that buffers writes until they can be flushed to Supabase |
| RLS | Row-Level Security — Postgres feature that enforces data access rules at the DB layer |
| EAS | Expo Application Services — Expo's build and submit infrastructure |
| OTA update | Over-the-air JS bundle update via EAS Update; no App Store review needed |
| MMKV | Mobile Memory Key-Value — fast on-device key-value storage (10× faster than AsyncStorage) |
| JWT | JSON Web Token — Supabase Auth issues these; stored in MMKV, sent as Bearer token |
| pg_cron | PostgreSQL extension for scheduling SQL jobs (used for timed push notifications) |
| PITR | Point-in-Time Recovery — Supabase Pro feature for restoring DB to any past moment |
| Soft delete | Setting `deleted_at` instead of removing a row — enables conflict-free sync and data recovery |
| Day score | 0–100 score computed from task completion (50%), habit completion (35%), focus time (15%) |
| Streak | Consecutive days a habit was completed; resets to 0 on first missed day |
| Conflict resolution | When local and remote versions of the same record differ, the newer `updated_at` wins |
| DND | Do Not Disturb — system-level notification silence activated during focus sessions |
| Pomodoro | Work/break timing technique: 25 min work, 5 min break, repeat; 15 min break after 4 cycles |
| Focus session | A timed block of single-task work tracked in the `focus_sessions` table |
| Briefing | The morning home screen state showing today's tasks, deadlines, and habits |
| Day review | The evening screen summarizing the day's score, incomplete tasks, and streaks |
| Enqueue sync | The act of inserting a row into `sync_queue` after a local SQLite write |
| Edge Function | Server-side Deno function deployed to Supabase — handles push sends, score computation |

---

*Document version: 1.0 | Generated for FlowDay MVP build*
*Last updated: June 2026*
*Owner: FlowDay engineering*
