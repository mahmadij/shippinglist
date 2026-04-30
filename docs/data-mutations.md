# Data Mutations

## Overview

Data mutations follow a two-layer pattern:

1. **Helper functions** in `src/data/` — thin wrappers around Drizzle ORM calls. They own the database logic.
2. **Server Actions** in colocated `actions.ts` files — they validate input, resolve the current user, call helper functions, and revalidate the cache.

No mutation logic belongs anywhere else.

---

## Layer 1: Helper Functions in `src/data/`

Every database write must be a named export in the appropriate `src/data/*.ts` file. The file layout mirrors the fetching helpers:

```
src/
  data/
    shopping-lists.ts   ← create/update/delete for shopping lists
    items.ts            ← create/update/delete for items
    users.ts            ← user upsert, profile updates
    ...
```

**Rules:**

- Use **Drizzle ORM** exclusively — no raw SQL, no `db.execute`, no `sql` tagged template literals.
- Each function accepts the current user's internal DB `userId` as an explicit parameter — never resolve identity inside the helper.
- Accept plain typed parameters, not `FormData` or request objects.
- Return the mutated record(s) or `void`. Never return a Drizzle query builder instance.
- Name functions with a verb prefix: `createShoppingList`, `updateListItem`, `deleteListMember`, etc.

```ts
// src/data/shopping-lists.ts  ✅
import { db } from '@/db';
import { shoppingLists, listMembers } from '@/db/schema';

export async function createShoppingList(
  name: string,
  userId: number,
) {
  const [list] = await db
    .insert(shoppingLists)
    .values({ name, createdBy: userId, updatedBy: userId })
    .returning();

  await db.insert(listMembers).values({
    listId: list.id,
    userId,
    role: 'owner',
  });

  return list;
}

export async function deleteShoppingList(listId: number, userId: number) {
  await db
    .delete(shoppingLists)
    .where(
      and(
        eq(shoppingLists.id, listId),
        eq(shoppingLists.createdBy, userId),
      ),
    );
}
```

---

## Layer 2: Server Actions in `actions.ts`

Every mutation triggered from the UI must go through a **Server Action**. Server Actions live in a file named `actions.ts` colocated with the route or feature that uses them.

```
src/app/
  dashboard/
    actions.ts          ← server actions for the dashboard route
    page.tsx
    DashboardClient.tsx
  lists/
    [id]/
      actions.ts        ← server actions for the list detail route
      page.tsx
```

### Rules

**1. Mark the file with `'use server'`**

```ts
'use server';
```

**2. Type all parameters explicitly — never use `FormData`**

```ts
// ❌ Wrong
export async function createList(data: FormData) { ... }

// ✅ Correct
export async function createList(name: string) { ... }
```

**3. Validate every argument with Zod before touching the database**

Define the schema inline above the action. Parse with `schema.parse(...)` — this throws automatically on invalid input, which is the correct behavior for a server action.

```ts
import { z } from 'zod';

const createListSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function createList(name: string) {
  const { name: validatedName } = createListSchema.parse({ name });
  // ...
}
```

**4. Resolve the current user inside the action, not in the helper**

```ts
import { getCurrentUserId } from '@/data/users';

export async function createList(name: string) {
  const { name: validatedName } = createListSchema.parse({ name });
  const userId = await getCurrentUserId();
  await createShoppingList(validatedName, userId);
}
```

**5. Revalidate after every mutation**

Use `revalidatePath` (or `revalidateTag` if you have tagged caches) after a successful write so Server Components re-render with fresh data.

```ts
import { revalidatePath } from 'next/cache';

export async function createList(name: string) {
  const { name: validatedName } = createListSchema.parse({ name });
  const userId = await getCurrentUserId();
  await createShoppingList(validatedName, userId);
  revalidatePath('/dashboard');
}
```

**6. Return a typed result object**

Server Actions should return a discriminated union so Client Components can handle success and error states without try/catch.

```ts
export async function createList(
  name: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const result = createListSchema.safeParse({ name });
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const userId = await getCurrentUserId();
  await createShoppingList(result.data.name, userId);
  revalidatePath('/dashboard');
  return { success: true };
}
```

---

## Authorization in Mutations

The helper function is responsible for scoping writes to what the user is allowed to modify — just as queries are scoped to what the user is allowed to read.

- **Ownership checks belong in the helper**, in the `WHERE` clause — not in the action, and never in the component.
- A user may mutate a record only if they created it or hold a role that permits the operation (`owner` or `editor` for most writes).

```ts
// ❌ Wrong — checks ownership after the fact in the action
const list = await getList(listId);
if (list.createdBy !== userId) throw new Error('Forbidden');
await db.delete(shoppingLists).where(eq(shoppingLists.id, listId));

// ✅ Correct — authorization is baked into the DELETE condition
export async function deleteShoppingList(listId: number, userId: number) {
  await db
    .delete(shoppingLists)
    .where(
      and(
        eq(shoppingLists.id, listId),
        eq(shoppingLists.createdBy, userId),
      ),
    );
}
```

If the `WHERE` clause matches zero rows (the user doesn't own the record), the delete is a no-op — which is the correct safe behavior.

---

## Full Example

```ts
// src/data/shopping-lists.ts
import { db } from '@/db';
import { shoppingLists } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function updateShoppingListName(
  listId: number,
  name: string,
  userId: number,
) {
  const [updated] = await db
    .update(shoppingLists)
    .set({ name, updatedBy: userId, updatedAt: new Date() })
    .where(
      and(
        eq(shoppingLists.id, listId),
        eq(shoppingLists.createdBy, userId),
      ),
    )
    .returning();

  return updated ?? null;
}
```

```ts
// src/app/lists/[id]/actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/data/users';
import { updateShoppingListName } from '@/data/shopping-lists';

const renameListSchema = z.object({
  listId: z.number().int().positive(),
  name: z.string().min(1).max(100),
});

export async function renameList(
  listId: number,
  name: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const result = renameListSchema.safeParse({ listId, name });
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const userId = await getCurrentUserId();
  const updated = await updateShoppingListName(result.data.listId, result.data.name, userId);

  if (!updated) {
    return { success: false, error: 'List not found or permission denied.' };
  }

  revalidatePath(`/lists/${listId}`);
  return { success: true };
}
```

---

## Summary

| Concern | Where it lives |
|---|---|
| Database write logic | `src/data/*.ts` helper function |
| Authorization filter | Inside the `src/data/` helper, in the `WHERE` clause |
| Input validation | Zod schema in the `actions.ts` file |
| User identity resolution | Inside the Server Action, passed to the helper |
| Cache revalidation | Inside the Server Action, after a successful write |
| Triggering mutations from the UI | Server Action imported from colocated `actions.ts` |
| ORM | Drizzle only — no raw SQL |
| Action parameter types | Explicit TypeScript types — no `FormData` |
