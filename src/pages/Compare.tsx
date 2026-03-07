import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, GitCompareArrows, X } from "lucide-react";
import { useData } from "@/context/DataContext";
import { PropertyCard } from "@/components/PropertyCard";
import { StatusBadge } from "@/components/StatusBadge";
import { RatingStars } from "@/components/RatingStars";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Compare() {
  const { properties } = useData();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  };

  const selected = properties.filter((p) => selectedIds.has(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
          <GitCompareArrows className="h-6 w-6 text-emerald-400" />
          Compare Properties
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Select up to 3 properties to compare side by side
        </p>
      </div>

      {selected.length >= 2 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-200">
              Comparison ({selected.length})
            </h2>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Clear selection
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-zinc-800 p-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider w-36">
                    &nbsp;
                  </th>
                  {selected.map((p) => (
                    <th
                      key={p.id}
                      className="border-b border-zinc-800 p-3 text-left min-w-[200px]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/property/${p.id}`}
                          className="text-sm font-semibold text-zinc-100 hover:text-emerald-400"
                        >
                          {p.title}
                        </Link>
                        <button
                          onClick={() => toggleSelect(p.id)}
                          className="text-zinc-500 hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="Rent" values={selected.map((p) => formatCurrency(p.rent))} highlight="lowest" rawValues={selected.map((p) => p.rent)} />
                <CompareRow label="Status" custom={selected.map((p) => <StatusBadge key={p.id} status={p.status} />)} />
                <CompareRow label="Rating" custom={selected.map((p) => <RatingStars key={p.id} rating={p.rating} size="sm" />)} />
                <CompareRow label="Bedrooms" values={selected.map((p) => String(p.bedrooms))} />
                <CompareRow label="Bathrooms" values={selected.map((p) => String(p.bathrooms))} />
                <CompareRow label="Tower" values={selected.map((p) => p.tower || "-")} />
                <CompareRow label="Floor" values={selected.map((p) => p.floor !== null ? String(p.floor) : "-")} />
                <CompareRow label="Sq Ft" values={selected.map((p) => p.sqft !== null ? String(p.sqft) : "-")} />
                <CompareRow label="Agent" values={selected.map((p) => p.agentName || "-")} />
                <CompareRow
                  label="Pros"
                  custom={selected.map((p) => (
                    <div key={p.id} className="space-y-1">
                      {p.pros.length > 0
                        ? p.pros.map((pro, i) => (
                            <span key={i} className="mr-1 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">
                              {pro}
                            </span>
                          ))
                        : <span className="text-zinc-600">-</span>}
                    </div>
                  ))}
                />
                <CompareRow
                  label="Cons"
                  custom={selected.map((p) => (
                    <div key={p.id} className="space-y-1">
                      {p.cons.length > 0
                        ? p.cons.map((con, i) => (
                            <span key={i} className="mr-1 inline-block rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-400">
                              {con}
                            </span>
                          ))
                        : <span className="text-zinc-600">-</span>}
                    </div>
                  ))}
                />
                <CompareRow label="Comments" values={selected.map((p) => String(p.comments.length))} />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Property Selection Grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-200">
          {selected.length < 2 ? "Select properties to compare" : "All Properties"}
        </h2>
        {properties.length === 0 ? (
          <p className="text-sm text-zinc-500">No properties to compare yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                selected={selectedIds.has(p.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CompareRow({
  label,
  values,
  custom,
  highlight,
  rawValues,
}: {
  label: string;
  values?: string[];
  custom?: React.ReactNode[];
  highlight?: "lowest" | "highest";
  rawValues?: number[];
}) {
  const bestIndex =
    highlight && rawValues
      ? rawValues.indexOf(
          highlight === "lowest" ? Math.min(...rawValues) : Math.max(...rawValues),
        )
      : -1;

  return (
    <tr>
      <td className="border-b border-zinc-800/50 p-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {label}
      </td>
      {custom
        ? custom.map((node, i) => (
            <td key={i} className="border-b border-zinc-800/50 p-3">
              {node}
            </td>
          ))
        : values?.map((val, i) => (
            <td
              key={i}
              className={cn(
                "border-b border-zinc-800/50 p-3 text-sm",
                i === bestIndex ? "font-semibold text-emerald-400" : "text-zinc-300",
              )}
            >
              {val}
            </td>
          ))}
    </tr>
  );
}
