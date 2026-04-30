# Data Fetching

## The One Rule

All data fetching happens in **Server Components only**. No exceptions.

- Do not create Route Handlers (`route.ts`) to fetch and return data.
- Do not fetch data inside Client Components (`'use client'`) via `useEffect`, `fetch`, or any other mechanism.
- Do not use SWR, React Query, or any client-side data-fetching library.

If a Client Component needs data, fetch it in the nearest Server Component ancestor and pass it down as props.

---

## Helper Functions in `/data`

Every database query must live in a helper function inside the `src/data/` directory — not inline in a component.

```
src/
  data/
    shopping-lists.ts   ← queries for shopping lists
    items.ts            ← queries for items
    users.ts            ← queries for users
    ...
```

**Rules for helper functions:**

- Use **Drizzle ORM** exclusively. No raw SQL (`db.execute`, `sql` tagged template literals, or string queries).
- Each function accepts the current user's internal DB `userId` as a parameter — never derive identity inside the helper.
- Return plain objects or arrays, not Drizzle query builder instances.
- Name functions descriptively: `getShoppingListsForUser`, `getListWithItems`, `getListMembers`, etc.

```ts
// src/data/shopping-lists.ts  ✅
import { db } from '@/db';
import { shoppingLists, listMembers } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export async function getShoppingListsForUser(userId: number) {
  return db
    .select()
    .from(shoppingLists)
    .innerJoin(listMembers, eq(listMembers.listId, shoppingLists.id))
    .where(eq(listMembers.userId, userId));
}
```

```ts
// src/app/dashboard/page.tsx  ✅
import { getShoppingListsForUser } from '@/data/shopping-lists';
import { getCurrentUserId } from '@/data/users';

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  const lists = await getShoppingListsForUser(userId);
  return <DashboardClient lists={lists} />;
}
```

---

## Authorization: Users See Only Their Own Data

Every query that returns user-scoped data **must** filter by the logged-in user. A user may see a record if and only if one of these is true:

1. They created it (`createdBy = userId`), **or**
2. They are a member of the list it belongs to (`listMembers.userId = userId`)

Never return all rows from a table and filter in the component. The authorization filter belongs in the SQL query inside the helper function.

```ts
// ❌ Wrong — fetches everything, filters too late
const allLists = await db.select().from(shoppingLists);
return allLists.filter((l) => l.createdBy === userId);

// ✅ Correct — the database only returns what the user is allowed to see
export async function getShoppingListsForUser(userId: number) {
  return db
    .select({ ... })
    .from(shoppingLists)
    .innerJoin(listMembers, eq(listMembers.listId, shoppingLists.id))
    .where(eq(listMembers.userId, userId));
}
```

---

## Summary

| Concern | Where it lives |
|---|---|
| Database query logic | `src/data/*.ts` helper functions |
| Authorization filter | Inside the `src/data/` helper, in the query |
| Calling the helper | Server Component (`page.tsx`, `layout.tsx`, etc.) |
| Passing data to the UI | Props from Server Component → Client Component |
| ORM | Drizzle only — no raw SQL |
