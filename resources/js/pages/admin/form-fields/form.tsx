import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Trash } from 'lucide-react';
import { useEffect } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { log } from 'console';

interface FormFieldOption {
    id?: number;
    label: string;
    value: string;
}

interface FormFieldData {
    id?: number;
    name: string;
    label: string;
    type: string;
    placeholder: string | null;
    help_text: string | null;
    validation_rules: Record<string, unknown> | null;
    is_active: boolean;
    options?: FormFieldOption[];
}

interface FieldType {
    value: string;
    label: string;
}

interface FormFieldFormProps {
    formField: FormFieldData | null;
    fieldTypes: FieldType[];
}

export default function Form({ formField, fieldTypes }: FormFieldFormProps) {
    const isEditing = !!formField?.id;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Form Fields', href: '/admin/form-fields' },
        {
            title: isEditing ? 'Edit Form Field' : 'Create Form Field',
            href: isEditing
                ? `/admin/form-fields/${formField?.id}/edit`
                : '/admin/form-fields/create',
        },
    ];

    const { data, setData, post, patch, processing, errors } = useForm({
        name: formField?.name || '',
        label: formField?.label || '',
        type: formField?.type || '',
        placeholder: formField?.placeholder || '',
        help_text: formField?.help_text || '',
        is_active: formField?.is_active ?? true,
        options: formField?.options || ([] as FormFieldOption[]),
    });

    const requiresOptions = ['select', 'radio', 'checkbox'].includes(data.type);

    useEffect(() => {
        if (requiresOptions && data.options.length === 0) {
            setData('options', [{ label: '', value: '' }]);
        }
    }, [data.type]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation
        if (requiresOptions && data.options.length === 0) {
            // Show error toast or message
            console.error('At least one option is required');
            return;
        }

        // Prepare data
        const submitData = { ...data };

        if (!requiresOptions) {
            // Don't send options for non-option fields
            delete submitData.options;
        } else {
            // Filter out completely empty options
            submitData.options = data.options.filter(
                (opt) => opt.label.trim() !== '' || opt.value.trim() !== '',
            );

            // Validate we have at least one option
            if (submitData.options.length === 0) {
                console.error('At least one option is required');
                return;
            }
        }

        console.log('Submitting:', submitData);

        if (isEditing) {
            patch(`/admin/form-fields/${formField?.id}`, {
                data: submitData,
                preserveScroll: true,
            });
        } else {
            post('/admin/form-fields', {
                data: submitData,
                preserveScroll: true,
            });
        }
    };

    const addOption = () => {
        setData('options', [...data.options, { label: '', value: '' }]);
    };

    const removeOption = (index: number) => {
        const newOptions = data.options.filter((_, i) => i !== index);
        setData(
            'options',
            newOptions.length > 0 ? newOptions : [{ label: '', value: '' }],
        );
    };

    const updateOption = (
        index: number,
        field: 'label' | 'value',
        value: string,
    ) => {
        const newOptions = [...data.options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setData('options', newOptions);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Edit Form Field' : 'Create Form Field'} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {isEditing
                                ? 'Edit Form Field'
                                : 'Create Form Field'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isEditing
                                ? 'Update the form field details below'
                                : 'Create a new reusable form field'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Field Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Field Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., company_name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Unique identifier (snake_case)
                                </p>
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="label">Display Label *</Label>
                                <Input
                                    id="label"
                                    placeholder="e.g., Company Name"
                                    value={data.label}
                                    onChange={(e) =>
                                        setData('label', e.target.value)
                                    }
                                />
                                <InputError message={errors.label} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Field Type *</Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(value) =>
                                        setData('type', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fieldTypes.map((type) => (
                                            <SelectItem
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="placeholder">Placeholder</Label>
                                <Input
                                    id="placeholder"
                                    placeholder="e.g., Enter company name..."
                                    value={data.placeholder}
                                    onChange={(e) =>
                                        setData('placeholder', e.target.value)
                                    }
                                />
                                <InputError message={errors.placeholder} />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="help_text">Help Text</Label>
                                <Textarea
                                    id="help_text"
                                    placeholder="Additional instructions for this field..."
                                    value={data.help_text}
                                    onChange={(e) =>
                                        setData('help_text', e.target.value)
                                    }
                                    rows={2}
                                />
                                <InputError message={errors.help_text} />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) =>
                                        setData('is_active', checked === true)
                                    }
                                />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Options Section */}
                    {requiresOptions && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Options</CardTitle>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addOption}
                                    >
                                        <Plus className="mr-2 size-4" />
                                        Add Option
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.options.map((option, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-4"
                                    >
                                        <div className="flex-1 space-y-2">
                                            <Label>Label</Label>
                                            <Input
                                                placeholder="Option label"
                                                value={option.label}
                                                onChange={(e) =>
                                                    updateOption(
                                                        index,
                                                        'label',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors[
                                                        `options.${index}.label` as keyof typeof errors
                                                    ]
                                                }
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Label>Value</Label>
                                            <Input
                                                placeholder="Option value"
                                                value={option.value}
                                                onChange={(e) =>
                                                    updateOption(
                                                        index,
                                                        'value',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors[
                                                        `options.${index}.value` as keyof typeof errors
                                                    ]
                                                }
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="mt-8"
                                            onClick={() => removeOption(index)}
                                        >
                                            <Trash className="size-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                <InputError message={errors.options} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Saving...'
                                : isEditing
                                  ? 'Update Form Field'
                                  : 'Create Form Field'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.get('/admin/form-fields')}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
