import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '@/types';

type Props = {
    status: ApplicationStatus;
    className?: string;
};

const getStatusColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
        gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
        orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };

    return colorMap[color] || colorMap.gray;
};

export default function ApplicationStatusBadge({ status, className }: Props) {
    return (
        <Badge className={cn(getStatusColorClasses(status.color), className)}>
            {status.name}
        </Badge>
    );
}

