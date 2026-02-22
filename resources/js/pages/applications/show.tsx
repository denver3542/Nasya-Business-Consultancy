import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle, Download, FileUp, Pencil, Send, Trash2, XCircle } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

import ApplicationStatusBadge from '@/components/application-status-badge';
import ApplicationTimeline from '@/components/application-timeline';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type {
    Application,
    ApplicationComment,
    ApplicationDocument,
    ApplicationUser,
    ApplicationTimeline as TimelineType,
    BreadcrumbItem,
} from '@/types';

type ShowProps = {
    application: Application & {
        documents: ApplicationDocument[];
        timeline: TimelineType[];
        comments: ApplicationComment[];
        user: ApplicationUser;
        assigned_staff: ApplicationUser | null;
        application_type: { name: string; required_documents?: string[] };
    };
    staffUsers: ApplicationUser[];
    availableTags: string[];
    canEdit: boolean;
    canApprove: boolean;
    canReject: boolean;
    canComplete: boolean;
};

const priorityOptions = [
    { value: 0, label: 'None' },
    { value: 1, label: 'Low' },
    { value: 2, label: 'Medium' },
    { value: 3, label: 'High' },
    { value: 4, label: 'Urgent' },
];

const priorityBadge = (priority: number) => {
    const map: Record<number, string> = {
        0: 'bg-gray-100 text-gray-700',
        1: 'bg-blue-100 text-blue-700',
        2: 'bg-yellow-100 text-yellow-800',
        3: 'bg-orange-100 text-orange-800',
        4: 'bg-red-100 text-red-800',
    };

    return map[priority] ?? map[0];
};

