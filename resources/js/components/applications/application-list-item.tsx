import { router } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    DollarSign,
    MoreVertical,
    Paperclip,
    Star,
    Tag,
    User,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, formatDate, getDaysUntilDue, isOverdue } from '@/lib/utils';
import type { Application } from '@/types/application';

interface ApplicationListItemProps {
    application: Application;
    isSelected?: boolean;
    onSelect?: (id: number, selected: boolean) => void;
    onStar?: (id: number) => void;
    onPriorityChange?: (id: number, priority: number) => void;
    onArchive?: (id: number) => void;
    showSubtasks?: boolean;
}

export default function ApplicationListItem({
    application,
    isSelected = false,
    onSelect,
    onStar,
    onPriorityChange,
    onArchive,
    showSubtasks = false,
}: ApplicationListItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isStarred, setIsStarred] = useState(application.is_starred);

    const handleStar = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsStarred(!isStarred);
        onStar?.(application.id);
    };

    const handleRowClick = () => {
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
                'group relative border-b bg-white transition-colors hover:bg-gray-50',
                isSelected && 'bg-blue-50/50',
                application.priority > 0 &&
                    `border-l-4 border-l-${application.priority_color}-500`,
            )}
        >
            <div
                className="flex cursor-pointer items-center gap-3 px-4 py-3"
                onClick={handleRowClick}
            >
                {/* Expand/Collapse (if has subtasks) */}
                {showSubtasks && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="size-6 p-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                    >
                        {isExpanded ? (
                            <ChevronDown className="size-4" />
                        ) : (
                            <ChevronRight className="size-4" />
                        )}
                    </Button>
                )}

                {/* Checkbox */}
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                        onSelect?.(application.id, checked === true);
                    }}
                    onClick={(e) => e.stopPropagation()}
                />

                {/* Star */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0"
                    onClick={handleStar}
                >
                    <Star
                        className={cn(
                            'size-4',
                            isStarred && 'fill-yellow-400 text-yellow-400',
                        )}
                    />
                </Button>

                {/* Application Number */}
                <div className="w-[140px] flex-shrink-0">
                    <span className="text-sm font-medium text-gray-900">
                        {application.application_number}
                    </span>
                </div>

                {/* Application Name/Type */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-900">
                            {application.application_type.name}
                        </span>
                        {application.tags && application.tags.length > 0 && (
                            <div className="flex gap-1">
                                {application.tags.slice(0, 2).map((tag, i) => (
                                    <Badge
                                        key={i}
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                                {application.tags.length > 2 && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Badge
                                                variant="secondary"
                                                className="cursor-pointer text-xs"
                                            >
                                                +{application.tags.length - 2}
                                            </Badge>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-2">
                                            <div className="flex flex-wrap gap-1">
                                                {application.tags.map(
                                                    (tag, i) => (
                                                        <Badge
                                                            key={i}
                                                            variant="secondary"
                                                            className="text-xs"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ),
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Status */}
                <div className="w-[140px] flex-shrink-0">
                    <Badge
                        variant="outline"
                        className={cn(
                            'text-xs',
                            `bg-${application.status.color}-100 text-${application.status.color}-700 border-${application.status.color}-200`,
                        )}
                    >
                        {application.status.name}
                    </Badge>
                </div>

                {/* Priority */}
                <div className="w-[120px] flex-shrink-0">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={(e) => e.stopPropagation()}
                            >
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
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-40 p-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {[0, 1, 2, 3, 4].map((priority) => {
                                const labels = [
                                    'None',
                                    'Low',
                                    'Medium',
                                    'High',
                                    'Urgent',
                                ];
                                return (
                                    <Button
                                        key={priority}
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() =>
                                            onPriorityChange?.(
                                                application.id,
                                                priority,
                                            )
                                        }
                                    >
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'text-xs',
                                                priorityColors[
                                                    priority as keyof typeof priorityColors
                                                ],
                                            )}
                                        >
                                            {labels[priority]}
                                        </Badge>
                                    </Button>
                                );
                            })}
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Due Date */}
                <div className="w-[130px] flex-shrink-0">
                    {application.due_date ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={cn(
                                            'flex items-center gap-1.5 text-sm',
                                            overdue && 'text-red-600',
                                            daysUntilDue !== null &&
                                                daysUntilDue <= 3 &&
                                                daysUntilDue > 0 &&
                                                'text-orange-600',
                                        )}
                                    >
                                        <Calendar className="size-3.5" />
                                        <span className="text-xs">
                                            {overdue && 'Overdue'}
                                            {!overdue &&
                                                daysUntilDue === 0 &&
                                                'Today'}
                                            {!overdue &&
                                                daysUntilDue === 1 &&
                                                'Tomorrow'}
                                            {!overdue &&
                                                daysUntilDue !== null &&
                                                daysUntilDue > 1 &&
                                                `${daysUntilDue}d`}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>
                                        Due: {formatDate(application.due_date)}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <span className="text-xs text-muted-foreground">
                            No due date
                        </span>
                    )}
                </div>

                {/* Assigned To */}
                <div className="w-[120px] flex-shrink-0">
                    {application.assigned_staff ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                                            {application.assigned_staff.name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')}
                                        </div>
                                        <span className="truncate text-xs">
                                            {
                                                application.assigned_staff.name.split(
                                                    ' ',
                                                )[0]
                                            }
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{application.assigned_staff.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <span className="text-xs text-muted-foreground">
                            Unassigned
                        </span>
                    )}
                </div>

                {/* Progress */}
                <div className="w-[100px] flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Progress
                            value={application.completion_percentage}
                            className="h-1.5"
                        />
                        <span className="text-xs text-muted-foreground">
                            {application.completion_percentage}%
                        </span>
                    </div>
                </div>

                {/* Fee */}
                <div className="w-[100px] flex-shrink-0 text-right">
                    <span className="text-sm font-medium">
                        {application.formatted_total_fee}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="size-7 p-0"
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

            {/* Expanded Content (subtasks, comments, etc.) */}
            {isExpanded && (
                <div className="border-t bg-gray-50 p-4">
                    <div className="text-sm text-muted-foreground">
                        Additional details would go here...
                    </div>
                </div>
            )}
        </div>
    );
}
