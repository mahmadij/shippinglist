import { db } from '@/db';
import { stores } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function getAllStores() {
  return db.select({ id: stores.id, name: stores.name }).from(stores).orderBy(asc(stores.name));
}

export async function createStore(name: string, userId: number) {
  const [store] = await db.insert(stores).values({ name, createdBy: userId }).returning();
  return store;
}

export async function getOrCreateStore(name: string, userId: number) {
  const [existing] = await db.select().from(stores).where(eq(stores.name, name));
  if (existing) return existing;
  return createStore(name, userId);
}
