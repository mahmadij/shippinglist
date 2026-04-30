'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/data/users';
import { addMemberToList } from '@/data/shopping-lists';

const shareListSchema = z.object({
  listId: z.number().int().positive(),
  targetUserId: z.number().int().positive(),
  role: z.enum(['editor', 'viewer']),
});

export async function shareList(
  listId: number,
  targetUserId: number,
  role: 'editor' | 'viewer',
): Promise<{ success: true } | { success: false; error: string }> {
  const result = shareListSchema.safeParse({ listId, targetUserId, role });
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const userId = await getCurrentUserId();
  const ok = await addMemberToList(result.data.listId, result.data.targetUserId, result.data.role, userId);

  if (!ok) {
    return { success: false, error: 'You must be the owner of this list to share it.' };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
