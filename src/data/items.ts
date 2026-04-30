import { db } from '@/db';
import { items } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function getAllItems() {
  return db.select({ id: items.id, name: items.name }).from(items).orderBy(asc(items.name));
}

export async function createItem(name: string, userId: number) {
  const [item] = await db.insert(items).values({ name, createdBy: userId }).returning();
  return item;
}

export async function getOrCreateItem(name: string, userId: number) {
  const [existing] = await db.select().from(items).where(eq(items.name, name));
  if (existing) return existing;
  return createItem(name, userId);
}
