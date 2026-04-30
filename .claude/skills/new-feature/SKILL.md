---
description: Implement a new user-facing feature in this shopping list app, following all project conventions. Use when asked to build or add a new capability.
arguments:
  - name: description
    description: Plain-English description of the feature to implement
---

You are implementing a new feature in this Next.js 16 App Router shopping list app.

## Step 1 — Read before writing

Read these files in full before writing a single line of code:
- docs/ui.md
- docs/data-mutations.md
- docs/data-fetching.md
- docs/auth.md
- src/db/schema.ts

## Step 2 — Understand the feature

Feature to implement: $ARGUMENTS

Identify:
- What database schema changes are needed (if any)
- What data helper functions are needed in `src/data/`
- What server actions are needed
- What UI components are needed and where they live

State your plan in one short paragraph before touching any files.

## Step 3 — Implement in this order

1. Schema changes (`src/db/schema.ts`) if needed
2. Data helpers (`src/data/*.ts`) — Drizzle only, no raw SQL
3. Server action (colocated `actions.ts`) — typed params, Zod validation, revalidatePath
4. UI components — shadcn/ui only, no raw HTML elements
5. Wire components into the relevant page

## Step 4 — Verify

Run `npm run build`. Fix every TypeScript error before reporting done.
