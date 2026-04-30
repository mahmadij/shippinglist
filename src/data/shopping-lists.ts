import { db } from '@/db';
import { shoppingLists, listMembers, listItems, users } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

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
