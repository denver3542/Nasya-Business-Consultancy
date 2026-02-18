import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MoreHorizontal, Pencil, Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Application, BoardList } from '@/types/application';
import SortableApplicationCard from '@/components/applications/sortable-application-card';

interface BoardListColumnProps {
    list: BoardList;
    boardId: number;
    onAddApplication?: () => void;
    onRemoveApplication?: (applicationId: number) => void;
}

export default function BoardListColumn({
    list,
    boardId,
    onAddApplication,
    onRemoveApplication,
}: BoardListColumnProps) {
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    const { setNodeRef, isOver } = useDroppable({
        id: list.id.toString(),
        data: { type: 'list', list },
    });

    const applications = list.applications || [];
    const applicationIds = applications.map((app) => app.id.toString());

    const EditListForm = () => {
        const { data, setData, patch, processing } = useForm({
            name: list.name,
            color: list.color || '#6b7280',
        });

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            patch(`/client/boards/${boardId}/lists/${list.id}`, {
                onSuccess: () => setShowEdit(false),
            });
        };

        return (
            <Dialog open={showEdit} onOpenChange={setShowEdit}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit List</DialogTitle>
                        <DialogDescription>Update the list name</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <Input
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="List name"
                            />
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing || !data.name}>
                                {processing ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        );
    };

    const handleDelete = () => {
        router.delete(`/client/boards/${boardId}/lists/${list.id}`, {
            onSuccess: () => setShowDelete(false),
        });
    };

    return (
        <>
            <div
                ref={setNodeRef}
                className={cn(
                    'flex h-full min-w-[300px] max-w-[300px] shrink-0 flex-col rounded-lg border bg-background/80 transition-colors',
                    isOver && 'border-primary bg-primary/5',
                )}
            >
                {/* List Header */}
                <div className="flex items-center justify-between border-b p-3">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{list.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                            {applications.length}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="size-7 p-0" onClick={onAddApplication}>
                            <Plus className="size-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="size-7 p-0">
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setShowEdit(true)}>
                                    <Pencil className="mr-2 size-4" />
                                    Edit List
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setShowDelete(true)}>
                                    <Trash className="mr-2 size-4" />
                                    Delete List
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 space-y-2 overflow-y-auto p-2">
                    <SortableContext items={applicationIds} strategy={verticalListSortingStrategy}>
                        {applications.map((app) => (
                            <SortableApplicationCard
                                key={app.id}
                                application={app}
                                onArchive={onRemoveApplication ? () => onRemoveApplication(app.id) : undefined}
                            />
                        ))}
                    </SortableContext>

                    {applications.length === 0 && (
                        <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-muted text-sm text-muted-foreground">
                            Drop applications here
                        </div>
                    )}
                </div>
            </div>

            <EditListForm />

            {/* Delete Confirmation */}
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete List</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{list.name}"? Applications will be removed from the list but not deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

