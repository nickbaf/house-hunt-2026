import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCw, Loader2, Building2, Sparkles, Calendar, MapPin } from "lucide-react";
import { useData } from "@/context/DataContext";
import { PropertyCard } from "@/components/PropertyCard";
import { FilterBar, type SortField, type SortDirection } from "@/components/FilterBar";
import { getAvailableUsernames } from "@/auth/decrypt";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import type { PropertyStatus, PropertySource } from "@/types";

export function Dashboard() {
  const { properties, isLoading, error, refresh } = useData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<PropertySource | "all">("all");
  const [approvedFilter, setApprovedFilter] = useState(false);
  const [sortField, setSortField] = useState<SortField>("addedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [refreshing, setRefreshing] = useState(false);
  const totalHumanUsers = getAvailableUsernames().length;

  const newCount = useMemo(
    () => properties.filter((p) => p.status === "new").length,
    [properties],
  );

  const upcomingViewings = useMemo(() => {
    const now = new Date();
    return properties
      .filter(
        (p) =>
          p.status === "viewing_scheduled" &&
          p.visitDate &&
          new Date(p.visitDate) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      )
      .sort(
        (a, b) =>
          new Date(a.visitDate!).getTime() - new Date(b.visitDate!).getTime(),
      );
  }, [properties]);

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    let result = [...properties];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.tower.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (sourceFilter !== "all") {
      result = result.filter((p) => p.source === sourceFilter);
    }

    if (approvedFilter) {
      result = result.filter(
        (p) => (p.approvals ?? []).length >= totalHumanUsers && totalHumanUsers > 0,
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "addedAt":
          cmp = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          break;
        case "rent":
          cmp = a.rent - b.rent;
          break;
        case "rating":
          cmp = (a.rating ?? 0) - (b.rating ?? 0);
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [properties, search, statusFilter, sourceFilter, approvedFilter, totalHumanUsers, sortField, sortDirection]);

  if (isLoading && properties.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Properties</h1>
          <p className="text-sm text-zinc-400">
            {properties.length} {properties.length === 1 ? "property" : "properties"} tracked
            {newCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-yellow-400/15 px-2 py-0.5 text-xs font-medium text-yellow-400">
                <Sparkles className="h-3 w-3" />
                {newCount} new
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            to="/add"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Add Property
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mb-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          approvedFilter={approvedFilter}
          onApprovedFilterChange={setApprovedFilter}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
      </div>

      {upcomingViewings.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
              Upcoming Viewings
            </h2>
            <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-400">
              {upcomingViewings.length}
            </span>
          </div>
          <div className="space-y-2">
            {upcomingViewings.map((p) => (
              <Link
                key={p.id}
                to={`/property/${p.id}`}
                className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/70 px-4 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-amber-400">
                    {formatDateTime(p.visitDate!)}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">{p.title}</p>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{p.address}</span>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-emerald-400">
                  {formatCurrency(p.rent)}
                  <span className="text-xs font-normal text-zinc-500"> pcm</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="mb-4 h-12 w-12 text-zinc-700" />
          <h2 className="text-lg font-semibold text-zinc-300">
            {properties.length === 0 ? "No properties yet" : "No matches"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {properties.length === 0
              ? "Start by adding your first Canary Wharf property!"
              : "Try adjusting your filters."}
          </p>
          {properties.length === 0 && (
            <Link
              to="/add"
              className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" />
              Add Property
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
