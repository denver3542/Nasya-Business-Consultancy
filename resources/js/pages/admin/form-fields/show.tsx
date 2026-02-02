import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface FormFieldOption {
    id: number;
    label: string;
    value: string;
    display_order: number;
}

interface ApplicationType {
    id: number;
    name: string;
    slug: string;
    pivot: {
        is_required: boolean;
        display_order: number;
        section: string | null;
    };
}

interface FormFieldData {
    id: number;
    name: string;
    label: string;
    type: string;
    placeholder: string | null;
    help_text: string | null;
    validation_rules: Record<string, unknown> | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    options: FormFieldOption[];
    application_types: ApplicationType[];
}

interface FormFieldShowProps {
    formField: FormFieldData;
}

export default function Show({ formField }: FormFieldShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Form Fields', href: '/admin/form-fields' },
        { title: formField.label, href: `/admin/form-fields/${formField.id}` },
    ];

    const requiresOptions = ['select', 'radio', 'checkbox'].includes(
        formField.type,
    );

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
            <Head title={`Form Field: ${formField.label}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/form-fields">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 size-4" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">
                                {formField.label}
                            </h1>
                            <p className="font-mono text-sm text-muted-foreground">
                                {formField.name}
                            </p>
                        </div>
                    </div>
                    <Link href={`/admin/form-fields/${formField.id}/edit`}>
                        <Button>
                            <Pencil className="mr-2 size-4" />
                            Edit
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Field Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Type
                                </span>
                                <Badge
                                    className={getTypeBadgeColor(
                                        formField.type,
                                    )}
                                >
                                    {formField.type}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Status
                                </span>
                                <Badge
                                    variant={
                                        formField.is_active
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {formField.is_active
                                        ? 'Active'
                                        : 'Inactive'}
                                </Badge>
                            </div>
                            {formField.placeholder && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Placeholder
                                    </span>
                                    <span>{formField.placeholder}</span>
                                </div>
                            )}
                            {formField.help_text && (
                                <div>
                                    <span className="text-muted-foreground">
                                        Help Text
                                    </span>
                                    <p className="mt-1 text-sm">
                                        {formField.help_text}
                                    </p>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Created
                                </span>
                                <span>
                                    {new Date(
                                        formField.created_at,
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    {requiresOptions && formField.options.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Options ({formField.options.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Label</TableHead>
                                            <TableHead>Value</TableHead>
                                            <TableHead>Order</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formField.options.map((option) => (
                                            <TableRow key={option.id}>
                                                <TableCell>
                                                    {option.label}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {option.value}
                                                </TableCell>
                                                <TableCell>
                                                    {option.display_order}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {formField.application_types.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Used in Application Types (
                                {formField.application_types.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Application Type</TableHead>
                                        <TableHead>Required</TableHead>
                                        <TableHead>Section</TableHead>
                                        <TableHead>Order</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {formField.application_types.map(
                                        (appType) => (
                                            <TableRow key={appType.id}>
                                                <TableCell className="font-medium">
                                                    {appType.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            appType.pivot
                                                                .is_required
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {appType.pivot
                                                            .is_required
                                                            ? 'Required'
                                                            : 'Optional'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {appType.pivot.section ||
                                                        '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {
                                                        appType.pivot
                                                            .display_order
                                                    }
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
