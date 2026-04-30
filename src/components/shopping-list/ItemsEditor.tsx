'use client';

import { useState, useId } from 'react';
import { Plus, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export type AvailableItem = { id: number; name: string };
export type AvailableStore = { id: number; name: string };

export type NewItemEntry = {
  localId: string;
  itemId: number | null;
  itemName: string;
  quantity: string;
  storeId: number | null;
};

export type ExistingItemEntry = {
  listItemId: number;
  itemId: number;
  itemName: string;
  quantity: string | null;
  storeId: number | null;
  storeName: string | null;
};

interface Props {
  availableItems: AvailableItem[];
  availableStores: AvailableStore[];
  existingItems?: ExistingItemEntry[];
  removedItemIds?: number[];
  newItems: NewItemEntry[];
  onNewItemsChange: (items: NewItemEntry[]) => void;
  onRemoveExisting?: (listItemId: number) => void;
  onRestoreExisting?: (listItemId: number) => void;
  disabled?: boolean;
}

function ItemCombobox({
  availableItems,
  value,
  onChange,
  disabled,
}: {
  availableItems: AvailableItem[];
  value: { id: number | null; name: string };
  onChange: (v: { id: number | null; name: string }) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const hasExactMatch = availableItems.some(
    (i) => i.name.toLowerCase() === search.toLowerCase(),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{value.name || 'Select or create item…'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or type new item…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {search ? null : 'Start typing to search.'}
            </CommandEmpty>
            {availableItems.length > 0 && (
              <CommandGroup heading="Existing items">
                {availableItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={() => {
                      onChange({ id: item.id, name: item.name });
                      setSearch('');
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.id === item.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {search && !hasExactMatch && (
              <>
                {availableItems.length > 0 && <CommandSeparator />}
                <CommandGroup heading="Create new">
                  <CommandItem
                    value={`__create__${search}`}
                    onSelect={() => {
                      onChange({ id: null, name: search });
                      setSearch('');
                      setOpen(false);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create &ldquo;{search}&rdquo;
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function ItemsEditor({
  availableItems,
  availableStores,
  existingItems = [],
  removedItemIds = [],
  newItems,
  onNewItemsChange,
  onRemoveExisting,
  onRestoreExisting,
  disabled,
}: Props) {
  const uid = useId();

  function addRow() {
    onNewItemsChange([
      ...newItems,
      { localId: `${uid}-${Date.now()}`, itemId: null, itemName: '', quantity: '', storeId: null },
    ]);
  }

  function updateRow(localId: string, patch: Partial<NewItemEntry>) {
    onNewItemsChange(
      newItems.map((row) => (row.localId === localId ? { ...row, ...patch } : row)),
    );
  }

  function removeRow(localId: string) {
    onNewItemsChange(newItems.filter((row) => row.localId !== localId));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Column headers */}
      {(existingItems.length > 0 || newItems.length > 0) && (
        <div className="grid grid-cols-[1fr_80px_140px_36px] gap-2 px-1">
          <Label className="text-xs text-muted-foreground">Item</Label>
          <Label className="text-xs text-muted-foreground">Qty</Label>
          <Label className="text-xs text-muted-foreground">Store</Label>
          <span />
        </div>
      )}

      {/* Existing items (edit page) */}
      {existingItems.map((entry) => {
        const isRemoved = removedItemIds.includes(entry.listItemId);
        return (
          <div
            key={entry.listItemId}
            className={cn(
              'grid grid-cols-[1fr_80px_140px_36px] gap-2 items-center',
              isRemoved && 'opacity-40',
            )}
          >
            <span className="text-sm truncate px-1">{entry.itemName}</span>
            <span className="text-sm px-1">{entry.quantity ?? '—'}</span>
            <span className="text-sm px-1">{entry.storeName ?? '—'}</span>
            {isRemoved ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground"
                onClick={() => onRestoreExisting?.(entry.listItemId)}
                disabled={disabled}
                title="Restore item"
              >
                <Plus className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive hover:text-destructive"
                onClick={() => onRemoveExisting?.(entry.listItemId)}
                disabled={disabled}
                title="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}

      {/* New item rows */}
      {newItems.map((row) => (
        <div key={row.localId} className="grid grid-cols-[1fr_80px_140px_36px] gap-2 items-center">
          <ItemCombobox
            availableItems={availableItems}
            value={{ id: row.itemId, name: row.itemName }}
            onChange={(v) => updateRow(row.localId, { itemId: v.id, itemName: v.name })}
            disabled={disabled}
          />
          <Input
            placeholder="Qty"
            value={row.quantity}
            onChange={(e) => updateRow(row.localId, { quantity: e.target.value })}
            disabled={disabled}
          />
          <Select
            value={row.storeId?.toString() ?? '__none__'}
            onValueChange={(v) =>
              updateRow(row.localId, { storeId: v === '__none__' ? null : Number(v) })
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Any store</SelectItem>
              {availableStores.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive hover:text-destructive"
            onClick={() => removeRow(row.localId)}
            disabled={disabled}
            title="Remove row"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        disabled={disabled}
        className="w-fit"
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add item
      </Button>
    </div>
  );
}