export default function Show({
    application,
    staffUsers,
    availableTags,
    canEdit,
    canApprove,
    canReject,
    canComplete,
}: ShowProps) {
    const [comment, setComment] = useState('');
    const [commentFiles, setCommentFiles] = useState<File[]>([]);
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const [selectedWatchers, setSelectedWatchers] = useState<number[]>(
        application.watchers?.map((watcher) => watcher.id) ?? [],
    );
    const [newTag, setNewTag] = useState('');
    const [emailTemplate, setEmailTemplate] = useState('approved');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [documentFiles, setDocumentFiles] = useState<File[]>([]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Applications', href: '/applications' },
        { title: application.application_number, href: `/applications/${application.id}` },
    ];

    const isOverdue = useMemo(() => {
        if (!application.due_date) {
            return false;
        }

        return new Date(application.due_date).getTime() < Date.now();
    }, [application.due_date]);

    const submitComment = (event: FormEvent) => {
        event.preventDefault();
        const payload = new FormData();
        payload.append('comment', comment);
        if (replyTo) {
            payload.append('parent_id', String(replyTo));
        }

        commentFiles.forEach((file) => payload.append('attachments[]', file));

        router.post(`/applications/${application.id}/add-comment`, payload, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setComment('');
                setCommentFiles([]);
                setReplyTo(null);
            },
        });
    };

    const toggleLike = (commentId: number) => {
        router.post(`/applications/${application.id}/comments/${commentId}/toggle-like`, {}, { preserveScroll: true });
    };

    const deleteComment = (commentId: number) => {
        router.delete(`/applications/${application.id}/comments/${commentId}`, { preserveScroll: true });
    };

    const uploadDocuments = () => {
        if (documentFiles.length === 0) {
            return;
        }

        const payload = new FormData();
        documentFiles.forEach((file) => payload.append('files[]', file));

        router.post(`/applications/${application.id}/documents`, payload, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setDocumentFiles([]),
        });
    };

    const removeDocument = (documentId: number) => {
        router.delete(`/applications/${application.id}/documents/${documentId}`, { preserveScroll: true });
    };

    const updatePriority = (priority: string) => {
        router.post(`/applications/${application.id}/update-priority`, { priority: Number(priority) }, { preserveScroll: true });
    };

    const addTag = () => {
        if (!newTag.trim()) {
            return;
        }

        router.post(
            `/applications/${application.id}/add-tag`,
            { tag: newTag.trim() },
            {
                preserveScroll: true,
                onSuccess: () => setNewTag(''),
            },
        );
    };

    const removeTag = (tag: string) => {
        router.post(`/applications/${application.id}/remove-tag`, { tag }, { preserveScroll: true });
    };

    const saveWatchers = () => {
        router.post(`/applications/${application.id}/watchers/sync`, { watcher_ids: selectedWatchers }, { preserveScroll: true });
    };

    const updateDateField = (field: string, value: string) => {
        router.post(`/applications/${application.id}/dates`, { [field]: value || null }, { preserveScroll: true });
    };

    const sendEmail = () => {
        router.post(
            `/applications/${application.id}/send-email`,
            {
                template: emailTemplate,
                subject: emailSubject || null,
                message: emailMessage || null,
            },
            { preserveScroll: true },
        );
    };

    const handleAction = (action: 'approve' | 'reject' | 'complete') => {
        router.post(`/applications/${application.id}/${action}`);
    };

    const toggleWatcher = (userId: number) => {
        if (selectedWatchers.includes(userId)) {
            setSelectedWatchers(selectedWatchers.filter((id) => id !== userId));
            return;
        }

        setSelectedWatchers([...selectedWatchers, userId]);
    };

    const commentsTree = application.comments ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Application ${application.application_number}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h1 className="text-2xl font-bold">Application #{application.application_number}</h1>
                                    <p className="text-sm text-muted-foreground">
                                        {application.application_type?.name}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {application.status && <ApplicationStatusBadge status={application.status} />}
                                    <Badge className={priorityBadge(application.priority)}>
                                        {application.priority_label}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border p-4">
                                <p className="text-xs font-semibold text-muted-foreground">Client Information</p>
                                <div className="mt-2 grid gap-3 md:grid-cols-2">
                                    <p><span className="font-medium">Name:</span> {application.user?.name ?? 'N/A'}</p>
                                    <p><span className="font-medium">Email:</span> {application.user?.email ?? 'N/A'}</p>
                                    <p><span className="font-medium">Phone:</span> {application.user?.phone ?? 'N/A'}</p>
                                    <p><span className="font-medium">Address:</span> {application.user?.profile?.address ?? 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {canEdit && application.can_edit && (
                                    <Link href={`/applications/${application.id}/edit`}>
                                        <Button variant="outline" size="sm">
                                            <Pencil className="mr-2 size-4" />
                                            Edit
                                        </Button>
                                    </Link>
                                )}
                                {canApprove && (
                                    <Button onClick={() => handleAction('approve')} size="sm">
                                        <CheckCircle className="mr-2 size-4" />
                                        Approve
                                    </Button>
                                )}
                                {canReject && (
                                    <Button variant="destructive" onClick={() => handleAction('reject')} size="sm">
                                        <XCircle className="mr-2 size-4" />
                                        Reject
                                    </Button>
                                )}
                                {canComplete && (
                                    <Button onClick={() => handleAction('complete')} size="sm">
                                        <CheckCircle className="mr-2 size-4" />
                                        Complete
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Controls</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select value={String(application.priority)} onValueChange={updatePriority}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priorityOptions.map((priority) => (
                                            <SelectItem key={priority.value} value={String(priority.value)}>
                                                {priority.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Tags</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newTag}
                                        list="application-tags"
                                        onChange={(event) => setNewTag(event.target.value)}
                                        placeholder="Add tag"
                                    />
                                    <Button size="sm" onClick={addTag}>Add</Button>
                                </div>
                                <datalist id="application-tags">
                                    {availableTags.map((tag) => (
                                        <option key={tag} value={tag} />
                                    ))}
                                </datalist>
                                <div className="flex flex-wrap gap-2">
                                    {(application.tags ?? []).map((tag) => (
                                        <Badge key={tag} className="cursor-pointer" onClick={() => removeTag(tag)}>
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={application.due_date ? application.due_date.slice(0, 10) : ''}
                                    onChange={(event) => updateDateField('due_date', event.target.value)}
                                />
                                {isOverdue && <p className="text-xs text-red-600">This application is overdue.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="comments" className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="comments">Comments</TabsTrigger>
                        <TabsTrigger value="documents">Files</TabsTrigger>
                        <TabsTrigger value="timeline">Activity</TabsTrigger>
                        <TabsTrigger value="watchers">Watchers</TabsTrigger>
                        <TabsTrigger value="dates">Dates</TabsTrigger>
                        <TabsTrigger value="email">Email</TabsTrigger>
                    </TabsList>

                    <TabsContent value="comments">
                        <Card>
                            <CardHeader>
                                <CardTitle>Comments</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <form onSubmit={submitComment} className="space-y-3 rounded-lg border p-3">
                                    <div className="flex gap-2">
                                        <Button type="button" size="sm" variant="outline" onClick={() => setComment(`${comment} ??`)}>
                                            ??
                                        </Button>
                                        <Button type="button" size="sm" variant="outline" onClick={() => setComment(`${comment} ??`)}>
                                            ??
                                        </Button>
                                        <Button type="button" size="sm" variant="outline" onClick={() => setComment(`${comment} @`)}>
                                            @mention
                                        </Button>
                                    </div>
                                    <Textarea
                                        value={comment}
                                        onChange={(event) => setComment(event.target.value)}
                                        placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
                                    />
                                    <Input
                                        type="file"
                                        multiple
                                        onChange={(event) => setCommentFiles(Array.from(event.target.files ?? []))}
                                    />
                                    {replyTo && (
                                        <Button type="button" variant="outline" size="sm" onClick={() => setReplyTo(null)}>
                                            Cancel Reply
                                        </Button>
                                    )}
                                    <Button type="submit">Post Comment</Button>
                                </form>

                                <div className="space-y-3">
                                    {commentsTree.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No comments yet.</p>
                                    ) : (
                                        commentsTree.map((entry) => (
                                            <div key={entry.id} className="rounded-lg border p-3">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <Avatar className="size-8">
                                                        <AvatarFallback>{entry.user?.name?.slice(0, 2) ?? 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium">{entry.user?.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(entry.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap">{entry.comment}</p>
                                                {(entry.attachments ?? []).length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                        {(entry.attachments ?? []).map((attachment, index) => (
                                                            <Badge key={index} variant="outline">{attachment.split('/').pop()}</Badge>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="mt-2 flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => setReplyTo(entry.id)}>
                                                        Reply
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => toggleLike(entry.id)}>
                                                        Like ({entry.likes?.length ?? 0})
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => deleteComment(entry.id)}>
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>

                                                {(entry.replies ?? []).length > 0 && (
                                                    <div className="mt-3 space-y-2 border-l pl-4">
                                                        {entry.replies.map((reply) => (
                                                            <div key={reply.id} className="rounded-md bg-muted p-2">
                                                                <p className="text-xs font-semibold">{reply.user?.name}</p>
                                                                <p className="text-sm whitespace-pre-wrap">{reply.comment}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="documents">
                        <Card>
                            <CardHeader>
                                <CardTitle>File Attachments</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div
                                    className="rounded-lg border border-dashed p-6 text-center"
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        setDocumentFiles(Array.from(event.dataTransfer.files));
                                    }}
                                >
                                    <FileUp className="mx-auto mb-2 size-6 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Drag and drop files here</p>
                                    <Input
                                        type="file"
                                        multiple
                                        className="mt-3"
                                        onChange={(event) => setDocumentFiles(Array.from(event.target.files ?? []))}
                                    />
                                    <Button className="mt-3" onClick={uploadDocuments}>
                                        Upload Selected Files
                                    </Button>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    {application.documents?.map((document) => (
                                        <div key={document.id} className="flex items-center justify-between rounded-md border p-3">
                                            <div>
                                                <p className="text-sm font-medium">{document.file_name}</p>
                                                <p className="text-xs text-muted-foreground">{document.document_type}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => window.open(`/applications/${application.id}/documents/${document.id}/download`, '_blank')}
                                                >
                                                    <Download className="size-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => removeDocument(document.id)}>
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="timeline">
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity Timeline</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ApplicationTimeline timeline={application.timeline ?? []} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="watchers">
                        <Card>
                            <CardHeader>
                                <CardTitle>Assigned Watchers</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2 md:grid-cols-2">
                                    {staffUsers.map((staff) => (
                                        <label key={staff.id} className="flex items-center gap-2 rounded border p-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedWatchers.includes(staff.id)}
                                                onChange={() => toggleWatcher(staff.id)}
                                            />
                                            <Avatar className="size-7">
                                                <AvatarFallback>{staff.name.slice(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm">{staff.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <Button onClick={saveWatchers}>Save Watchers</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="dates">
                        <Card>
                            <CardHeader>
                                <CardTitle>Dates Management</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={application.start_date ? application.start_date.slice(0, 10) : ''}
                                        onChange={(event) => updateDateField('start_date', event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Due Date</Label>
                                    <Input
                                        type="date"
                                        value={application.due_date ? application.due_date.slice(0, 10) : ''}
                                        onChange={(event) => updateDateField('due_date', event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Submitted At</Label>
                                    <Input
                                        type="datetime-local"
                                        value={application.submitted_at ? application.submitted_at.slice(0, 16) : ''}
                                        onChange={(event) => updateDateField('submitted_at', event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Approved At</Label>
                                    <Input
                                        type="datetime-local"
                                        value={application.approved_at ? application.approved_at.slice(0, 16) : ''}
                                        onChange={(event) => updateDateField('approved_at', event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Completed At</Label>
                                    <Input
                                        type="datetime-local"
                                        value={application.completed_at ? application.completed_at.slice(0, 16) : ''}
                                        onChange={(event) => updateDateField('completed_at', event.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="email">
                        <Card>
                            <CardHeader>
                                <CardTitle>Send Client Email</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Select value={emailTemplate} onValueChange={setEmailTemplate}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                        <SelectItem value="needs_info">Needs Info</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="Custom subject (optional)"
                                    value={emailSubject}
                                    onChange={(event) => setEmailSubject(event.target.value)}
                                />
                                <Textarea
                                    placeholder="Custom message (optional)"
                                    value={emailMessage}
                                    onChange={(event) => setEmailMessage(event.target.value)}
                                />
                                <Button onClick={sendEmail}>
                                    <Send className="mr-2 size-4" />
                                    Send Email
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
