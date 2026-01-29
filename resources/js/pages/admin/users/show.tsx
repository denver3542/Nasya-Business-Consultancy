import { Head, Link } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem, PageProps } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
    profile_completed: boolean;
    created_at: string;
    roles: Array<{ id: number; name: string }>;
    profile?: {
        date_of_birth: string | null;
        gender: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postal_code: string | null;
        emergency_contact_name: string | null;
        emergency_contact_phone: string | null;
    };
    partner?: {
        company_name: string;
        company_type: string | null;
        license_number: string | null;
        commission_rate: string;
        is_verified: boolean;
    };
}

interface ShowUserProps extends PageProps {
    user: User;
}

export default function Show({ user }: ShowUserProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Users', href: '/admin/users' },
        { title: user.name, href: `/admin/users/${user.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`User: ${user.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{user.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/admin/users/${user.id}/edit`}>
                            <Button>
                                <Pencil className="mr-2 size-4" />
                                Edit User
                            </Button>
                        </Link>
                        <Link href="/admin/users">
                            <Button variant="outline">Back to List</Button>
                        </Link>
                    </div>
                </div>

                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Name
                                </p>
                                <p className="text-base">{user.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Email
                                </p>
                                <p className="text-base">{user.email}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Phone
                                </p>
                                <p className="text-base">
                                    {user.phone || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Role
                                </p>
                                <div className="mt-1">
                                    {user.roles.map((role) => (
                                        <Badge key={role.id}>
                                            {role.name.charAt(0).toUpperCase() +
                                                role.name.slice(1)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Status
                                </p>
                                <div className="mt-1">
                                    <Badge
                                        variant={
                                            user.is_active
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Profile Completed
                                </p>
                                <div className="mt-1">
                                    <Badge
                                        variant={
                                            user.profile_completed
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {user.profile_completed ? 'Yes' : 'No'}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Created At
                                </p>
                                <p className="text-base">
                                    {new Date(
                                        user.created_at,
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profile Information */}
                {user.profile && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Date of Birth
                                    </p>
                                    <p className="text-base">
                                        {user.profile.date_of_birth || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Gender
                                    </p>
                                    <p className="text-base">
                                        {user.profile.gender
                                            ? user.profile.gender
                                                  .charAt(0)
                                                  .toUpperCase() +
                                              user.profile.gender.slice(1)
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Address
                                    </p>
                                    <p className="text-base">
                                        {user.profile.address || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        City
                                    </p>
                                    <p className="text-base">
                                        {user.profile.city || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        State
                                    </p>
                                    <p className="text-base">
                                        {user.profile.state || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Country
                                    </p>
                                    <p className="text-base">
                                        {user.profile.country || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Postal Code
                                    </p>
                                    <p className="text-base">
                                        {user.profile.postal_code || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Emergency Contact
                                    </p>
                                    <p className="text-base">
                                        {user.profile.emergency_contact_name ||
                                            'N/A'}
                                        {user.profile.emergency_contact_phone &&
                                            ` (${user.profile.emergency_contact_phone})`}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Partner Information */}
                {user.partner && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Partner Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Company Name
                                    </p>
                                    <p className="text-base">
                                        {user.partner.company_name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Company Type
                                    </p>
                                    <p className="text-base">
                                        {user.partner.company_type
                                            ? user.partner.company_type
                                                  .split('_')
                                                  .map(
                                                      (word) =>
                                                          word
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                          word.slice(1),
                                                  )
                                                  .join(' ')
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        License Number
                                    </p>
                                    <p className="text-base">
                                        {user.partner.license_number || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Commission Rate
                                    </p>
                                    <p className="text-base">
                                        {user.partner.commission_rate}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Verification Status
                                    </p>
                                    <div className="mt-1">
                                        <Badge
                                            variant={
                                                user.partner.is_verified
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {user.partner.is_verified
                                                ? 'Verified'
                                                : 'Not Verified'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
