import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

import ListGroup from '@/components/applications/list-group';
import ListHeader from '@/components/applications/list-header';
import BoardToolbar from '@/components/applications/board-toolbar';
import ApplicationListItem from '@/components/applications/application-list-item';
import AppLayout from '@/layouts/app-layout';
import type {
    Application,
    FilterOptions,
    Stats,
} from '@/types/application';
import type { BreadcrumbItem } from '@/types';

interface ListViewProps {
    applications:
        | Application[]
        | { data: Application[] }
        | Record<string, Application[]>;
    filters: FilterOptions;
    stats: Stats;
    groupBy?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export default function ListView({
    applications: initialApplications,
    filters,
    stats,
    groupBy,
    sortBy: initialSortBy = 'created_at',
    sortOrder: initialSortOrder = 'desc',
}: ListViewProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [sortBy, setSortBy] = useState(initialSortBy);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
        initialSortOrder,
    );
    const [activeFilters, setActiveFilters] = useState({});

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/client/dashboard' },
        { title: 'Applications', href: '/client/applications' },
    ];

    // Parse applications based on structure
    const applications = useMemo(() => {
        if (Array.isArray(initialApplications)) {
            return initialApplications;
        } else if (initialApplications && 'data' in initialApplications) {
            return initialApplications.data;
        }
        return [];
    }, [initialApplications]);

    // Check if data is grouped
    const isGrouped =
        initialApplications &&
        !Array.isArray(initialApplications) &&
        !('data' in initialApplications);

    const groupedApplications = isGrouped
        ? (initialApplications as Record<string, Application[]>)
        : null;

    const columns = [
        {
            key: 'application_number',
            label: 'Number',
            width: 'w-[140px]',
            sortable: true,
        },
        {
            key: 'type',
            label: 'Application',
            width: 'flex-1 min-w-0',
            sortable: true,
        },
        {
            key: 'status',
            label: 'Status',
            width: 'w-[140px]',
            sortable: true,
        },
        {
            key: 'priority',
            label: 'Priority',
            width: 'w-[120px]',
            sortable: true,
        },
        {
            key: 'due_date',
            label: 'Due Date',
            width: 'w-[130px]',
            sortable: true,
        },
        {
            key: 'assigned_to',
            label: 'Assigned',
            width: 'w-[120px]',
            sortable: false,
        },
        {
            key: 'completion',
            label: 'Progress',
            width: 'w-[100px]',
            sortable: true,
        },
        {
            key: 'total_fee',
            label: 'Fee',
            width: 'w-[100px]',
            sortable: true,
        },
    ];

    const handleSort = (key: string) => {
        const newOrder =
            sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(key);
        setSortOrder(newOrder);

        router.get(
            '/client/applications',
            {
                view: 'list',
                sort_by: key,
                sort_order: newOrder,
                group_by: groupBy,
                ...activeFilters,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleSelect = (id: number, selected: boolean) => {
        setSelectedIds((prev) =>
            selected
                ? [...prev, id]
                : prev.filter((selectedId) => selectedId !== id),
        );
    };

    const handleSelectAll = (selected: boolean) => {
        setSelectedIds(selected ? applications.map((app) => app.id) : []);
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

    const handlePriorityChange = (id: number, priority: number) => {
        router.post(
            `/client/applications/${id}/priority`,
            { priority },
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
            { view: 'list', ...newFilters },
            { preserveState: true },
        );
    };

    const handleGroupByChange = (newGroupBy: string) => {
        router.get(
            '/client/applications',
            {
                view: 'list',
                group_by: newGroupBy === 'none' ? undefined : newGroupBy,
                sort_by: sortBy,
                sort_order: sortOrder,
                ...activeFilters,
            },
            { preserveState: true },
        );
    };

    const allSelected =
        applications.length > 0 &&
        applications.every((app) => selectedIds.includes(app.id));
    const someSelected =
        !allSelected &&
        applications.some((app) => selectedIds.includes(app.id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Applications - List View" />

            <div className="flex h-full flex-col">
                {/* Toolbar */}
                <BoardToolbar
                    stats={stats}
                    filters={filters}
                    activeFilters={activeFilters}
                    onFilterChange={handleFilterChange}
                    currentView="list"
                />

                {/* Group By Selector */}
                <div className="border-b bg-white px-6 py-2">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                            Group by:
                        </span>
                        <select
                            value={groupBy || 'none'}
                            onChange={(e) =>
                                handleGroupByChange(e.target.value)
                            }
                            className="rounded border px-2 py-1 text-sm"
                        >
                            <option value="none">No grouping</option>
                            <option value="status">Status</option>
                            <option value="priority">Priority</option>
                            <option value="type">Application Type</option>
                            <option value="assigned">Assigned To</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto bg-white">
                    {/* Header */}
                    <ListHeader
                        columns={columns}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                        allSelected={allSelected}
                        someSelected={someSelected}
                        onSelectAll={handleSelectAll}
                    />

                    {/* Content */}
                    {groupedApplications ? (
                        // Grouped View
                        <div className="p-4">
                            {/* {Object.entries(groupedApplications).map(
                                ([groupName, groupApps]) => {
                                    // Determine color based on group type
                                    let color = 'gray';
                                    if (groupBy === 'status') {
                                        const status = filters.statuses.find(
                                            (s) => s.name === groupName,
                                        );
                                        color = status?.color || 'gray';
                                    } else if (groupBy === 'priority') {
                                        const priorityColors: Record
                                            string,
                                            string
                                        > = {
                                            None: 'gray',
                                            Low: 'blue',
                                            Medium: 'yellow',
                                            High: 'orange',
                                            Urgent: 'red',
                                        };
                                        color =
                                            priorityColors[groupName] || 'gray';
                                    }

                                    return (
                                        <ListGroup
                                            key={groupName}
                                            title={groupName}
                                            applications={groupApps}
                                            color={color}
                                            selectedIds={selectedIds}
                                            onSelect={handleSelect}
                                            onStar={handleStar}
                                            onPriorityChange={
                                                handlePriorityChange
                                            }
                                            onArchive={handleArchive}
                                        />
                                    );
                                },
                            )} */}
                        </div>
                    ) : (
                        // Flat View
                        <div>
                            {applications.map((application) => (
                                <ApplicationListItem
                                    key={application.id}
                                    application={application}
                                    isSelected={selectedIds.includes(
                                        application.id,
                                    )}
                                    onSelect={handleSelect}
                                    onStar={handleStar}
                                    onPriorityChange={handlePriorityChange}
                                    onArchive={handleArchive}
                                />
                            ))}

                            {applications.length === 0 && (
                                <div className="flex h-64 items-center justify-center text-muted-foreground">
                                    No applications found
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Bulk Actions Bar */}
                {selectedIds.length > 0 && (
                    <div className="border-t bg-blue-50 px-6 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">
                                    {selectedIds.length} selected
                                </span>
                                <button
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                    onClick={() => setSelectedIds([])}
                                >
                                    Clear selection
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Bulk actions will go here */}
                                <span className="text-sm text-muted-foreground">
                                    Bulk actions coming soon...
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}