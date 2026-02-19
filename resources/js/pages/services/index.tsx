import { Head, Link, router } from '@inertiajs/react';
import {
    Plus,
    Star,
    MoreHorizontal,
    Pencil,
    Trash,
    Layout,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { UserService } from '@/types/application';

interface ServicesIndexProps {
    services: UserService[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Services', href: '/client/services' },
];

export default function Index({ services }: ServicesIndexProps) {
    const [deleteService, setDeleteService] = useState<UserService | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const starredServices = services.filter((service) => service.is_starred);
    const regularServices = services.filter((service) => !service.is_starred);

    const handleDelete = () => {
        if (!deleteService) return;

        setIsDeleting(true);
        router.delete(`/client/services/${deleteService.id}`, {
            onSuccess: () => {
                setDeleteService(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const handleToggleStar = (service: UserService) => {
        router.post(
            `/client/services/${service.id}/toggle-star`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const ServiceCard = ({ service }: { service: UserService }) => (
        <Card
            className="group cursor-pointer transition-all hover:shadow-md"
            style={{ borderTopColor: service.color, borderTopWidth: '3px' }}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <Link
                        href={`/client/services/${service.id}`}
                        className="flex-1"
                    >
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                    </Link>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={(e) => {
                                e.preventDefault();
                                handleToggleStar(service);
                            }}
                        >
                            <Star
                                className={cn(
                                    'size-4',
                                    service.is_starred
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground',
                                )}
                            />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="size-8 p-0"
                                >
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link
                                        href={`/client/services/${service.id}/edit`}
                                    >
                                        <Pencil className="mr-2 size-4" />
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setDeleteService(service)}
                                >
                                    <Trash className="mr-2 size-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                {service.description && (
                    <CardDescription className="line-clamp-2">
                        {service.description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <Link href={`/client/services/${service.id}`}>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant="secondary">
                            <Layout className="mr-1 size-3" />
                            {service.stages_count || 0} stages
                        </Badge>
                        <Badge variant="secondary">
                            {service.applications_count || 0} applications
                        </Badge>
                    </div>
                </Link>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Services" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Services</h1>
                        <p className="text-sm text-muted-foreground">
                            Organize your applications with service stages
                        </p>
                    </div>
                    <Link href="/client/services/create">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Create Service
                        </Button>
                    </Link>
                </div>

                {/* Starred Services */}
                {starredServices.length > 0 && (
                    <div>
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <Star className="size-5 fill-yellow-400 text-yellow-400" />
                            Starred Services
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {starredServices.map((service) => (
                                <ServiceCard key={service.id} service={service} />
                            ))}
                        </div>
                    </div>
                )}

                {/* All Services */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold">
                        {starredServices.length > 0
                            ? 'Other Services'
                            : 'All Services'}
                    </h2>
                    {regularServices.length === 0 &&
                    starredServices.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center py-12">
                            <Layout className="mb-4 size-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold">
                                No services yet
                            </h3>
                            <p className="mb-4 text-sm text-muted-foreground">
                                Create your first service to start organizing
                                applications
                            </p>
                            <Link href="/client/services/create">
                                <Button>
                                    <Plus className="mr-2 size-4" />
                                    Create Service
                                </Button>
                            </Link>
                        </Card>
                    ) : regularServices.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            All your services are starred!
                        </p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {regularServices.map((service) => (
                                <ServiceCard key={service.id} service={service} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!deleteService}
                onOpenChange={() => setDeleteService(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Service</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteService?.name}
                            "? Applications on this service will be removed from
                            the service but not deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteService(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
