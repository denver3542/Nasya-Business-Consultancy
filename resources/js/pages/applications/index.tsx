import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Search, Settings, Trash } from 'lucide-react';
import { useState } from 'react';

import ApplicationStatusBadge from '@/components/application-status-badge';
import { Badge } from '@/components/ui/badge';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type {
    Application,
    ApplicationFilters,
    ApplicationStatus,
    ApplicationType,
    BreadcrumbItem,
    PaginatedApplications,
} from '@/types';
import { settings } from '@/routes/applications';

interface ApplicationsIndexProps {
    applications: PaginatedApplications;
    filters: ApplicationFilters;
    statuses: ApplicationStatus[];
    types: ApplicationType[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Applications', href: '/applications' },
];

export default function Index({
    applications,
    filters,
    statuses,
    types,
}: ApplicationsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [deleteApplication, setDeleteApplication] =
        useState<Application | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = () => {
        router.get(
            '/applications',
            {
                search: search || undefined,
                status:
                    statusFilter && statusFilter !== 'all'
                        ? statusFilter
                        : undefined,
                type:
                    typeFilter && typeFilter !== 'all' ? typeFilter : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true },
        );
    };

    const handleReset = () => {
        setSearch('');
        setStatusFilter('all');
        setTypeFilter('all');
        setDateFrom('');
        setDateTo('');
        router.get('/applications', {}, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleteApplication) return;

        setIsDeleting(true);
        router.delete(`/applications/${deleteApplication.id}`, {
            onSuccess: () => {
                setDeleteApplication(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Applications" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Applications</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage all applications in the system
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/applications/create">
                            <Button>
                                <Plus className="mr-2 size-4" />
                                New Application
                            </Button>
                        </Link>
                        {/* Settings Link */}
                        <Link href={settings()}>
                            <Button variant="outline">
                                <Settings className="mr-2 size-4" />
                                Settings
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 rounded-lg border p-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Input
                            placeholder="Search by application number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && handleSearch()
                            }
                        />
                        <Select
                            value={statusFilter || undefined}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Statuses
                                </SelectItem>
                                {statuses.map((status) => (
                                    <SelectItem
                                        key={status.id}
                                        value={status.slug}
                                    >
                                        {status.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={typeFilter || undefined}
                            onValueChange={setTypeFilter}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {types.map((type) => (
                                    <SelectItem key={type.id} value={type.slug}>
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                placeholder="From Date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                            <Input
                                type="date"
                                placeholder="To Date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleSearch}>
                            <Search className="mr-2 size-4" />
                            Search
                        </Button>
                        <Button variant="outline" onClick={handleReset}>
                            Reset
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Application #</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead>Deadline</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="text-center"
                                    >
                                        No applications found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                applications.data.map((application) => (
                                    <TableRow key={application.id}>
                                        <TableCell className="font-medium">
                                            {application.application_number}
                                        </TableCell>
                                        <TableCell>
                                            {application.user?.name || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {application.application_type
                                                ?.name || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {application.status && (
                                                <ApplicationStatusBadge
                                                    status={application.status}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {application.submitted_at
                                                ? new Date(
                                                      application.submitted_at,
                                                  ).toLocaleDateString()
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {application.deadline
                                                ? new Date(
                                                      application.deadline,
                                                  ).toLocaleDateString()
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-20 rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <div
                                                        className="h-2 rounded-full bg-blue-600"
                                                        style={{
                                                            width: `${application.completion_percentage}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {
                                                        application.completion_percentage
                                                    }
                                                    %
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/applications/${application.id}`}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Eye className="size-4" />
                                                    </Button>
                                                </Link>
                                                {application.can_edit && (
                                                    <Link
                                                        href={`/applications/${application.id}/edit`}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                    </Link>
                                                )}
                                                {application.is_draft && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            setDeleteApplication(
                                                                application,
                                                            )
                                                        }
                                                    >
                                                        <Trash className="size-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {applications.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {applications.data.length} of{' '}
                            {applications.total} applications
                        </p>
                        <div className="flex gap-2">
                            {applications.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={
                                        link.active ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && router.get(link.url)
                                    }
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!deleteApplication}
                onOpenChange={() => setDeleteApplication(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Application</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete application{' '}
                            {deleteApplication?.application_number}? This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteApplication(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
