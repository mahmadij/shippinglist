'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/data/users';
import {
  updateShoppingListName,
  updateListOwner,
  addListItem,
  removeListItems,
} from '@/data/shopping-lists';
import { getOrCreateItem } from '@/data/items';

const itemEntrySchema = z.object({
  itemId: z.number().int().positive().nullable(),
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.string().max(50).nullable(),
  storeId: z.number().int().positive().nullable(),
});

const updateListSchema = z.object({
  listId: z.number().int().positive(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
  ownerId: z.number().int().positive(),
  itemsToRemove: z.array(z.number().int().positive()),
  itemsToAdd: z.array(itemEntrySchema),
});

export type UpdateListItemInput = z.infer<typeof itemEntrySchema>;

export async function updateList(
  listId: number,
  name: string,
  ownerId: number,
  itemsToRemove: number[],
  itemsToAdd: UpdateListItemInput[],
): Promise<{ success: true } | { success: false; error: string }> {
  const result = updateListSchema.safeParse({
    listId,
    name,
    ownerId,
    itemsToRemove,
    itemsToAdd,
  });
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const userId = await getCurrentUserId();
  const data = result.data;

  const updated = await updateShoppingListName(data.listId, data.name, userId);
  if (!updated) {
    return { success: false, error: 'List not found or you do not have permission to edit it.' };
  }

  await updateListOwner(data.listId, data.ownerId, userId);

  if (data.itemsToRemove.length > 0) {
    await removeListItems(data.itemsToRemove, userId);
  }

  for (const entry of data.itemsToAdd) {
    let resolvedItemId = entry.itemId;
    if (!resolvedItemId) {
      const item = await getOrCreateItem(entry.itemName, userId);
      resolvedItemId = item.id;
    }
    await addListItem(data.listId, resolvedItemId, userId, entry.quantity || null, entry.storeId);
  }

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/shopping-list/${listId}`);
  return { success: true };
}
