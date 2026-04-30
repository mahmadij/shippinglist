import { getShoppingListsForUser } from '@/data/shopping-lists';
import { getCurrentUserId } from '@/data/users';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  const lists = await getShoppingListsForUser(userId);

  const allUsers = [
    ...new Set([...lists.map((l) => l.createdBy), ...lists.map((l) => l.updatedBy)]),
  ].sort();

  return <DashboardClient lists={lists} allUsers={allUsers} />;
}
