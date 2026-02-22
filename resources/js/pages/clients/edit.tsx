import { Head, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import clientsRoutes from '@/routes/clients';
import type { BreadcrumbItem } from '@/types';

type Props = {
    client: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        is_active: boolean;
        profile?: {
            address?: string | null;
            city?: string | null;
            state?: string | null;
            country?: string | null;
            postal_code?: string | null;
            date_of_birth?: string | null;
        };
    };
};

export default function EditClient({ client }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Clients', href: clientsRoutes.index.url() },
        { title: client.name, href: clientsRoutes.show.url(client.id) },
        { title: 'Edit', href: clientsRoutes.edit.url(client.id) },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        name: client.name,
        email: client.email,
        password: '',
        password_confirmation: '',
        phone: client.phone ?? '',
        is_active: client.is_active,
        profile: {
            address: client.profile?.address ?? '',
            city: client.profile?.city ?? '',
            state: client.profile?.state ?? '',
            country: client.profile?.country ?? '',
            postal_code: client.profile?.postal_code ?? '',
            date_of_birth: client.profile?.date_of_birth ?? '',
        },
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        patch(clientsRoutes.update.url(client.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${client.name}`} />

            <form onSubmit={submit} className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Client</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={data.name} onChange={(event) => setData('name', event.target.value)} />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input value={data.phone} onChange={(event) => setData('phone', event.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input
                                value={data.profile.address}
                                onChange={(event) =>
                                    setData('profile', { ...data.profile, address: event.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>New Password (optional)</Label>
                            <Input
                                type="password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm Password</Label>
                            <Input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(event) => setData('password_confirmation', event.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Saving...' : 'Update Client'}
                    </Button>
                </div>
            </form>
        </AppLayout>
    );
}
