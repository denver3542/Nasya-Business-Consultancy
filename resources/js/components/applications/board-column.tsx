import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Application, ApplicationStatus } from '@/types/application';
import SortableApplicationCard from './sortable-application-card';

interface BoardColumnProps {
    status: ApplicationStatus;
    applications: Application[];
    onStar?: (id: number) => void;
    onArchive?: (id: number) => void;
    onAddNew?: (statusId: number) => void;
}

export default function BoardColumn({
    status,
    applications,
    onStar,
    onArchive,
    onAddNew,
}: BoardColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: status.id.toString(),
        data: {
            type: 'column',
            status,
        },
    });

    const applicationIds = applications.map((app) => app.id.toString());

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'flex h-full min-w-[320px] flex-col rounded-lg border bg-gray-50/50 transition-colors',
                isOver && 'border-blue-500 bg-blue-50/50',
            )}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between border-b bg-white p-4">
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            'size-3 rounded-full',
                            `bg-${status.color}-500`,
                        )}
                    />
                    <h3 className="font-semibold text-gray-900">
                        {status.name}
                    </h3>
                    <Badge variant="secondary" className="ml-1">
                        {applications.length}
                    </Badge>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0"
                    onClick={() => onAddNew?.(status.id)}
                >
                    <Plus className="size-4" />
                </Button>
            </div>

            {/* Column Content */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <SortableContext
                    items={applicationIds}
                    strategy={verticalListSortingStrategy}
                >
                    {applications.map((application) => (
                        <SortableApplicationCard
                            key={application.id}
                            application={application}
                            onStar={onStar}
                            onArchive={onArchive}
                        />
                    ))}
                </SortableContext>

                {applications.length === 0 && (
                    <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-muted-foreground">
                        Drop applications here
                    </div>
                )}
            </div>
        </div>
    );
}
