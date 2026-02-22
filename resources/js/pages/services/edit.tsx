import { Head, Link, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { UserService } from '@/types/application';

interface ServiceFormField {
    id: number;
    name: string;
    label: string;
    type: string;
}

interface EditServiceProps {
    service: UserService & { form_field_ids?: number[] };
    availableFormFields: ServiceFormField[];
}

const colorOptions = [
    { value: '#3b82f6', label: 'Blue' },
    { value: '#10b981', label: 'Green' },
    { value: '#f59e0b', label: 'Yellow' },
    { value: '#ef4444', label: 'Red' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#6b7280', label: 'Gray' },
];

export default function Edit({ service, availableFormFields }: EditServiceProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Services', href: '/client/services' },
        { title: service.name, href: `/client/services/${service.id}` },
        { title: 'Edit', href: `/client/services/${service.id}/edit` },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        name: service.name,
        description: service.description || '',
        color: service.color,
        form_field_ids: service.form_field_ids || [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/client/services/${service.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${service.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="mx-auto w-full max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Service</CardTitle>
                            <CardDescription>
                                Update the service settings and appearance
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Service Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Service Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Enter service name"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Enter service description (optional)"
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-destructive">{errors.description}</p>
                                    )}
                                </div>

                                {/* Color */}
                                <div className="space-y-2">
                                    <Label>Service Color</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {colorOptions.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setData('color', color.value)}
                                                className={`size-8 rounded-full border-2 transition-all ${
                                                    data.color === color.value
                                                        ? 'scale-110 border-gray-900 ring-2 ring-gray-400 ring-offset-2'
                                                        : 'border-transparent hover:scale-105'
                                                }`}
                                                style={{ backgroundColor: color.value }}
                                                title={color.label}
                                            />
                                        ))}
                                    </div>
                                    {errors.color && (
                                        <p className="text-sm text-destructive">{errors.color}</p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <Label>Service Fields</Label>
                                    {availableFormFields.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No reusable fields available.
                                        </p>
                                    ) : (
                                        <div className="grid gap-3 rounded-lg border p-3 md:grid-cols-2">
                                            {availableFormFields.map((field) => (
                                                <label
                                                    key={field.id}
                                                    className="flex items-start gap-2 rounded-md border p-2"
                                                >
                                                    <Checkbox
                                                        checked={data.form_field_ids.includes(field.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                if (data.form_field_ids.includes(field.id)) {
                                                                    return;
                                                                }
                                                                setData('form_field_ids', [
                                                                    ...data.form_field_ids,
                                                                    field.id,
                                                                ]);
                                                                return;
                                                            }

                                                            setData(
                                                                'form_field_ids',
                                                                data.form_field_ids.filter((id) => id !== field.id),
                                                            );
                                                        }}
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium">{field.label}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {field.name} · {field.type}
                                                        </p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {errors.form_field_ids && (
                                        <p className="text-sm text-destructive">{errors.form_field_ids}</p>
                                    )}
                                </div>

                                {/* Preview */}
                                <div className="space-y-2">
                                    <Label>Preview</Label>
                                    <div
                                        className="rounded-lg border p-4"
                                        style={{ borderTopColor: data.color, borderTopWidth: '3px' }}
                                    >
                                        <h3 className="font-semibold">
                                            {data.name || 'Service Name'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {data.description || 'Service description will appear here'}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-4">
                                    <Link href={`/client/services/${service.id}`}>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
