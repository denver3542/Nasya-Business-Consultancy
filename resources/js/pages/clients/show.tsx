import { Head, Link } from '@inertiajs/react';

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
import applications from '@/routes/applications';
import clientsRoutes from '@/routes/clients';
import type { BreadcrumbItem } from '@/types';

type Props = {
    client: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        created_at: string;
        applications_count: number;
        profile?: {
            address?: string | null;
            city?: string | null;
            state?: string | null;
            country?: string | null;
            postal_code?: string | null;
        };
        applications: Array<{
            id: number;
            application_number: string;
            priority_label: string;
            created_at: string;
            application_type?: { name: string };
            status?: { name: string };
        }>;
    };
};

export default function ShowClient({ client }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Clients', href: clientsRoutes.index.url() },
        { title: client.name, href: clientsRoutes.show.url(client.id) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Client ${client.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{client.name}</h1>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                    </div>
                    <Link href={clientsRoutes.edit(client.id)}>
                        <Button>Edit Client</Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Profile Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p>{client.phone || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Address</p>
                            <p>{client.profile?.address || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Registered</p>
                            <p>{new Date(client.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total Applications</p>
                            <p>{client.applications_count}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Number</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {client.applications.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center">
                                            No applications
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    client.applications.map((application) => (
                                        <TableRow key={application.id}>
                                            <TableCell>
                                                <Link
                                                    href={applications.show(application.id)}
                                                    className="underline"
                                                >
                                                    {application.application_number}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{application.application_type?.name || '-'}</TableCell>
                                            <TableCell>{application.status?.name || '-'}</TableCell>
                                            <TableCell>{application.priority_label}</TableCell>
                                            <TableCell>
                                                {new Date(application.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
