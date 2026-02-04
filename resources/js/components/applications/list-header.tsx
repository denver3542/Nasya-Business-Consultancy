import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Column {
    key: string;
    label: string;
    width: string;
    sortable?: boolean;
}

interface ListHeaderProps {
    columns: Column[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSort?: (key: string) => void;
    allSelected?: boolean;
    someSelected?: boolean;
    onSelectAll?: (selected: boolean) => void;
}

export default function ListHeader({
    columns,
    sortBy,
    sortOrder = 'asc',
    onSort,
    allSelected = false,
    someSelected = false,
    onSelectAll,
}: ListHeaderProps) {
    const getSortIcon = (columnKey: string) => {
        if (sortBy !== columnKey) {
            return (
                <ArrowUpDown className="ml-1 size-3 opacity-0 group-hover:opacity-50" />
            );
        }
        return sortOrder === 'asc' ? (
            <ArrowUp className="ml-1 size-3" />
        ) : (
            <ArrowDown className="ml-1 size-3" />
        );
    };

    return (
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600">
            {/* Empty space for expand button */}
            <div className="w-6" />

            {/* Checkbox */}
            <Checkbox
                checked={allSelected}
                ref={(el) => {
                    if (el) {
                        el.indeterminate = someSelected && !allSelected;
                    }
                }}
                onCheckedChange={(checked) => {
                    onSelectAll?.(checked === true);
                }}
            />

            {/* Star column */}
            <div className="w-6" />

            {/* Dynamic columns */}
            {columns.map((column) => (
                <div
                    key={column.key}
                    className={cn(
                        'flex items-center',
                        column.width,
                        column.sortable && 'group cursor-pointer',
                    )}
                    onClick={() => column.sortable && onSort?.(column.key)}
                >
                    <span className="uppercase">{column.label}</span>
                    {column.sortable && getSortIcon(column.key)}
                </div>
            ))}

            {/* Actions column */}
            <div className="w-8" />
        </div>
    );
}
