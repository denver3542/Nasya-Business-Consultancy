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
import type { UserBoard } from '@/types/application';

interface BoardsIndexProps {
    boards: UserBoard[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Boards', href: '/client/boards' },
];

export default function Index({ boards }: BoardsIndexProps) {
    const [deleteBoard, setDeleteBoard] = useState<UserBoard | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const starredBoards = boards.filter((board) => board.is_starred);
    const regularBoards = boards.filter((board) => !board.is_starred);

    const handleDelete = () => {
        if (!deleteBoard) return;

        setIsDeleting(true);
        router.delete(`/client/boards/${deleteBoard.id}`, {
            onSuccess: () => {
                setDeleteBoard(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const handleToggleStar = (board: UserBoard) => {
        router.post(
            `/client/boards/${board.id}/toggle-star`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const BoardCard = ({ board }: { board: UserBoard }) => (
        <Card
            className="group cursor-pointer transition-all hover:shadow-md"
            style={{ borderTopColor: board.color, borderTopWidth: '3px' }}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <Link
                        href={`/client/boards/${board.id}`}
                        className="flex-1"
                    >
                        <CardTitle className="text-lg">{board.name}</CardTitle>
                    </Link>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={(e) => {
                                e.preventDefault();
                                handleToggleStar(board);
                            }}
                        >
                            <Star
                                className={cn(
                                    'size-4',
                                    board.is_starred
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
                                        href={`/client/boards/${board.id}/edit`}
                                    >
                                        <Pencil className="mr-2 size-4" />
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setDeleteBoard(board)}
                                >
                                    <Trash className="mr-2 size-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                {board.description && (
                    <CardDescription className="line-clamp-2">
                        {board.description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <Link href={`/client/boards/${board.id}`}>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant="secondary">
                            <Layout className="mr-1 size-3" />
                            {board.lists_count || 0} lists
                        </Badge>
                        <Badge variant="secondary">
                            {board.applications_count || 0} applications
                        </Badge>
                    </div>
                </Link>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Boards" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Boards</h1>
                        <p className="text-sm text-muted-foreground">
                            Organize your applications with Trello-style boards
                        </p>
                    </div>
                    <Link href="/client/boards/create">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Create Board
                        </Button>
                    </Link>
                </div>

                {/* Starred Boards */}
                {starredBoards.length > 0 && (
                    <div>
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <Star className="size-5 fill-yellow-400 text-yellow-400" />
                            Starred Boards
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {starredBoards.map((board) => (
                                <BoardCard key={board.id} board={board} />
                            ))}
                        </div>
                    </div>
                )}

                {/* All Boards */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold">
                        {starredBoards.length > 0
                            ? 'Other Boards'
                            : 'All Boards'}
                    </h2>
                    {regularBoards.length === 0 &&
                    starredBoards.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center py-12">
                            <Layout className="mb-4 size-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold">
                                No boards yet
                            </h3>
                            <p className="mb-4 text-sm text-muted-foreground">
                                Create your first board to start organizing
                                applications
                            </p>
                            <Link href="/client/boards/create">
                                <Button>
                                    <Plus className="mr-2 size-4" />
                                    Create Board
                                </Button>
                            </Link>
                        </Card>
                    ) : regularBoards.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            All your boards are starred!
                        </p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {regularBoards.map((board) => (
                                <BoardCard key={board.id} board={board} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!deleteBoard}
                onOpenChange={() => setDeleteBoard(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Board</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteBoard?.name}
                            "? Applications on this board will be removed from
                            the board but not deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteBoard(null)}
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
