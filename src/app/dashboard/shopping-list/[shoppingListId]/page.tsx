import { notFound } from 'next/navigation';
import { getCurrentUserId, getAllUsers } from '@/data/users';
import { getShoppingListWithItems, getListOwner } from '@/data/shopping-lists';
import { getAllItems } from '@/data/items';
import { getAllStores } from '@/data/stores';
import EditShoppingListForm from './EditShoppingListForm';

export default async function EditShoppingListPage({
  params,
}: {
  params: Promise<{ shoppingListId: string }>;
}) {
  const { shoppingListId } = await params;
  const id = parseInt(shoppingListId, 10);
  if (isNaN(id)) notFound();

  const userId = await getCurrentUserId();
  const [listData, ownerId, allUsers, allItems, allStores] = await Promise.all([
    getShoppingListWithItems(id, userId),
    getListOwner(id),
    getAllUsers(),
    getAllItems(),
    getAllStores(),
  ]);

  if (!listData) notFound();

  return (
    <EditShoppingListForm
      listId={listData.id}
      initialName={listData.name}
      initialOwnerId={ownerId ?? userId}
      initialListItems={listData.listItems}
      currentUserId={userId}
      users={allUsers}
      availableItems={allItems}
      availableStores={allStores}
    />
  );
}
