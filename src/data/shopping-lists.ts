import { db } from '@/db';
import {
  shoppingLists,
  listMembers,
  listItems,
  items,
  stores,
  users,
} from '@/db/schema';
import { eq, count, and, or, inArray, asc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export async function createShoppingList(
  name: string,
  userId: number,
  ownerId?: number,
) {
  const actualOwnerId = ownerId ?? userId;

  const [list] = await db
    .insert(shoppingLists)
    .values({ name, createdBy: userId, updatedBy: userId })
    .returning();

  await db.insert(listMembers).values({ listId: list.id, userId: actualOwnerId, role: 'owner' });

  if (actualOwnerId !== userId) {
    await db.insert(listMembers).values({ listId: list.id, userId, role: 'editor' });
  }

  return list;
}

export async function getShoppingListsForUser(userId: number) {
  const createdByUser = alias(users, 'created_by_user');
  const updatedByUser = alias(users, 'updated_by_user');

  const rows = await db
    .select({
      id: shoppingLists.id,
      name: shoppingLists.name,
      itemCount: count(listItems.id),
      createdBy: createdByUser.displayName,
      createdAt: shoppingLists.createdAt,
      updatedBy: updatedByUser.displayName,
      updatedAt: shoppingLists.updatedAt,
    })
    .from(shoppingLists)
    .innerJoin(listMembers, eq(listMembers.listId, shoppingLists.id))
    .innerJoin(createdByUser, eq(createdByUser.id, shoppingLists.createdBy))
    .innerJoin(updatedByUser, eq(updatedByUser.id, shoppingLists.updatedBy))
    .leftJoin(listItems, eq(listItems.listId, shoppingLists.id))
    .where(eq(listMembers.userId, userId))
    .groupBy(
      shoppingLists.id,
      shoppingLists.name,
      shoppingLists.createdAt,
      shoppingLists.updatedAt,
      createdByUser.displayName,
      updatedByUser.displayName,
    );

  return rows.map((row) => ({
    ...row,
    itemCount: Number(row.itemCount),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getShoppingListById(listId: number, userId: number) {
  const [row] = await db
    .select({
      id: shoppingLists.id,
      name: shoppingLists.name,
      createdAt: shoppingLists.createdAt,
      updatedAt: shoppingLists.updatedAt,
    })
    .from(shoppingLists)
    .innerJoin(listMembers, eq(listMembers.listId, shoppingLists.id))
    .where(and(eq(shoppingLists.id, listId), eq(listMembers.userId, userId)));

  if (!row) return null;
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getShoppingListWithItems(listId: number, userId: number) {
  const [listRow] = await db
    .select({ id: shoppingLists.id, name: shoppingLists.name })
    .from(shoppingLists)
    .innerJoin(listMembers, eq(listMembers.listId, shoppingLists.id))
    .where(and(eq(shoppingLists.id, listId), eq(listMembers.userId, userId)));

  if (!listRow) return null;

  const itemRows = await db
    .select({
      listItemId: listItems.id,
      itemId: items.id,
      itemName: items.name,
      quantity: listItems.quantity,
      storeId: listItems.storeId,
      storeName: stores.name,
    })
    .from(listItems)
    .innerJoin(items, eq(items.id, listItems.itemId))
    .leftJoin(stores, eq(stores.id, listItems.storeId))
    .where(eq(listItems.listId, listId))
    .orderBy(asc(listItems.sortOrder), asc(listItems.createdAt));

  return { ...listRow, listItems: itemRows };
}

export async function getListOwner(listId: number) {
  const [row] = await db
    .select({ userId: listMembers.userId })
    .from(listMembers)
    .where(and(eq(listMembers.listId, listId), eq(listMembers.role, 'owner')));
  return row?.userId ?? null;
}

export async function updateShoppingListName(listId: number, name: string, userId: number) {
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

export async function updateListOwner(
  listId: number,
  newOwnerId: number,
  requestingUserId: number,
) {
  const [currentOwnerRow] = await db
    .select({ userId: listMembers.userId })
    .from(listMembers)
    .where(and(eq(listMembers.listId, listId), eq(listMembers.role, 'owner')));

  if (currentOwnerRow?.userId !== requestingUserId) return false;
  if (newOwnerId === requestingUserId) return true;

  await db
    .update(listMembers)
    .set({ role: 'editor' })
    .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, requestingUserId)));

  const [existingMember] = await db
    .select({ id: listMembers.id })
    .from(listMembers)
    .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, newOwnerId)));

  if (existingMember) {
    await db
      .update(listMembers)
      .set({ role: 'owner' })
      .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, newOwnerId)));
  } else {
    await db.insert(listMembers).values({ listId, userId: newOwnerId, role: 'owner' });
  }

  return true;
}

export async function addListItem(
  listId: number,
  itemId: number,
  userId: number,
  quantity: string | null,
  storeId: number | null,
) {
  const [member] = await db
    .select({ role: listMembers.role })
    .from(listMembers)
    .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)));

  if (!member || member.role === 'viewer') return null;

  const [row] = await db
    .insert(listItems)
    .values({
      listId,
      itemId,
      addedBy: userId,
      quantity: quantity || null,
      storeId: storeId || null,
    })
    .returning();

  return row;
}

export async function removeListItems(listItemIds: number[], userId: number) {
  if (listItemIds.length === 0) return;

  const authorizedListIds = db
    .select({ listId: listMembers.listId })
    .from(listMembers)
    .where(
      and(
        eq(listMembers.userId, userId),
        or(eq(listMembers.role, 'owner'), eq(listMembers.role, 'editor')),
      ),
    );

  await db
    .delete(listItems)
    .where(
      and(
        inArray(listItems.id, listItemIds),
        inArray(listItems.listId, authorizedListIds),
      ),
    );
}
