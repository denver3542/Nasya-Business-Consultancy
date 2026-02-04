import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Application } from '@/types/application';

import ApplicationCard from './application-card';

interface SortableApplicationCardProps {
    application: Application;
    onStar?: (id: number) => void;
    onArchive?: (id: number) => void;
}

export default function SortableApplicationCard({
    application,
    onStar,
    onArchive,
}: SortableApplicationCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: application.id.toString(),
        data: {
            type: 'application',
            application,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
        >
            <ApplicationCard
                application={application}
                onStar={onStar}
                onArchive={onArchive}
                isDragging={isDragging}
            />
        </div>
    );
}
