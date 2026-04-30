'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/data/users';
import { createShoppingList, addListItem } from '@/data/shopping-lists';
import { getOrCreateItem } from '@/data/items';
import { getOrCreateStore } from '@/data/stores';

const itemEntrySchema = z.object({
  itemId: z.number().int().positive().nullable(),
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.string().max(50).nullable(),
  storeId: z.number().int().positive().nullable(),
  storeName: z.string().max(100).nullable(),
});

const createListSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
  ownerId: z.number().int().positive(),
  items: z.array(itemEntrySchema),
});

export type CreateListItemInput = z.infer<typeof itemEntrySchema>;

export async function createList(
  name: string,
  ownerId: number,
  items: CreateListItemInput[],
): Promise<{ success: true; id: number } | { success: false; error: string }> {
  const result = createListSchema.safeParse({ name, ownerId, items });
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const userId = await getCurrentUserId();
  const list = await createShoppingList(result.data.name, userId, result.data.ownerId);

  for (const entry of result.data.items) {
    let resolvedItemId = entry.itemId;

    if (!resolvedItemId) {
      const item = await getOrCreateItem(entry.itemName, userId);
      resolvedItemId = item.id;
    }

    let resolvedStoreId = entry.storeId;
    if (!resolvedStoreId && entry.storeName) {
      const store = await getOrCreateStore(entry.storeName, userId);
      resolvedStoreId = store.id;
    }

    await addListItem(list.id, resolvedItemId, userId, entry.quantity || null, resolvedStoreId);
  }

  revalidatePath('/dashboard');
  return { success: true, id: list.id };
}
