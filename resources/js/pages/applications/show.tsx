import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle,
    Edit,
    FileText,
    History,
    Pencil,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

import ApplicationStatusBadge from '@/components/application-status-badge';
import ApplicationTimeline from '@/components/application-timeline';
import DocumentUploadList from '@/components/document-upload-list';
import PaymentSummaryCard from '@/components/payment-summary-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type {
    Application,
    ApplicationDocument,
    ApplicationTimeline as TimelineType,
    BreadcrumbItem,
    Payment,
} from '@/types';

interface ApplicationShowProps {
    application: Application & {
        documents: ApplicationDocument[];
        timeline: TimelineType[];
        payments: Payment[];
    };
    canEdit: boolean;
    canApprove: boolean;
    canReject: boolean;
    canComplete: boolean;
}

export default function Show({
    application,
    canEdit,
    canApprove,
    canReject,
    canComplete,
}: ApplicationShowProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Applications', href: '/applications' },
        {
            title: application.application_number,
            href: `/applications/${application.id}`,
        },
    ];

    const handleAction = (action: 'approve' | 'reject' | 'complete') => {
        setIsProcessing(true);
        router.post(
            `/applications/${application.id}/${action}`,
            {},
            {
                onSuccess: () => {
                    setIsProcessing(false);
                },
                onError: () => {
                    setIsProcessing(false);
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Application ${application.application_number}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold">
                                Application #{application.application_number}
                            </h1>
                            {application.status && (
                                <ApplicationStatusBadge
                                    status={application.status}
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                                Type:{' '}
                                {application.application_type?.name || 'N/A'}
                            </span>
                            <span>•</span>
                            <span>User: {application.user?.name || 'N/A'}</span>
                            {application.submitted_at && (
                                <>
                                    <span>•</span>
                                    <span>
                                        Submitted:{' '}
                                        {new Date(
                                            application.submitted_at,
                                        ).toLocaleDateString()}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {canEdit && application.can_edit && (
                            <Link href={`/applications/${application.id}/edit`}>
                                <Button variant="outline">
                                    <Pencil className="mr-2 size-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                        {canApprove && (
                            <Button
                                onClick={() => handleAction('approve')}
                                disabled={isProcessing}
                            >
                                <CheckCircle className="mr-2 size-4" />
                                Approve
                            </Button>
                        )}
                        {canReject && (
                            <Button
                                variant="destructive"
                                onClick={() => handleAction('reject')}
                                disabled={isProcessing}
                            >
                                <XCircle className="mr-2 size-4" />
                                Reject
                            </Button>
                        )}
                        {canComplete && (
                            <Button
                                onClick={() => handleAction('complete')}
                                disabled={isProcessing}
                            >
                                <CheckCircle className="mr-2 size-4" />
                                Mark Complete
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="details">
                                    <FileText className="mr-2 size-4" />
                                    Details
                                </TabsTrigger>
                                <TabsTrigger value="timeline">
                                    <History className="mr-2 size-4" />
                                    Timeline
                                </TabsTrigger>
                                <TabsTrigger value="documents">
                                    <FileText className="mr-2 size-4" />
                                    Documents
                                </TabsTrigger>
                                <TabsTrigger value="notes">
                                    <Edit className="mr-2 size-4" />
                                    Notes
                                </TabsTrigger>
                            </TabsList>

                            {/* Details Tab */}
                            <TabsContent value="details">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Application Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Application Number
                                                </p>
                                                <p className="text-sm font-semibold">
                                                    {
                                                        application.application_number
                                                    }
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Application Type
                                                </p>
                                                <p className="text-sm">
                                                    {application
                                                        .application_type
                                                        ?.name || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Applicant
                                                </p>
                                                <p className="text-sm">
                                                    {application.user?.name ||
                                                        'N/A'}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Status
                                                </p>
                                                {application.status && (
                                                    <ApplicationStatusBadge
                                                        status={
                                                            application.status
                                                        }
                                                    />
                                                )}
                                            </div>
                                            {application.submitted_at && (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-muted-foreground">
                                                        Submitted Date
                                                    </p>
                                                    <p className="text-sm">
                                                        {new Date(
                                                            application.submitted_at,
                                                        ).toLocaleString()}
                                                    </p>
                                                </div>
                                            )}
                                            {application.deadline && (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-muted-foreground">
                                                        Deadline
                                                    </p>
                                                    <p className="text-sm">
                                                        {new Date(
                                                            application.deadline,
                                                        ).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                            {application.assigned_staff && (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-muted-foreground">
                                                        Assigned Staff
                                                    </p>
                                                    <p className="text-sm">
                                                        {
                                                            application
                                                                .assigned_staff
                                                                .name
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Completion Progress
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                                                        <div
                                                            className="h-2 rounded-full bg-blue-600"
                                                            style={{
                                                                width: `${application.completion_percentage}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium">
                                                        {
                                                            application.completion_percentage
                                                        }
                                                        %
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {application.form_data &&
                                            Object.keys(application.form_data)
                                                .length > 0 && (
                                                <>
                                                    <Separator />
                                                    <div>
                                                        <h3 className="mb-3 text-sm font-semibold">
                                                            Form Data
                                                        </h3>
                                                        <div className="grid gap-4 md:grid-cols-2">
                                                            {Object.entries(
                                                                application.form_data,
                                                            ).map(
                                                                ([
                                                                    key,
                                                                    value,
                                                                ]) => (
                                                                    <div
                                                                        key={
                                                                            key
                                                                        }
                                                                        className="space-y-1"
                                                                    >
                                                                        <p className="text-sm font-medium text-muted-foreground capitalize">
                                                                            {key.replace(
                                                                                /_/g,
                                                                                ' ',
                                                                            )}
                                                                        </p>
                                                                        <p className="text-sm">
                                                                            {typeof value ===
                                                                            'boolean'
                                                                                ? value
                                                                                    ? 'Yes'
                                                                                    : 'No'
                                                                                : String(
                                                                                      value,
                                                                                  )}
                                                                        </p>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Timeline Tab */}
                            <TabsContent value="timeline">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Application Timeline
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {application.timeline &&
                                        application.timeline.length > 0 ? (
                                            <ApplicationTimeline
                                                timeline={application.timeline}
                                            />
                                        ) : (
                                            <p className="text-center text-sm text-muted-foreground">
                                                No timeline events yet
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Documents Tab */}
                            <TabsContent value="documents">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Application Documents
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {application.documents &&
                                        application.documents.length > 0 ? (
                                            <DocumentUploadList
                                                documents={
                                                    application.documents
                                                }
                                                applicationId={application.id}
                                                requiredDocuments={
                                                    application.application_type
                                                        ?.required_documents ||
                                                    []
                                                }
                                            />
                                        ) : (
                                            <p className="text-center text-sm text-muted-foreground">
                                                No documents uploaded yet
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Notes Tab */}
                            <TabsContent value="notes">
                                <div className="space-y-4">
                                    {/* Client Notes */}
                                    {application.client_notes && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>
                                                    Client Notes
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {application.client_notes}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Staff Notes */}
                                    {application.staff_notes && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>
                                                    Staff Notes
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {application.staff_notes}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {!application.client_notes &&
                                        !application.staff_notes && (
                                            <Card>
                                                <CardContent className="py-8">
                                                    <p className="text-center text-sm text-muted-foreground">
                                                        No notes available
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Payment Summary */}
                        {application.payments &&
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

                        {/* Application Type Info */}
                        {application.application_type && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Type Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div>
                                        <p className="font-medium">
                                            {application.application_type.name}
                                        </p>
                                        {application.application_type
                                            .description && (
                                            <p className="mt-1 text-muted-foreground">
                                                {
                                                    application.application_type
                                                        .description
                                                }
                                            </p>
                                        )}
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Base Fee:
                                            </span>
                                            <span className="font-medium">
                                                {application.application_type
                                                    .formatted_fee ||
                                                    `₱${application.application_type.base_fee}`}
                                            </span>
                                        </div>
                                        {application.application_type
                                            .estimated_duration && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    Est. Duration:
                                                </span>
                                                <span className="font-medium">
                                                    {
                                                        application
                                                            .application_type
                                                            .estimated_duration
                                                    }
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Required Documents */}
                        {application.application_type?.required_documents &&
                            application.application_type.required_documents
                                .length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Required Documents
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm">
                                            {application.application_type.required_documents.map(
                                                (doc, index) => (
                                                    <li
                                                        key={index}
                                                        className="flex items-start gap-2"
                                                    >
                                                        <span className="mt-1 size-1.5 rounded-full bg-muted-foreground" />
                                                        <span>{doc}</span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
