'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow, parseISO, isAfter, startOfDay } from 'date-fns';
import { ShoppingCart, CalendarIcon, X, Pencil } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export type ShoppingListRow = {
  id: number;
  name: string;
  itemCount: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
};

type Filters = {
  createdBy: string;
  updatedBy: string;
  minCreatedDate: Date | undefined;
};

const EMPTY_FILTERS: Filters = {
  createdBy: 'all',
  updatedBy: 'all',
  minCreatedDate: undefined,
};

type Props = {
  lists: ShoppingListRow[];
  allUsers: string[];
};

export default function DashboardClient({ lists, allUsers }: Props) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const filtered = lists.filter((list) => {
    if (filters.createdBy !== 'all' && list.createdBy !== filters.createdBy) return false;
    if (filters.updatedBy !== 'all' && list.updatedBy !== filters.updatedBy) return false;
    if (filters.minCreatedDate) {
      const created = parseISO(list.createdAt);
      if (!isAfter(created, startOfDay(filters.minCreatedDate)) &&
          created.toDateString() !== filters.minCreatedDate.toDateString()) {
        return false;
      }
    }
    return true;
  });

  const hasActiveFilters =
    filters.createdBy !== 'all' ||
    filters.updatedBy !== 'all' ||
    filters.minCreatedDate !== undefined;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <ShoppingCart className="h-7 w-7 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shopping Lists</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {lists.length} list{lists.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <Separator />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Filters</CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                <X className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Created by */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created by</Label>
              <Select
                value={filters.createdBy}
                onValueChange={(v) => setFilters((f) => ({ ...f, createdBy: v }))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Anyone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Anyone</SelectItem>
                  {allUsers.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Updated by */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Last updated by</Label>
              <Select
                value={filters.updatedBy}
                onValueChange={(v) => setFilters((f) => ({ ...f, updatedBy: v }))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Anyone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Anyone</SelectItem>
                  {allUsers.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Min created date */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Created after</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-8 text-sm justify-start font-normal"
                  >
                    <CalendarIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    {filters.minCreatedDate
                      ? format(filters.minCreatedDate, 'MMM d, yyyy')
                      : 'Any date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.minCreatedDate}
                    onSelect={(d) => setFilters((f) => ({ ...f, minCreatedDate: d }))}
                  />
                  {filters.minCreatedDate && (
                    <div className="border-t p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs"
                        onClick={() =>
                          setFilters((f) => ({ ...f, minCreatedDate: undefined }))
                        }
                      >
                        Clear date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Created at</TableHead>
                <TableHead>Last updated by</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No lists match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell className="pl-4 font-medium">{list.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <Badge variant="secondary">{list.itemCount}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{list.createdBy}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(parseISO(list.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm">{list.updatedBy}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      <span title={format(parseISO(list.updatedAt), 'MMM d, yyyy HH:mm')}>
                        {formatDistanceToNow(parseISO(list.updatedAt), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/shopping-list/${list.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
