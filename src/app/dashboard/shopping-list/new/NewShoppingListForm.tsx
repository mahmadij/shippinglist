'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createList } from './actions';

export default function NewShoppingListForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createList(name);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-3">
        <ShoppingCart className="h-7 w-7 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Shopping List</h1>
          <p className="text-sm text-muted-foreground">Create a new list to start adding items</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">List details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || name.trim() === ''}>
                {isPending ? 'Creating…' : 'Create list'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
