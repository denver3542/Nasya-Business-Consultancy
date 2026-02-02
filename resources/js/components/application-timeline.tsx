import {
    CheckCircle,
    Circle,
    FileCheck,
    FileUp,
    Flag,
    Mail,
    PlusCircle,
    RefreshCw,
    UserCheck,
    XCircle,
    CreditCard,
} from 'lucide-react';
import type { ApplicationTimeline as TimelineType } from '@/types';
import { cn } from '@/lib/utils';

type Props = {
    timeline: TimelineType[];
    className?: string;
};

const getTimelineIcon = (action: string) => {
    const iconMap: Record<string, React.ReactNode> = {
        created: <PlusCircle className="size-4" />,
        updated: <RefreshCw className="size-4" />,
        submitted: <Mail className="size-4" />,
        approved: <CheckCircle className="size-4" />,
        rejected: <XCircle className="size-4" />,
        document_uploaded: <FileUp className="size-4" />,
        document_verified: <FileCheck className="size-4" />,
        payment_received: <CreditCard className="size-4" />,
        status_changed: <RefreshCw className="size-4" />,
        assigned: <UserCheck className="size-4" />,
        completed: <Flag className="size-4" />,
    };

    return iconMap[action] || <Circle className="size-4" />;
};

const getTimelineColor = (action: string) => {
    const colorMap: Record<string, string> = {
        created: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200',
        updated: 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200',
        submitted: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200',
        approved: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200',
        rejected: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200',
        document_uploaded: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-200',
        document_verified: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200',
        payment_received: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200',
        status_changed: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200',
        assigned: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200',
        completed: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200',
    };

    return colorMap[action] || colorMap.updated;
};

export default function ApplicationTimeline({ timeline, className }: Props) {
    if (!timeline || timeline.length === 0) {
        return (
            <div className={cn('text-center text-sm text-muted-foreground py-8', className)}>
                No timeline events yet
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {timeline.map((event, index) => (
                <div key={event.id} className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                        <div className={cn('flex size-8 items-center justify-center rounded-full', getTimelineColor(event.action))}>
                            {getTimelineIcon(event.action)}
                        </div>
                        {index < timeline.length - 1 && (
                            <div className="h-full w-px bg-border mt-2" />
                        )}
                    </div>
                    <div className="flex-1 pb-8">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <p className="font-medium text-sm">{event.description}</p>
                                {event.user && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        by {event.user.name}
                                    </p>
                                )}
                            </div>
                            <time className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(event.created_at).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </time>
                        </div>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div className="mt-2 rounded-md bg-muted p-2 text-xs">
                                <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(event.metadata, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

