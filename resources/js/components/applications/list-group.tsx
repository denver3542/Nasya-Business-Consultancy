import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Application } from '@/types/application';

import ApplicationListItem from './application-list-item';

interface ListGroupProps {
    title: string;
    applications: Application[];
    color?: string;
    defaultExpanded?: boolean;
    onSelectAll?: (applications: Application[], selected: boolean) => void;
    selectedIds?: number[];
    onSelect?: (id: number, selected: boolean) => void;
    onStar?: (id: number) => void;
    onPriorityChange?: (id: number, priority: number) => void;
    onArchive?: (id: number) => void;
}

export default function ListGroup({
    title,
    applications,
    color = 'gray',
    defaultExpanded = true,
    onSelectAll,
    selectedIds = [],
    onSelect,
    onStar,
    onPriorityChange,
    onArchive,
}: ListGroupProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const allSelected =
        applications.length > 0 &&
        applications.every((app) => selectedIds.includes(app.id));
    const someSelected =
        !allSelected &&
        applications.some((app) => selectedIds.includes(app.id));

    return (
        <div className="mb-4">
            {/* Group Header */}
            <div
                className={cn(
                    'flex cursor-pointer items-center gap-3 border-b-2 bg-gray-50 px-4 py-2',
                    `border-${color}-500`,
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <Button variant="ghost" size="sm" className="size-6 p-0">
                    {isExpanded ? (
                        <ChevronDown className="size-4" />
                    ) : (
                        <ChevronRight className="size-4" />
                    )}
                </Button>

                <div className={cn('size-3 rounded-full', `bg-${color}-500`)} />

                <h3 className="flex-1 text-sm font-semibold text-gray-900">
                    {title}
                </h3>

                <Badge variant="secondary">{applications.length}</Badge>
            </div>

            {/* Group Items */}
            {isExpanded && (
                <div className="border-l-2 border-gray-200">
                    {applications.map((application) => (
                        <ApplicationListItem
                            key={application.id}
                            application={application}
                            isSelected={selectedIds.includes(application.id)}
                            onSelect={onSelect}
                            onStar={onStar}
                            onPriorityChange={onPriorityChange}
                            onArchive={onArchive}
                        />
                    ))}

                    {applications.length === 0 && (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No applications in this group
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
