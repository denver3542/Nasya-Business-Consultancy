import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
    LayoutGrid,
    List,
    Plus,
    Star,
    Settings,
    Trash2,
    ExternalLink,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import type { Application, ServiceStage, UserService } from '@/types/application';
import ServiceStageColumn from '@/components/services/service-stage-column';
import ApplicationCard from '@/components/applications/application-card';

interface ServiceShowProps {
    service: UserService & { stages: ServiceStage[] };
    availableApplications: Application[];
}

type ViewType = 'board' | 'list';

export default function Show({
    service: initialService,
    availableApplications,
}: ServiceShowProps) {
    const [service, setService] = useState(initialService);
    const [activeApplication, setActiveApplication] =
        useState<Application | null>(null);
    const [showAddStage, setShowAddStage] = useState(false);
    const [showAddApplication, setShowAddApplication] = useState(false);
    const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
    const [viewType, setViewType] = useState<ViewType>(() => {
        if (typeof window !== 'undefined') {
            return (
                (localStorage.getItem('serviceViewType') as ViewType) || 'board'
            );
        }
        return 'board';
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Services', href: '/client/services' },
        { title: service.name, href: `/client/services/${service.id}` },
    ];

    const allApplications = useMemo(() => {
        return (
            service.stages?.flatMap((stage) =>
                (stage.applications || []).map((app) => ({
                    ...app,
                    stageName: stage.name,
                    stageColor: stage.color,
                })),
            ) || []
        );
    }, [service.stages]);

    const handleViewChange = (value: string) => {
        if (value === 'board' || value === 'list') {
            setViewType(value);
            localStorage.setItem('serviceViewType', value);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
    );

    useEffect(() => {
        setService(initialService);
    }, [initialService]);

    const findStageByApplicationId = (appId: string): ServiceStage | undefined => {
        return service.stages?.find((stage) =>
            stage.applications?.some((app) => app.id.toString() === appId),
        );
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const activeStage = findStageByApplicationId(active.id.toString());
        if (activeStage) {
            const app = activeStage.applications?.find(
                (a) => a.id.toString() === active.id.toString(),
            );
            if (app) setActiveApplication(app);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();

        const activeStage = findStageByApplicationId(activeId);
        const overStage =
            findStageByApplicationId(overId) ||
            service.stages?.find((s) => s.id.toString() === overId);

        if (!activeStage || !overStage || activeStage.id === overStage.id) return;

        setService((prev) => {
            const newStages = prev.stages?.map((stage) => {
                if (stage.id === activeStage.id) {
                    return {
                        ...stage,
                        applications: stage.applications?.filter(
                            (app) => app.id.toString() !== activeId,
                        ),
                    };
                }
                if (stage.id === overStage.id) {
                    const movedApp = activeStage.applications?.find(
                        (app) => app.id.toString() === activeId,
                    );
                    if (movedApp) {
                        const newApps = [...(stage.applications || [])];
                        const overIndex = newApps.findIndex(
                            (app) => app.id.toString() === overId,
                        );
                        newApps.splice(
                            overIndex >= 0 ? overIndex : newApps.length,
                            0,
                            movedApp,
                        );
                        return { ...stage, applications: newApps };
                    }
                }
                return stage;
            });
            return { ...prev, stages: newStages };
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveApplication(null);
        if (!over) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();

        const activeStage = findStageByApplicationId(activeId);
        const overStage =
            findStageByApplicationId(overId) ||
            service.stages?.find((s) => s.id.toString() === overId);

        if (!activeStage || !overStage) return;

        const activeIndex =
            activeStage.applications?.findIndex(
                (app) => app.id.toString() === activeId,
            ) ?? -1;
        const overIndex =
            overStage.applications?.findIndex(
                (app) => app.id.toString() === overId,
            ) ?? -1;

        if (activeStage.id === overStage.id && activeIndex !== overIndex) {
            setService((prev) => ({
                ...prev,
                stages: prev.stages?.map((stage) =>
                    stage.id === activeStage.id
                        ? {
                              ...stage,
                              applications: arrayMove(
                                  stage.applications || [],
                                  activeIndex,
                                  overIndex,
                              ),
                          }
                        : stage,
                ),
            }));
        }

        router.post(
            `/client/services/${service.id}/move-application`,
            {
                application_id: parseInt(activeId),
                stage_id: overStage.id,
                position: overIndex >= 0 ? overIndex : 0,
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    const handleToggleStar = () => {
        router.post(
            `/client/services/${service.id}/toggle-star`,
            {},
            { preserveScroll: true },
        );
    };

    const handleRemoveApplication = (applicationId: number) => {
        router.post(
            `/client/services/${service.id}/remove-application`,
            { application_id: applicationId },
            { preserveScroll: true },
        );
    };

    const AddStageForm = () => {
        const { data, setData, post, processing, reset } = useForm({
            name: '',
            color: '#6b7280',
        });

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            post(`/client/services/${service.id}/stages`, {
                onSuccess: () => {
                    reset();
                    setShowAddStage(false);
                },
            });
        };

        return (
            <Dialog open={showAddStage} onOpenChange={setShowAddStage}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Stage</DialogTitle>
                        <DialogDescription>
                            Create a new stage for this service
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="stage-name">Stage Name</Label>
                                <Input
                                    id="stage-name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Enter stage name"
                                />
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAddStage(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || !data.name}
                            >
                                {processing ? 'Creating...' : 'Create Stage'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        );
    };

    const AddApplicationForm = () => {
        const [selectedAppId, setSelectedAppId] = useState<string>('');

        const handleSubmit = () => {
            if (!selectedAppId || !selectedStageId) return;
            router.post(
                `/client/services/${service.id}/add-application`,
                {
                    application_id: parseInt(selectedAppId),
                    stage_id: selectedStageId,
                },
                {
                    onSuccess: () => {
                        setSelectedAppId('');
                        setShowAddApplication(false);
                        setSelectedStageId(null);
                    },
                },
            );
        };

        return (
            <Dialog
                open={showAddApplication}
                onOpenChange={setShowAddApplication}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Application to Stage</DialogTitle>
                        <DialogDescription>
                            Select an application to add to this stage
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Application</Label>
                            <Select
                                value={selectedAppId}
                                onValueChange={setSelectedAppId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an application" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableApplications.length === 0 ? (
                                        <SelectItem value="none" disabled>
                                            No applications available
                                        </SelectItem>
                                    ) : (
                                        availableApplications.map((app) => (
                                            <SelectItem
                                                key={app.id}
                                                value={app.id.toString()}
                                            >
                                                {app.application_number} -{' '}
                                                {app.application_type?.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowAddApplication(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!selectedAppId}
                        >
                            Add Application
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={service.name} />

            <div className="flex h-full flex-col">
                {/* Service Header */}
                <div className="flex items-center justify-between border-b bg-background p-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="size-3 rounded"
                            style={{ backgroundColor: service.color }}
                        />
                        <h1 className="text-xl font-bold">{service.name}</h1>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={handleToggleStar}
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
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View Toggle */}
                        <ToggleGroup
                            type="single"
                            value={viewType}
                            onValueChange={handleViewChange}
                            className="rounded-md border"
                        >
                            <ToggleGroupItem
                                value="board"
                                aria-label="Board view"
                                className="px-3"
                            >
                                <LayoutGrid className="size-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="list"
                                aria-label="List view"
                                className="px-3"
                            >
                                <List className="size-4" />
                            </ToggleGroupItem>
                        </ToggleGroup>

                        {viewType === 'board' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAddStage(true)}
                            >
                                <Plus className="mr-2 size-4" />
                                Add Stage
                            </Button>
                        )}
                        <Link href={`/client/services/${service.id}/edit`}>
                            <Button variant="ghost" size="sm">
                                <Settings className="size-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Content - Board or List View */}
                {viewType === 'board' ? (
                    <div className="flex-1 overflow-x-auto bg-muted/30 p-6">
                        <DndContext
                            sensors={sensors}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="flex h-full gap-4">
                                {service.stages?.map((stage) => (
                                    <ServiceStageColumn
                                        key={stage.id}
                                        stage={stage}
                                        serviceId={service.id}
                                        onAddApplication={() => {
                                            setSelectedStageId(stage.id);
                                            setShowAddApplication(true);
                                        }}
                                        onRemoveApplication={
                                            handleRemoveApplication
                                        }
                                    />
                                ))}

                                {/* Add Stage Button */}
                                <div className="flex min-w-75 shrink-0 items-start">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start gap-2 bg-background/50"
                                        onClick={() => setShowAddStage(true)}
                                    >
                                        <Plus className="size-4" />
                                        Add another stage
                                    </Button>
                                </div>
                            </div>

                            <DragOverlay>
                                {activeApplication ? (
                                    <ApplicationCard
                                        application={activeApplication}
                                        isDragging
                                    />
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto bg-background p-6">
                        <div className="rounded-lg border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Application #</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Stage</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allApplications.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="py-8 text-center text-muted-foreground"
                                            >
                                                No applications in this service
                                                yet. Add applications to stages
                                                in board view.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        allApplications.map((app) => (
                                            <TableRow
                                                key={app.id}
                                                className="group"
                                            >
                                                <TableCell className="font-medium">
                                                    {app.application_number}
                                                </TableCell>
                                                <TableCell>
                                                    {app.application_type
                                                        ?.name || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                        style={{
                                                            borderColor:
                                                                app.stageColor ||
                                                                undefined,
                                                            backgroundColor:
                                                                app.stageColor
                                                                    ? `${app.stageColor}20`
                                                                    : undefined,
                                                        }}
                                                    >
                                                        {app.stageName}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs"
                                                        style={{
                                                            backgroundColor:
                                                                app.status
                                                                    ?.color ||
                                                                undefined,
                                                            color: app.status
                                                                ?.color
                                                                ? '#fff'
                                                                : undefined,
                                                        }}
                                                    >
                                                        {app.status?.name ||
                                                            'Unknown'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {app.due_date
                                                        ? new Date(
                                                              app.due_date,
                                                          ).toLocaleDateString()
                                                        : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                        <Link
                                                            href={`/client/applications/${app.id}`}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="size-8 p-0"
                                                            >
                                                                <ExternalLink className="size-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="size-8 p-0 text-destructive hover:text-destructive"
                                                            onClick={() =>
                                                                handleRemoveApplication(
                                                                    app.id,
                                                                )
                                                            }
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
                    </div>
                )}
            </div>

            <AddStageForm />
            <AddApplicationForm />
        </AppLayout>
    );
}
