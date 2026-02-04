import { Head, router } from '@inertiajs/react';
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
import { useEffect, useState } from 'react';

import ApplicationCard from '@/components/applications/application-card';
import BoardColumn from '@/components/applications/board-column';
import BoardToolbar from '@/components/applications/board-toolbar';
import AppLayout from '@/layouts/app-layout';
import type {
    Application,
    ApplicationStatus,
    Board,
    FilterOptions,
    Stats,
} from '@/types/application';
import type { BreadcrumbItem } from '@/types';

interface BoardViewProps {
    board: Board;
    statuses: ApplicationStatus[];
    filters: FilterOptions;
    stats: Stats;
}

export default function BoardView({
    board: initialBoard,
    statuses,
    filters,
    stats,
}: BoardViewProps) {
    const [board, setBoard] = useState<Board>(initialBoard);
    const [activeApplication, setActiveApplication] =
        useState<Application | null>(null);
    const [activeFilters, setActiveFilters] = useState({});

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/client/dashboard' },
        { title: 'Applications', href: '/client/applications' },
    ];

    useEffect(() => {
        setBoard(initialBoard);
    }, [initialBoard]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const application = Object.values(board)
            .flat()
            .find((app) => app.id.toString() === active.id);

        if (application) {
            setActiveApplication(application);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();

        // Find the containers
        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId) || overId; // overId might be a column

        if (!activeContainer || !overContainer) return;
        if (activeContainer === overContainer) return;

        setBoard((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];

            const activeIndex = activeItems.findIndex(
                (item) => item.id.toString() === activeId,
            );
            const overIndex = overItems.findIndex(
                (item) => item.id.toString() === overId,
            );

            const newActiveItems = activeItems.filter(
                (item) => item.id.toString() !== activeId,
            );
            const movedItem = activeItems[activeIndex];

            // Update the item's status
            const newStatus = statuses.find((s) => s.slug === overContainer);
            if (newStatus) {
                movedItem.application_status_id = newStatus.id;
                movedItem.status = newStatus;
            }

            const newOverItems = [...overItems];
            newOverItems.splice(
                overIndex >= 0 ? overIndex : overItems.length,
                0,
                movedItem,
            );

            return {
                ...prev,
                [activeContainer]: newActiveItems,
                [overContainer]: newOverItems,
            };
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveApplication(null);

        if (!over) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId) || overId;

        if (!activeContainer || !overContainer) return;

        const activeIndex = board[activeContainer].findIndex(
            (item) => item.id.toString() === activeId,
        );
        const overIndex = board[overContainer].findIndex(
            (item) => item.id.toString() === overId,
        );

        if (activeContainer === overContainer) {
            // Reordering within same column
            if (activeIndex !== overIndex) {
                setBoard((prev) => ({
                    ...prev,
                    [overContainer]: arrayMove(
                        prev[overContainer],
                        activeIndex,
                        overIndex,
                    ),
                }));

                // Update position on server
                updateApplicationPosition(parseInt(activeId), overIndex);
            }
        } else {
            // Moving to different column
            const newStatus = statuses.find((s) => s.slug === overContainer);
            if (newStatus) {
                updateApplicationPosition(
                    parseInt(activeId),
                    overIndex >= 0 ? overIndex : 0,
                    newStatus.id,
                );
            }
        }
    };

    const findContainer = (id: string): string | undefined => {
        for (const [key, items] of Object.entries(board)) {
            if (items.some((item) => item.id.toString() === id)) {
                return key;
            }
        }
        return undefined;
    };

    const updateApplicationPosition = (
        applicationId: number,
        position: number,
        statusId?: number,
    ) => {
        router.post(
            `/client/applications/${applicationId}/position`,
            {
                position,
                status_id: statusId,
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const handleStar = (id: number) => {
        router.post(
            `/client/applications/${id}/star`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const handleArchive = (id: number) => {
        if (confirm('Are you sure you want to archive this application?')) {
            router.post(
                `/client/applications/${id}/archive`,
                {},
                {
                    preserveScroll: true,
                },
            );
        }
    };

    const handleFilterChange = (newFilters: any) => {
        setActiveFilters(newFilters);
        router.get(
            '/client/applications',
            { view: 'board', ...newFilters },
            { preserveState: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Applications - Board View" />

            <div className="flex h-full flex-col">
                {/* Toolbar */}
                <BoardToolbar
                    stats={stats}
                    filters={filters}
                    activeFilters={activeFilters}
                    onFilterChange={handleFilterChange}
                    currentView="board"
                />

                {/* Board */}
                <div className="flex-1 overflow-x-auto bg-gray-50 p-6">
                    <DndContext
                        sensors={sensors}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex h-full gap-4">
                            {statuses.map((status) => (
                                <BoardColumn
                                    key={status.id}
                                    status={status}
                                    applications={board[status.slug] || []}
                                    onStar={handleStar}
                                    onArchive={handleArchive}
                                />
                            ))}
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
            </div>
        </AppLayout>
    );
}
