'use client';

import { useState, useTransition } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { shareList } from '@/app/dashboard/actions';

interface Props {
  listId: number;
  listName: string;
  users: { id: number; displayName: string }[];
}

export default function ShareListDialog({ listId, listName, users }: Props) {
  const [open, setOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetUserId) return;
    setError(null);
    startTransition(async () => {
      const result = await shareList(listId, Number(targetUserId), role);
      if (result.success) {
        setOpen(false);
        setTargetUserId('');
        setRole('viewer');
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Share list">
          <Share2 className="h-3.5 w-3.5" />
          <span className="sr-only">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share &ldquo;{listName}&rdquo;</DialogTitle>
        </DialogHeader>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No other users are available to share with yet.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="share-user">Share with</Label>
              <Select value={targetUserId} onValueChange={setTargetUserId} disabled={isPending}>
                <SelectTrigger id="share-user">
                  <SelectValue placeholder="Select a person…" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="share-role">Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as 'editor' | 'viewer')}
                disabled={isPending}
              >
                <SelectTrigger id="share-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer — can see the list</SelectItem>
                  <SelectItem value="editor">Editor — can add and remove items</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !targetUserId}>
                {isPending ? 'Sharing…' : 'Share'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
