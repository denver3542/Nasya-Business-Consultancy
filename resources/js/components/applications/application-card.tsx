import { router } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    MoreVertical,
    Star,
    Tag,
    User,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, formatDate, getDaysUntilDue, isOverdue } from '@/lib/utils';
import type { Application } from '@/types/application';

interface ApplicationCardProps {
    application: Application;
    onStar?: (id: number) => void;
    onPriorityChange?: (id: number, priority: number) => void;
    onArchive?: (id: number) => void;
    isDragging?: boolean;
}

export default function ApplicationCard({
    application,
    onStar,
    onPriorityChange,
    onArchive,
    isDragging = false,
}: ApplicationCardProps) {
    const [isStarred, setIsStarred] = useState(application.is_starred);

    const handleStar = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsStarred(!isStarred);
        onStar?.(application.id);
    };

    const handleCardClick = () => {
        router.get(`/client/applications/${application.id}`);
    };

    const priorityColors = {
        0: 'bg-gray-100 text-gray-600 border-gray-200',
        1: 'bg-blue-100 text-blue-600 border-blue-200',
        2: 'bg-yellow-100 text-yellow-600 border-yellow-200',
        3: 'bg-orange-100 text-orange-600 border-orange-200',
        4: 'bg-red-100 text-red-600 border-red-200',
    };

    const daysUntilDue = getDaysUntilDue(application.due_date);
    const overdue = isOverdue(application.due_date);

    return (
        <div
            className={cn(
                'group relative rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md',
                isDragging && 'opacity-50',
                application.priority > 0 &&
                    `border-l-4 border-l-${application.priority_color}-500`,
            )}
            onClick={handleCardClick}
        >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                            {application.application_number}
                        </span>
                        {application.priority > 0 && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-xs',
                                    priorityColors[
                                        application.priority as keyof typeof priorityColors
                                    ],
                                )}
                            >
                                {application.priority_label}
                            </Badge>
                        )}
                    </div>
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                        {application.application_type.name}
                    </h3>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={handleStar}
                    >
                        <Star
                            className={cn(
                                'size-4',
                                isStarred && 'fill-yellow-400 text-yellow-400',
                            )}
                        />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="size-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.get(
                                        `/client/applications/${application.id}`,
                                    );
                                }}
                            >
                                View Details
                            </DropdownMenuItem>
                            {application.can_edit && (
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.get(
                                            `/client/applications/${application.id}/edit`,
                                        );
                                    }}
                                >
                                    Edit
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onArchive?.(application.id);
                                }}
                            >
                                Archive
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Tags */}
            {application.tags && application.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                    {application.tags.slice(0, 3).map((tag, index) => (
                        <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                        >
                            <Tag className="mr-1 size-3" />
                            {tag}
                        </Badge>
                    ))}
                    {application.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                            +{application.tags.length - 3}
                        </Badge>
                    )}
                </div>
            )}

            {/* Progress Bar */}
            {application.completion_percentage > 0 && (
                <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                            {application.completion_percentage}%
                        </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all',
                                application.completion_percentage === 100
                                    ? 'bg-green-500'
                                    : 'bg-blue-500',
                            )}
                            style={{
                                width: `${application.completion_percentage}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                {/* Due Date */}
                {application.due_date && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(
                                        'flex items-center gap-1',
                                        overdue && 'text-red-600',
                                        daysUntilDue !== null &&
                                            daysUntilDue <= 3 &&
                                            daysUntilDue > 0 &&
                                            'text-orange-600',
                                    )}
                                >
                                    <Calendar className="size-3" />
                                    {overdue && <span>Overdue</span>}
                                    {!overdue && daysUntilDue === 0 && (
                                        <span>Today</span>
                                    )}
                                    {!overdue && daysUntilDue === 1 && (
                                        <span>Tomorrow</span>
                                    )}
                                    {!overdue &&
                                        daysUntilDue !== null &&
                                        daysUntilDue > 1 && (
                                            <span>{daysUntilDue}d</span>
                                        )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Due: {formatDate(application.due_date)}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}

                {/* Assigned */}
                {application.assigned_staff && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-1">
                                    <User className="size-3" />
                                    <span className="truncate">
                                        {
                                            application.assigned_staff.name.split(
                                                ' ',
                                            )[0]
                                        }
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Assigned to:{' '}
                                    {application.assigned_staff.name}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}

                {/* Submission Status */}
                {application.submitted_at && (
                    <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="size-3" />
                        <span>Submitted</span>
                    </div>
                )}
            </div>

            {/* Watchers */}
            {application.watchers && application.watchers.length > 0 && (
                <div className="mt-3 flex items-center gap-1">
                    <div className="flex -space-x-2">
                        {application.watchers.slice(0, 3).map((watcher) => (
                            <TooltipProvider key={watcher.id}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex size-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-medium">
                                            {watcher.name.charAt(0)}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{watcher.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                        {application.watchers.length > 3 && (
                            <div className="flex size-6 items-center justify-center rounded-full border-2 border-white bg-gray-300 text-xs font-medium">
                                +{application.watchers.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
