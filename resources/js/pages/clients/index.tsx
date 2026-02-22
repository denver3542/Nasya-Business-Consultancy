import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import clientsRoutes from '@/routes/clients';
import type { BreadcrumbItem } from '@/types';

type Client = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    applications_count: number;
    created_at: string;
};

type Props = {
    clients: {
        data: Client[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
    };
    filters: {
        search?: string;
        registered_from?: string;
        registered_to?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Clients', href: clientsRoutes.index.url() },
];

export default function Index({ clients, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [registeredFrom, setRegisteredFrom] = useState(filters.registered_from ?? '');
    const [registeredTo, setRegisteredTo] = useState(filters.registered_to ?? '');

    const submitFilters = () => {
        router.get(
            clientsRoutes.index.url(),
            {
                search: search || undefined,
                registered_from: registeredFrom || undefined,
                registered_to: registeredTo || undefined,
            },
            { preserveState: true },
        );
    };

    const deleteClient = (clientId: number) => {
        if (!window.confirm('Delete this client?')) {
            return;
        }

        router.delete(clientsRoutes.destroy.url(clientId));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Clients</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage client profiles and related applications
                        </p>
                    </div>
                    <Link href={clientsRoutes.create()}>
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Add Client
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-4">
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) => event.key === 'Enter' && submitFilters()}
                        placeholder="Search name/email/phone"
                    />
                    <Input
                        type="date"
                        value={registeredFrom}
                        onChange={(event) => setRegisteredFrom(event.target.value)}
                    />
                    <Input
                        type="date"
                        value={registeredTo}
                        onChange={(event) => setRegisteredTo(event.target.value)}
                    />
                    <Button onClick={submitFilters}>
                        <Search className="mr-2 size-4" />
                        Apply Filters
                    </Button>
                </div>

                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Applications</TableHead>
                                <TableHead>Registered</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        No clients found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clients.data.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-medium">{client.name}</TableCell>
                                        <TableCell>{client.email}</TableCell>
                                        <TableCell>{client.phone || '-'}</TableCell>
                                        <TableCell>{client.applications_count}</TableCell>
                                        <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link href={clientsRoutes.show(client.id)}>
                                                    <Button size="sm" variant="ghost">
                                                        <Eye className="size-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={clientsRoutes.edit(client.id)}>
                                                    <Button size="sm" variant="ghost">
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => deleteClient(client.id)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{clients.total} total clients</p>
                    <div className="flex gap-2">
                        {clients.links.map((link, index) => (
                            <Button
                                key={index}
                                size="sm"
                                variant={link.active ? 'default' : 'outline'}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
