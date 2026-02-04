import { router } from '@inertiajs/react';
import {
    Filter,
    Plus,
    Search,
    SortAsc,
    Star,
    Grid3x3,
    List,
    Calendar as CalendarIcon,
    Table,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { FilterOptions, Stats } from '@/types/application';

interface BoardToolbarProps {
    stats: Stats;
    filters: FilterOptions;
    activeFilters: {
        search?: string;
        priority?: number;
        type?: number;
        starred?: boolean;
    };
    onFilterChange: (filters: any) => void;
    currentView: 'list' | 'board' | 'calendar' | 'table';
}

export default function BoardToolbar({
    stats,
    filters,
    activeFilters,
    onFilterChange,
    currentView,
}: BoardToolbarProps) {
    const [search, setSearch] = useState(activeFilters.search || '');
    const [localFilters, setLocalFilters] = useState(activeFilters);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onFilterChange({ ...localFilters, search });
    };

    const handleViewChange = (view: string) => {
        router.get(
            `/client/applications?view=${view}`,
            {},
            { preserveState: true },
        );
    };

    const activeFilterCount = Object.values(localFilters).filter(
        (v) => v !== undefined && v !== '',
    ).length;

    return (
        <div className="border-b bg-white">
            {/* Stats Bar */}
            <div className="flex items-center gap-4 border-b px-6 py-3">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{stats.total}</span>
                    <span className="text-muted-foreground">Total</span>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-yellow-600">
                        {stats.pending}
                    </span>
                    <span className="text-muted-foreground">Pending</span>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-red-600">
                        {stats.overdue}
                    </span>
                    <span className="text-muted-foreground">Overdue</span>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-blue-600">
                        {stats.due_today}
                    </span>
                    <span className="text-muted-foreground">Due Today</span>
                </div>
                {stats.starred > 0 && (
                    <>
                        <div className="h-4 w-px bg-gray-200" />
                        <div className="flex items-center gap-2 text-sm">
                            <Star className="size-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{stats.starred}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Main Toolbar */}
            <div className="flex items-center justify-between px-6 py-3">
                {/* Left Side */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search applications..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-[300px] pl-9"
                        />
                    </form>

                    {/* Filters */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Filter className="mr-2 size-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="mb-3 font-medium">
                                        Filter Applications
                                    </h4>
                                </div>

                                {/* Priority Filter */}
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select
                                        value={localFilters.priority?.toString()}
                                        onValueChange={(value) => {
                                            const newFilters = {
                                                ...localFilters,
                                                priority: value
                                                    ? parseInt(value)
                                                    : undefined,
                                            };
                                            setLocalFilters(newFilters);
                                            onFilterChange(newFilters);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All priorities" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All priorities
                                            </SelectItem>
                                            {filters.priorities.map((p) => (
                                                <SelectItem
                                                    key={p.value}
                                                    value={p.value.toString()}
                                                >
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Type Filter */}
                                <div className="space-y-2">
                                    <Label>Application Type</Label>
                                    <Select
                                        value={localFilters.type?.toString()}
                                        onValueChange={(value) => {
                                            const newFilters = {
                                                ...localFilters,
                                                type: value
                                                    ? parseInt(value)
                                                    : undefined,
                                            };
                                            setLocalFilters(newFilters);
                                            onFilterChange(newFilters);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All types
                                            </SelectItem>
                                            {filters.types.map((type) => (
                                                <SelectItem
                                                    key={type.id}
                                                    value={type.id.toString()}
                                                >
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Starred Only */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="starred"
                                        checked={localFilters.starred}
                                        onCheckedChange={(checked) => {
                                            const newFilters = {
                                                ...localFilters,
                                                starred: checked === true,
                                            };
                                            setLocalFilters(newFilters);
                                            onFilterChange(newFilters);
                                        }}
                                    />
                                    <Label
                                        htmlFor="starred"
                                        className="cursor-pointer"
                                    >
                                        Starred only
                                    </Label>
                                </div>

                                {/* Clear Filters */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                        setLocalFilters({});
                                        setSearch('');
                                        onFilterChange({});
                                    }}
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* View Switcher */}
                    <div className="flex items-center rounded-lg border">
                        <Button
                            variant={
                                currentView === 'list' ? 'secondary' : 'ghost'
                            }
                            size="sm"
                            onClick={() => handleViewChange('list')}
                            className="rounded-r-none"
                        >
                            <List className="size-4" />
                        </Button>
                        <Button
                            variant={
                                currentView === 'board' ? 'secondary' : 'ghost'
                            }
                            size="sm"
                            onClick={() => handleViewChange('board')}
                            className="rounded-none border-x"
                        >
                            <Grid3x3 className="size-4" />
                        </Button>
                        <Button
                            variant={
                                currentView === 'calendar'
                                    ? 'secondary'
                                    : 'ghost'
                            }
                            size="sm"
                            onClick={() => handleViewChange('calendar')}
                            className="rounded-none"
                        >
                            <CalendarIcon className="size-4" />
                        </Button>
                        <Button
                            variant={
                                currentView === 'table' ? 'secondary' : 'ghost'
                            }
                            size="sm"
                            onClick={() => handleViewChange('table')}
                            className="rounded-l-none border-l"
                        >
                            <Table className="size-4" />
                        </Button>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() =>
                            router.get('/client/applications/create')
                        }
                    >
                        <Plus className="mr-2 size-4" />
                        New Application
                    </Button>
                </div>
            </div>
        </div>
    );
}
