import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
    LayoutGrid,
    List,
    Plus,
    Star,
    Settings,
    Trash2,
    ExternalLink,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { Application, BoardList, UserBoard } from '@/types/application';
import BoardListColumn from '@/components/boards/board-list-column';
import ApplicationCard from '@/components/applications/application-card';

interface BoardShowProps {
    board: UserBoard & { lists: BoardList[] };
    availableApplications: Application[];
}

type ViewType = 'board' | 'list';

export default function Show({
    board: initialBoard,
    availableApplications,
}: BoardShowProps) {
    const [board, setBoard] = useState(initialBoard);
    const [activeApplication, setActiveApplication] =
        useState<Application | null>(null);
    const [showAddList, setShowAddList] = useState(false);
    const [showAddApplication, setShowAddApplication] = useState(false);
    const [selectedListId, setSelectedListId] = useState<number | null>(null);
    const [viewType, setViewType] = useState<ViewType>(() => {
        if (typeof window !== 'undefined') {
            return (
                (localStorage.getItem('boardViewType') as ViewType) || 'board'
            );
        }
        return 'board';
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Boards', href: '/client/boards' },
        { title: board.name, href: `/client/boards/${board.id}` },
    ];

    const allApplications = useMemo(() => {
        return (
            board.lists?.flatMap((list) =>
                (list.applications || []).map((app) => ({
                    ...app,
                    listName: list.name,
                    listColor: list.color,
                })),
            ) || []
        );
    }, [board.lists]);

    const handleViewChange = (value: string) => {
        if (value === 'board' || value === 'list') {
            setViewType(value);
            localStorage.setItem('boardViewType', value);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
    );

    useEffect(() => {
        setBoard(initialBoard);
    }, [initialBoard]);

    const findListByApplicationId = (appId: string): BoardList | undefined => {
        return board.lists?.find((list) =>
            list.applications?.some((app) => app.id.toString() === appId),
        );
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const activeList = findListByApplicationId(active.id.toString());
        if (activeList) {
            const app = activeList.applications?.find(
                (a) => a.id.toString() === active.id.toString(),
            );
            if (app) setActiveApplication(app);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();

        const activeList = findListByApplicationId(activeId);
        const overList =
            findListByApplicationId(overId) ||
            board.lists?.find((l) => l.id.toString() === overId);

        if (!activeList || !overList || activeList.id === overList.id) return;

        setBoard((prev) => {
            const newLists = prev.lists?.map((list) => {
                if (list.id === activeList.id) {
                    return {
                        ...list,
                        applications: list.applications?.filter(
                            (app) => app.id.toString() !== activeId,
                        ),
                    };
                }
                if (list.id === overList.id) {
                    const movedApp = activeList.applications?.find(
                        (app) => app.id.toString() === activeId,
                    );
                    if (movedApp) {
                        const newApps = [...(list.applications || [])];
                        const overIndex = newApps.findIndex(
                            (app) => app.id.toString() === overId,
                        );
                        newApps.splice(
                            overIndex >= 0 ? overIndex : newApps.length,
                            0,
                            movedApp,
                        );
                        return { ...list, applications: newApps };
                    }
                }
                return list;
            });
            return { ...prev, lists: newLists };
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveApplication(null);
        if (!over) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();

        const activeList = findListByApplicationId(activeId);
        const overList =
            findListByApplicationId(overId) ||
            board.lists?.find((l) => l.id.toString() === overId);

        if (!activeList || !overList) return;

        const activeIndex =
            activeList.applications?.findIndex(
                (app) => app.id.toString() === activeId,
            ) ?? -1;
        const overIndex =
            overList.applications?.findIndex(
                (app) => app.id.toString() === overId,
            ) ?? -1;

        if (activeList.id === overList.id && activeIndex !== overIndex) {
            setBoard((prev) => ({
                ...prev,
                lists: prev.lists?.map((list) =>
                    list.id === activeList.id
                        ? {
                              ...list,
                              applications: arrayMove(
                                  list.applications || [],
                                  activeIndex,
                                  overIndex,
                              ),
                          }
                        : list,
                ),
            }));
        }

        router.post(
            `/client/boards/${board.id}/move-application`,
            {
                application_id: parseInt(activeId),
                list_id: overList.id,
                position: overIndex >= 0 ? overIndex : 0,
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    const handleToggleStar = () => {
        router.post(
            `/client/boards/${board.id}/toggle-star`,
            {},
            { preserveScroll: true },
        );
    };

    const handleRemoveApplication = (applicationId: number) => {
        router.post(
            `/client/boards/${board.id}/remove-application`,
            { application_id: applicationId },
            { preserveScroll: true },
        );
    };

    const AddListForm = () => {
        const { data, setData, post, processing, reset } = useForm({
            name: '',
            color: '#6b7280',
        });

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            post(`/client/boards/${board.id}/lists`, {
                onSuccess: () => {
                    reset();
                    setShowAddList(false);
                },
            });
        };

        return (
            <Dialog open={showAddList} onOpenChange={setShowAddList}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New List</DialogTitle>
                        <DialogDescription>
                            Create a new list for this board
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="list-name">List Name</Label>
                                <Input
                                    id="list-name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Enter list name"
                                />
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAddList(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || !data.name}
                            >
                                {processing ? 'Creating...' : 'Create List'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        );
    };

    const AddApplicationForm = () => {
        const [selectedAppId, setSelectedAppId] = useState<string>('');

        const handleSubmit = () => {
            if (!selectedAppId || !selectedListId) return;
            router.post(
                `/client/boards/${board.id}/add-application`,
                {
                    application_id: parseInt(selectedAppId),
                    list_id: selectedListId,
                },
                {
                    onSuccess: () => {
                        setSelectedAppId('');
                        setShowAddApplication(false);
                        setSelectedListId(null);
                    },
                },
            );
        };

        return (
            <Dialog
                open={showAddApplication}
                onOpenChange={setShowAddApplication}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Application to List</DialogTitle>
                        <DialogDescription>
                            Select an application to add to this list
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Application</Label>
                            <Select
                                value={selectedAppId}
                                onValueChange={setSelectedAppId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an application" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableApplications.length === 0 ? (
                                        <SelectItem value="none" disabled>
                                            No applications available
                                        </SelectItem>
                                    ) : (
                                        availableApplications.map((app) => (
                                            <SelectItem
                                                key={app.id}
                                                value={app.id.toString()}
                                            >
                                                {app.application_number} -{' '}
                                                {app.application_type?.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowAddApplication(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!selectedAppId}
                        >
                            Add Application
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={board.name} />

            <div className="flex h-full flex-col">
                {/* Board Header */}
                <div className="flex items-center justify-between border-b bg-background p-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="size-3 rounded"
                            style={{ backgroundColor: board.color }}
                        />
                        <h1 className="text-xl font-bold">{board.name}</h1>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={handleToggleStar}
                        >
                            <Star
                                className={cn(
                                    'size-4',
                                    board.is_starred
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground',
                                )}
                            />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View Toggle */}
                        <ToggleGroup
                            type="single"
                            value={viewType}
                            onValueChange={handleViewChange}
                            className="rounded-md border"
                        >
                            <ToggleGroupItem
                                value="board"
                                aria-label="Board view"
                                className="px-3"
                            >
                                <LayoutGrid className="size-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="list"
                                aria-label="List view"
                                className="px-3"
                            >
                                <List className="size-4" />
                            </ToggleGroupItem>
                        </ToggleGroup>

                        {viewType === 'board' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAddList(true)}
                            >
                                <Plus className="mr-2 size-4" />
                                Add List
                            </Button>
                        )}
                        <Link href={`/client/boards/${board.id}/edit`}>
                            <Button variant="ghost" size="sm">
                                <Settings className="size-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Content - Board or List View */}
                {viewType === 'board' ? (
                    <div className="flex-1 overflow-x-auto bg-muted/30 p-6">
                        <DndContext
                            sensors={sensors}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="flex h-full gap-4">
                                {board.lists?.map((list) => (
                                    <BoardListColumn
                                        key={list.id}
                                        list={list}
                                        boardId={board.id}
                                        onAddApplication={() => {
                                            setSelectedListId(list.id);
                                            setShowAddApplication(true);
                                        }}
                                        onRemoveApplication={
                                            handleRemoveApplication
                                        }
                                    />
                                ))}

                                {/* Add List Button */}
                                <div className="flex min-w-75 shrink-0 items-start">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start gap-2 bg-background/50"
                                        onClick={() => setShowAddList(true)}
                                    >
                                        <Plus className="size-4" />
                                        Add another list
                                    </Button>
                                </div>
                            </div>

                            <DragOverlay>
                                {activeApplication ? (
                                    <ApplicationCard
                                        application={activeApplication}
                                        isDragging
                                    />
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto bg-background p-6">
                        <div className="rounded-lg border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Application #</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>List</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allApplications.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="py-8 text-center text-muted-foreground"
                                            >
                                                No applications on this board
                                                yet. Add applications to lists
                                                in board view.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        allApplications.map((app) => (
                                            <TableRow
                                                key={app.id}
                                                className="group"
                                            >
                                                <TableCell className="font-medium">
                                                    {app.application_number}
                                                </TableCell>
                                                <TableCell>
                                                    {app.application_type
                                                        ?.name || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                        style={{
                                                            borderColor:
                                                                app.listColor ||
                                                                undefined,
                                                            backgroundColor:
                                                                app.listColor
                                                                    ? `${app.listColor}20`
                                                                    : undefined,
                                                        }}
                                                    >
                                                        {app.listName}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs"
                                                        style={{
                                                            backgroundColor:
                                                                app.status
                                                                    ?.color ||
                                                                undefined,
                                                            color: app.status
                                                                ?.color
                                                                ? '#fff'
                                                                : undefined,
                                                        }}
                                                    >
                                                        {app.status?.name ||
                                                            'Unknown'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {app.due_date
                                                        ? new Date(
                                                              app.due_date,
                                                          ).toLocaleDateString()
                                                        : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <Link
                                                            href={`/client/applications/${app.id}`}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="size-8 p-0"
                                                            >
                                                                <ExternalLink className="size-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="size-8 p-0 text-destructive hover:text-destructive"
                                                            onClick={() =>
                                                                handleRemoveApplication(
                                                                    app.id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>

            <AddListForm />
            <AddApplicationForm />
        </AppLayout>
    );
}
