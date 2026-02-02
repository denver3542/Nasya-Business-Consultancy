import { Head, Link, router } from '@inertiajs/react';
import { Ban, Check, Eye, Pencil, Plus, Search, Trash } from 'lucide-react';
import { useState } from 'react';

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
import type { BreadcrumbItem } from '@/types';

interface FormField {
    id: number;
    name: string;
    label: string;
    type: string;
    placeholder: string | null;
    help_text: string | null;
    is_active: boolean;
    created_at: string;
    options_count: number;
}

interface FieldType {
    value: string;
    label: string;
}

interface FormFieldsIndexProps {
    formFields: {
        data: FormField[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        search?: string;
        type?: string;
        status?: string;
        sort?: string;
        direction?: string;
    };
    fieldTypes: FieldType[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Form Fields', href: '/admin/form-fields' },
];

export default function Index({
    formFields,
    filters,
    fieldTypes,
}: FormFieldsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [deleteField, setDeleteField] = useState<FormField | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = () => {
        router.get(
            '/admin/form-fields',
            {
                search: search || undefined,
                type:
                    typeFilter && typeFilter !== 'all' ? typeFilter : undefined,
                status:
                    statusFilter && statusFilter !== 'all'
                        ? statusFilter
                        : undefined,
            },
            { preserveState: true },
        );
    };

    const handleReset = () => {
        setSearch('');
        setTypeFilter('all');
        setStatusFilter('all');
        router.get('/admin/form-fields', {}, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleteField) return;

        setIsDeleting(true);
        router.delete(`/admin/form-fields/${deleteField.id}`, {
            onSuccess: () => {
                setDeleteField(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const toggleStatus = (field: FormField) => {
        router.post(
            `/admin/form-fields/${field.id}/toggle-status`,
            {},
            { preserveScroll: true },
        );
    };

    const getTypeBadgeColor = (type: string) => {
        const colors: Record<string, string> = {
            text: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            email: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
            number: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            textarea:
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            select: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            date: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
            file: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            checkbox:
                'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
            radio: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
        return (
            colors[type] ||
            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Form Fields Management" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Form Fields</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage reusable form fields for application types
                        </p>
                    </div>
                    <Link href="/admin/form-fields/create">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Add Form Field
                        </Button>
                    </Link>
                </div>
                {/* Filters */}
                <div className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row">
                    <Input
                        placeholder="Search by name or label..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="md:w-80"
                    />
                    <Select
                        value={typeFilter || undefined}
                        onValueChange={setTypeFilter}
                    >
                        <SelectTrigger className="md:w-40">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {fieldTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={statusFilter || undefined}
                        onValueChange={setStatusFilter}
                    >
                        <SelectTrigger className="md:w-40">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
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
                                <TableHead>Name</TableHead>
                                <TableHead>Label</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Options</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {formFields.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center"
                                    >
                                        No form fields found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                formFields.data.map((field) => (
                                    <TableRow key={field.id}>
                                        <TableCell className="font-mono text-sm font-medium">
                                            {field.name}
                                        </TableCell>
                                        <TableCell>{field.label}</TableCell>
                                        <TableCell>
                                            <Badge
                                                className={getTypeBadgeColor(
                                                    field.type,
                                                )}
                                            >
                                                {field.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {[
                                                'select',
                                                'radio',
                                                'checkbox',
                                            ].includes(field.type)
                                                ? field.options_count
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    field.is_active
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {field.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                field.created_at,
                                            ).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/admin/form-fields/${field.id}`}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Eye className="size-4" />
                                                    </Button>
                                                </Link>
                                                <Link
                                                    href={`/admin/form-fields/${field.id}/edit`}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        toggleStatus(field)
                                                    }
                                                >
                                                    {field.is_active ? (
                                                        <Ban className="size-4" />
                                                    ) : (
                                                        <Check className="size-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setDeleteField(field)
                                                    }
                                                >
                                                    <Trash className="size-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {formFields.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {formFields.data.length} of{' '}
                            {formFields.total} form fields
                        </p>
                        <div className="flex gap-2">
                            {formFields.links.map((link, index) => (
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
                open={!!deleteField}
                onOpenChange={() => setDeleteField(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Form Field</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the field "
                            {deleteField?.label}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteField(null)}
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
