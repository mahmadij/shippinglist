import { getCurrentUserId } from '@/data/users';
import { getAllUsers } from '@/data/users';
import { getAllItems } from '@/data/items';
import { getAllStores } from '@/data/stores';
import NewShoppingListForm from './NewShoppingListForm';

export default async function NewShoppingListPage() {
  const [currentUserId, allUsers, allItems, allStores] = await Promise.all([
    getCurrentUserId(),
    getAllUsers(),
    getAllItems(),
    getAllStores(),
  ]);

  return (
    <NewShoppingListForm
      currentUserId={currentUserId}
      users={allUsers}
      availableItems={allItems}
      availableStores={allStores}
    />
  );
}
