'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/data/users';
import { createShoppingList } from '@/data/shopping-lists';

const createListSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
});

export async function createList(
  name: string,
): Promise<{ success: true; id: number } | { success: false; error: string }> {
  const result = createListSchema.safeParse({ name });
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const userId = await getCurrentUserId();
  const list = await createShoppingList(result.data.name, userId);
  revalidatePath('/dashboard');
  return { success: true, id: list.id };
}
