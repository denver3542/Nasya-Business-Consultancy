import { Transition } from '@headlessui/react';
import { Head, router } from '@inertiajs/react';
import { Save, Send } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import DocumentUploadList from '@/components/document-upload-list';
import InputError from '@/components/input-error';
import PaymentSummaryCard from '@/components/payment-summary-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import type {
    Application,
    ApplicationDocument,
    ApplicationType,
    BreadcrumbItem,
    FormField,
} from '@/types';

interface ClientOption {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    profile_completed: boolean;
}

interface ServiceOption {
    id: number;
    user_id: number;
    name: string;
    description?: string | null;
    color?: string | null;
    form_fields_array?: FormField[];
}

interface ApplicationFormProps {
    clients?: ClientOption[];
    services?: ServiceOption[];
    application?: Application;
    applicationTypes?: ApplicationType[];
    errors: Record<string, string>;
}

export default function ApplicationForm({
    clients = [],
    services = [],
    application,
    applicationTypes = [],
    errors,
}: ApplicationFormProps) {
    const isEditing = !!application;
    const [selectedTypeId] = useState<number | null>(
        application?.application_type_id || null,
    );
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
        application?.service_id || null,
    );
    const [formData, setFormData] = useState<Record<string, unknown>>(
        application?.form_data || {},
    );
    const [clientNotes, setClientNotes] = useState(
        application?.client_notes || '',
    );
    const [completionPercentage, setCompletionPercentage] = useState(
        application?.completion_percentage || 0,
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recentlySaved, setRecentlySaved] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(
        application?.client_id || null,
    );

    const selectedType = applicationTypes.find((t) => t.id === selectedTypeId);
    const selectedService = services.find((service) => service.id === selectedServiceId);

    const clientProfileFieldNames = useMemo(
        () =>
            new Set([
                'name',
                'full_name',
                'first_name',
                'middle_name',
                'last_name',
                'email',
                'phone',
                'phone_number',
                'contact_number',
                'mobile_number',
                'address',
                'address_line1',
                'address_line2',
                'city',
                'state',
                'country',
                'postal_code',
                'zip',
                'zip_code',
                'date_of_birth',
            ]),
        [],
    );

    const servicesForSelectedClient = useMemo(() => services, [services]);

    const formFields = useMemo(() => {
        if (isEditing) {
            return selectedType?.form_fields_array ?? selectedType?.form_fields ?? [];
        }

        return selectedService?.form_fields_array ?? [];
    }, [isEditing, selectedService?.form_fields_array, selectedType?.form_fields_array, selectedType?.form_fields]);

    const applicationSpecificFields = useMemo(
        () =>
            formFields.filter(
                (field) => !clientProfileFieldNames.has(field.name),
            ),
        [formFields, clientProfileFieldNames],
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Applications', href: '/applications' },
        {
            title: isEditing ? 'Edit Application' : 'New Application',
            href: isEditing
                ? `/applications/${application.id}/edit`
                : '/applications/create',
        },
    ];

    const handleFieldChange = (fieldName: string, value: unknown) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
    };

    const handleSaveDraft = useCallback(() => {
        setIsSaving(true);
        const url = isEditing
            ? `/applications/${application.id}`
            : '/applications';
        const method = isEditing ? 'put' : 'post';

        router[method](
            url,
            {
                client_id: selectedClientId,
                ...(isEditing
                    ? { application_type_id: selectedTypeId }
                    : { service_id: selectedServiceId }),
                form_data: formData,
                client_notes: clientNotes,
                is_draft: true,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                    setRecentlySaved(true);
                    setTimeout(() => setRecentlySaved(false), 2000);
                },
                onError: () => {
                    setIsSaving(false);
                },
            },
        );
    }, [
        isEditing,
        application?.id,
        selectedClientId,
        selectedTypeId,
        selectedServiceId,
        formData,
        clientNotes,
    ]);

    useEffect(() => {
        if (applicationSpecificFields.length === 0) {
            setCompletionPercentage(100);
            return;
        }

        const totalFields = applicationSpecificFields.length;
        const completedFields = applicationSpecificFields.filter((field) => {
            const value = formData[field.name];
            if (field.required) {
                return value !== undefined && value !== null && value !== '';
            }
            return true;
        }).length;

        setCompletionPercentage(
            Math.round((completedFields / totalFields) * 100),
        );
    }, [formData, applicationSpecificFields]);

    useEffect(() => {
        if (!isEditing || !application?.is_draft) {
            return;
        }

        const interval = setInterval(() => {
            handleSaveDraft();
        }, 30000);

        return () => clearInterval(interval);
    }, [isEditing, application?.is_draft, handleSaveDraft]);

    const handleSubmit = () => {
        setIsSubmitting(true);
        const url = isEditing
            ? `/applications/${application.id}`
            : '/applications';
        const method = isEditing ? 'put' : 'post';

        router[method](
            url,
            {
                client_id: selectedClientId,
                ...(isEditing
                    ? { application_type_id: selectedTypeId }
                    : { service_id: selectedServiceId }),
                form_data: formData,
                client_notes: clientNotes,
                is_draft: false,
            },
            {
                onSuccess: () => {
                    setIsSubmitting(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const renderField = (field: FormField) => {
        const value = formData[field.name];

        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label}
                            {field.required && (
                                <span className="text-red-500">*</span>
                            )}
                        </Label>
                        <Input
                            id={field.name}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={(value as string) || ''}
                            onChange={(e) =>
                                handleFieldChange(field.name, e.target.value)
                            }
                            required={field.required}
                        />
                        {field.help_text && (
                            <p className="text-xs text-muted-foreground">
                                {field.help_text}
                            </p>
                        )}
                        <InputError
                            message={errors[`form_data.${field.name}`]}
                        />
                    </div>
                );

            case 'textarea':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label}
                            {field.required && (
                                <span className="text-red-500">*</span>
                            )}
                        </Label>
                        <textarea
                            id={field.name}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            placeholder={field.placeholder}
                            value={(value as string) || ''}
                            onChange={(e) =>
                                handleFieldChange(field.name, e.target.value)
                            }
                            required={field.required}
                        />
                        {field.help_text && (
                            <p className="text-xs text-muted-foreground">
                                {field.help_text}
                            </p>
                        )}
                        <InputError
                            message={errors[`form_data.${field.name}`]}
                        />
                    </div>
                );

            case 'select':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label}
                            {field.required && (
                                <span className="text-red-500">*</span>
                            )}
                        </Label>
                        <Select
                            value={(value as string) || ''}
                            onValueChange={(val) =>
                                handleFieldChange(field.name, val)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        field.placeholder || 'Select an option'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.isArray(field.options) &&
                                    field.options.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                        {field.help_text && (
                            <p className="text-xs text-muted-foreground">
                                {field.help_text}
                            </p>
                        )}
                        <InputError
                            message={errors[`form_data.${field.name}`]}
                        />
                    </div>
                );

            case 'date':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label}
                            {field.required && (
                                <span className="text-red-500">*</span>
                            )}
                        </Label>
                        <Input
                            id={field.name}
                            type="date"
                            value={(value as string) || ''}
                            onChange={(e) =>
                                handleFieldChange(field.name, e.target.value)
                            }
                            required={field.required}
                        />
                        {field.help_text && (
                            <p className="text-xs text-muted-foreground">
                                {field.help_text}
                            </p>
                        )}
                        <InputError
                            message={errors[`form_data.${field.name}`]}
                        />
                    </div>
                );

            case 'checkbox':
                return (
                    <div key={field.name} className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <input
                                id={field.name}
                                type="checkbox"
                                checked={(value as boolean) || false}
                                onChange={(e) =>
                                    handleFieldChange(
                                        field.name,
                                        e.target.checked,
                                    )
                                }
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor={field.name} className="font-normal">
                                {field.label}
                                {field.required && (
                                    <span className="text-red-500">*</span>
                                )}
                            </Label>
                        </div>
                        {field.help_text && (
                            <p className="text-xs text-muted-foreground">
                                {field.help_text}
                            </p>
                        )}
                        <InputError
                            message={errors[`form_data.${field.name}`]}
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Edit Application' : 'New Application'} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {isEditing ? 'Edit Application' : 'New Application'}
                        </h1>
                        {isEditing && (
                            <p className="text-sm text-muted-foreground">
                                Application #{application.application_number}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Transition
                            show={recentlySaved}
                            enter="transition-opacity duration-75"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity duration-150"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <p className="text-sm text-muted-foreground">Saved.</p>
                        </Transition>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-4 lg:col-span-2">
                        {clients.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Client</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <Label htmlFor="client">Select Client</Label>
                                        <Select
                                            value={selectedClientId?.toString() || ''}
                                            onValueChange={(val) =>
                                                setSelectedClientId(parseInt(val, 10))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a client" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {clients.map((client) => (
                                                    <SelectItem
                                                        key={client.id}
                                                        value={client.id.toString()}
                                                    >
                                                        {client.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.client_id} />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {!isEditing && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Service</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="service">
                                            Select Service
                                            <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={selectedServiceId?.toString() || ''}
                                            onValueChange={(val) =>
                                                setSelectedServiceId(parseInt(val, 10))
                                            }
                                            disabled={servicesForSelectedClient.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={
                                                        servicesForSelectedClient.length === 0
                                                            ? 'No services available'
                                                            : 'Choose a service'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {servicesForSelectedClient.length === 0 ? (
                                                    <SelectItem value="none" disabled>
                                                        No services available for this client
                                                    </SelectItem>
                                                ) : (
                                                    servicesForSelectedClient.map((service) => (
                                                        <SelectItem
                                                            key={service.id}
                                                            value={service.id.toString()}
                                                        >
                                                            {service.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.service_id} />
                                    </div>

                                    {selectedService && (
                                        <div className="space-y-2 rounded-lg bg-muted p-4">
                                            <p className="text-sm font-medium">{selectedService.name}</p>
                                            {selectedService.description && (
                                                <p className="text-xs text-muted-foreground">
                                                    {selectedService.description}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {applicationSpecificFields.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Application Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {applicationSpecificFields.map(renderField)}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label htmlFor="client-notes">
                                        Notes or Special Instructions (Optional)
                                    </Label>
                                    <textarea
                                        id="client-notes"
                                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                        placeholder="Enter any additional information or special requests..."
                                        value={clientNotes}
                                        onChange={(e) => setClientNotes(e.target.value)}
                                    />
                                    <InputError message={errors.client_notes} />
                                </div>
                            </CardContent>
                        </Card>

                        {isEditing &&
                            application.documents &&
                            application.documents.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Documents</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <DocumentUploadList
                                            documents={
                                                application.documents as ApplicationDocument[]
                                            }
                                            applicationId={application.id}
                                            requiredDocuments={
                                                selectedType?.required_documents ||
                                                []
                                            }
                                        />
                                    </CardContent>
                                </Card>
                            )}
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Completion Progress</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="font-medium">
                                            {completionPercentage}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div
                                            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                                            style={{
                                                width: `${completionPercentage}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                                <Separator />
                            </CardContent>
                        </Card>

                        {isEditing &&
                            application.payments &&
                            application.payments.length > 0 && (
                                <PaymentSummaryCard
                                    totalFee={application.total_fee || 0}
                                    amountPaid={application.amount_paid || 0}
                                    remainingBalance={
                                        application.remaining_balance || 0
                                    }
                                    payments={application.payments}
                                />
                            )}

                        <Card>
                            <CardContent className="space-y-2 pt-6">
                                <Button
                                    className="w-full"
                                    onClick={handleSubmit}
                                    disabled={
                                        (!isEditing && (!selectedClientId || !selectedServiceId)) ||
                                        completionPercentage < 100 ||
                                        isSubmitting ||
                                        isSaving
                                    }
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Spinner className="mr-2 size-4" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 size-4" />
                                            Submit Application
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleSaveDraft}
                                    disabled={
                                        (!isEditing && (!selectedClientId || !selectedServiceId)) ||
                                        isSaving ||
                                        isSubmitting
                                    }
                                >
                                    {isSaving ? (
                                        <>
                                            <Spinner className="mr-2 size-4" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 size-4" />
                                            Save as Draft
                                        </>
                                    )}
                                </Button>
                                {completionPercentage < 100 && (
                                    <p className="text-center text-xs text-muted-foreground">
                                        Complete all required fields to submit
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
