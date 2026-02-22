import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Trash } from 'lucide-react';

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

interface ApplicationTypeSummary {
    id: number;
    name: string;
    slug: string;
}

interface FieldOption {
    label: string;
    value: string;
}

interface ApplicationTypeField {
    source: 'legacy' | 'relational';
    id: number | null;
    name: string;
    label: string;
    type: string;
    required: boolean;
    section: string | null;
    options: FieldOption[];
}

interface ApplicationTypeFieldsPageProps {
    applicationType: ApplicationTypeSummary;
    relationalFields: ApplicationTypeField[];
    legacyFields: ApplicationTypeField[];
}

export default function ApplicationTypeFields({
    applicationType,
    relationalFields,
    legacyFields,
}: ApplicationTypeFieldsPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Application Type Fields', href: `/admin/application-types/${applicationType.id}/fields` },
    ];

    const removeField = (field: ApplicationTypeField) => {
        const confirmLabel = field.label || field.name;
        const confirmed = window.confirm(
            `Remove "${confirmLabel}" from ${applicationType.name}?`,
        );

        if (!confirmed) {
            return;
        }

        router.delete(`/admin/application-types/${applicationType.id}/fields`, {
            data: {
                field_name: field.source === 'legacy' ? field.name : undefined,
                form_field_id: field.source === 'relational' ? field.id : undefined,
            },
            preserveScroll: true,
        });
    };

    const renderFieldsTable = (title: string, fields: ApplicationTypeField[]) => (
        <Card>
            <CardHeader>
                <CardTitle>
                    {title} ({fields.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No fields found.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Label</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Required</TableHead>
                                <TableHead>Options</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field) => (
                                <TableRow key={`${field.source}-${field.id ?? field.name}`}>
                                    <TableCell className="font-mono text-sm">
                                        {field.name}
                                    </TableCell>
                                    <TableCell>{field.label}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{field.type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={field.required ? 'default' : 'secondary'}>
                                            {field.required ? 'Required' : 'Optional'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{field.options.length}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => removeField(field)}
                                        >
                                            <Trash className="mr-2 size-4" />
                                            Remove
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Fields: ${applicationType.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/form-fields">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 size-4" />
                                Back to Form Fields
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">
                                {applicationType.name} Fields
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Remove fields assigned to this application type.
                            </p>
                        </div>
                    </div>
                </div>

                {renderFieldsTable('Relational Fields', relationalFields)}
                {renderFieldsTable('Legacy JSON Fields', legacyFields)}
            </div>
        </AppLayout>
    );
}
