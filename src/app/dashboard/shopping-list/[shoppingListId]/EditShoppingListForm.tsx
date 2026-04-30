'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import ItemsEditor, {
  type NewItemEntry,
  type ExistingItemEntry,
  type ExistingItemEdit,
  type AvailableItem,
  type AvailableStore,
} from '@/components/shopping-list/ItemsEditor';
import { updateList } from './actions';

interface Props {
  listId: number;
  initialName: string;
  initialOwnerId: number;
  initialListItems: ExistingItemEntry[];
  currentUserId: number;
  users: { id: number; displayName: string }[];
  availableItems: AvailableItem[];
  availableStores: AvailableStore[];
}

export default function EditShoppingListForm({
  listId,
  initialName,
  initialOwnerId,
  initialListItems,
  currentUserId,
  users,
  availableItems,
  availableStores,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [ownerId, setOwnerId] = useState<number>(initialOwnerId);
  const [removedItemIds, setRemovedItemIds] = useState<number[]>([]);
  const [newItems, setNewItems] = useState<NewItemEntry[]>([]);
  const [editedItems, setEditedItems] = useState<Map<number, ExistingItemEdit>>(new Map());
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const itemsToUpdate = initialListItems
        .filter((item) => !removedItemIds.includes(item.listItemId) && editedItems.has(item.listItemId))
        .map((item) => {
          const edits = editedItems.get(item.listItemId)!;
          return { listItemId: item.listItemId, quantity: edits.quantity, storeId: edits.storeId };
        });

      const result = await updateList(
        listId,
        name,
        ownerId,
        removedItemIds,
        newItems.map((item) => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity || null,
          storeId: item.storeId,
        })),
        itemsToUpdate,
      );
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error);
      }
    });
  }

  const hasIncompleteItem = newItems.some((i) => !i.itemName.trim());

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <Pencil className="h-7 w-7 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Shopping List</h1>
          <p className="text-sm text-muted-foreground">Update your shopping list details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">List details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Weekly groceries"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="owner">Owner</Label>
                <Select
                  value={ownerId.toString()}
                  onValueChange={(v) => setOwnerId(Number(v))}
                  disabled={isPending}
                >
                  <SelectTrigger id="owner">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.displayName}
                        {u.id === currentUserId ? ' (you)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Separator />

            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium">Items</Label>
              <ItemsEditor
                availableItems={availableItems}
                availableStores={availableStores}
                existingItems={initialListItems}
                existingItemEdits={editedItems}
                removedItemIds={removedItemIds}
                newItems={newItems}
                onNewItemsChange={setNewItems}
                onRemoveExisting={(id) => setRemovedItemIds((prev) => [...prev, id])}
                onRestoreExisting={(id) =>
                  setRemovedItemIds((prev) => prev.filter((x) => x !== id))
                }
                onUpdateExisting={(id, patch) =>
                  setEditedItems((prev) => new Map(prev).set(id, patch))
                }
                disabled={isPending}
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || name.trim() === '' || hasIncompleteItem}
              >
                {isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
