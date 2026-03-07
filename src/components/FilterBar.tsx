import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { PROPERTY_STATUSES, STATUS_CONFIG, type PropertyStatus } from "@/types";
import { cn } from "@/lib/utils";

export type SortField = "addedAt" | "rent" | "rating";
export type SortDirection = "asc" | "desc";

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: PropertyStatus | "all";
  onStatusFilterChange: (value: PropertyStatus | "all") => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
}

export function FilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortField,
  sortDirection,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search properties..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as PropertyStatus | "all")}
            className="appearance-none rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-10 pr-8 text-sm text-zinc-100 outline-none transition-colors focus:border-emerald-500/50"
          >
            <option value="all">All statuses</option>
            {PROPERTY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_CONFIG[status].label}
              </option>
            ))}
          </select>
        </div>

        {(["addedAt", "rent", "rating"] as const).map((field) => (
          <button
            key={field}
            onClick={() => onSortChange(field)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors",
              sortField === field
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200",
            )}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {field === "addedAt" ? "Date" : field === "rent" ? "Price" : "Rating"}
            {sortField === field && (
              <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
