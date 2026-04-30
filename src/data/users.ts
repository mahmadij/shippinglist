import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function getCurrentUserId(): Promise<number> {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthenticated');

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId));

  if (!user) throw new Error('User not found');
  return user.id;
}

export async function getAllUsers() {
  return db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .orderBy(asc(users.displayName));
}
