import { getShoppingListsForUser } from '@/data/shopping-lists';
import { getCurrentUserId, getAllUsers } from '@/data/users';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  const [lists, allUsers] = await Promise.all([
    getShoppingListsForUser(userId),
    getAllUsers(),
  ]);

  const filterUsers = [
    ...new Set([...lists.map((l) => l.createdBy), ...lists.map((l) => l.updatedBy)]),
  ].sort();

  const shareableUsers = allUsers.filter((u) => u.id !== userId);

  return (
    <DashboardClient
      lists={lists}
      allUsers={filterUsers}
      shareableUsers={shareableUsers}
    />
  );
}
