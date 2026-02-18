import { Head, usePage } from '@inertiajs/react';
import { Form, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Applications', href: '/applications' },
    { title: 'Settings', href: '/applications/settings' },
];

export default function Settings() {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Application Settings" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Application Settings</h1>
                <p className="text-sm text-muted-foreground">
                    Update your application settings
                </p>
            </div>
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Default Application Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            This is the default application type that will be
                            selected when creating a new application.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Default Due Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            This is the default due date that will be set when
                            creating a new application.
                        </p>
                    </CardContent>
                    <CardContent>
                        <Form>
                            <Label htmlFor="default_due_date">
                                Default Due Date
                            </Label>
                            <Input
                                id="default_due_date"
                                name="default_due_date"
                                type="number"
                                value={auth.user.default_due_date}
                            />
                        </Form>
                    </CardContent>
                    <CardContent>
                        <Button>Save Changes</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Default Priority</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            This is the default priority that will be set when
                            creating a new application.
                        </p>
                    </CardContent>
                    <CardContent>
                        <Form>
                            <Label htmlFor="default_priority">
                                Default Priority
                            </Label>
                            <Input
                                id="default_priority"
                                name="default_priority"
                                type="number"
                                value={auth.user.default_priority}
                            />
                        </Form>
                    </CardContent>
                    <CardContent>
                        <Button>Save Changes</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Default Board</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            This is the default board that will be selected when
                            creating a new application.
                        </p>
                    </CardContent>
                    <CardContent>
                        <Form>
                            <Label htmlFor="default_board">Default Board</Label>
                            <Input
                                id="default_board"
                                name="default_board"
                                type="text"
                                value={auth.user.default_board}
                            />
                        </Form>
                    </CardContent>
                    <CardContent>
                        <Button>Save Changes</Button>
                    </CardContent>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            You can change these settings at any time.
                        </p>
                    </CardContent>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            These settings only apply to you.
                        </p>
                    </CardContent>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Changes will apply to new applications only.
                        </p>
                    </CardContent>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            If you want to change the settings for existing
                            applications, you can do so by editing them
                            individually.
                        </p>
                    </CardContent>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            If you want to change the settings for existing
                            applications in bulk, you can use the{' '}
                            <span className="font-bold">Bulk Actions</span>{' '}
                            feature.
                        </p>
                    </CardContent>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            If you can&apos;t find the settings you&apos;re
                            looking for, please{' '}
                            <a
                                href="/contact"
                                className="font-bold text-blue-600"
                            >
                                contact us
                            </a>
                            .
                        </p>
                    </CardContent>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            We&apos;re always looking to improve, so if you have
                            any feedback, please let us know.
                        </p>
                    </CardContent>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Thank you for using our application!
                        </p>
                    </CardContent>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            - The Application Team
                        </p>
                    </CardContent>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            <span className="font-bold">Application</span> is a
                            product of{' '}
                            <span className="font-bold">Company</span>.
                        </p>
                    </CardContent>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            &copy; {new Date().getFullYear()} Company. All
                            rights reserved.
                        </p>
                    </CardContent>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Version 1.0.0
                        </p>
                    </CardContent>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            <a
                                href="/terms"
                                className="font-bold text-blue-600"
                            >
                                Terms of Service
                            </a>{' '}
                            and{' '}
                            <a
                                href="/privacy"
                                className="font-bold text-blue-600"
                            >
                                Privacy Policy
                            </a>
                        </p>
                    </CardContent>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            <a
                                href="/contact"
                                className="font-bold text-blue-600"
                            >
                                Contact Us
                            </a>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
