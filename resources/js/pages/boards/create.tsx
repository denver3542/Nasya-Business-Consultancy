import { Head, Link, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Boards', href: '/client/boards' },
    { title: 'Create', href: '/client/boards/create' },
];

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

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        color: '#3b82f6',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/client/boards');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Board" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="mx-auto w-full max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Board</CardTitle>
                            <CardDescription>
                                Create a board to organize your applications with drag-and-drop lists
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Board Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Board Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Enter board name"
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
                                        placeholder="Enter board description (optional)"
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-destructive">{errors.description}</p>
                                    )}
                                </div>

                                {/* Color */}
                                <div className="space-y-2">
                                    <Label>Board Color</Label>
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

                                {/* Preview */}
                                <div className="space-y-2">
                                    <Label>Preview</Label>
                                    <div
                                        className="rounded-lg border p-4"
                                        style={{ borderTopColor: data.color, borderTopWidth: '3px' }}
                                    >
                                        <h3 className="font-semibold">
                                            {data.name || 'Board Name'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {data.description || 'Board description will appear here'}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-4">
                                    <Link href="/client/boards">
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating...' : 'Create Board'}
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

