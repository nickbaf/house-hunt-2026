import { Link } from "react-router-dom";
import { Bed, Bath, Building2, MapPin, MessageSquare, Globe } from "lucide-react";
import type { Property } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { RatingStars } from "@/components/RatingStars";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function PropertyCard({ property, selected, onToggleSelect }: PropertyCardProps) {
  const isLetAgreed = property.status === "let_agreed";

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900",
        selected && "border-emerald-500/50 bg-emerald-500/5",
        isLetAgreed && "opacity-50",
      )}
    >
      {onToggleSelect && (
        <button
          onClick={() => onToggleSelect(property.id)}
          className={cn(
            "absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-md border transition-colors",
            selected
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-zinc-600 bg-zinc-800 text-zinc-400 hover:border-zinc-500",
          )}
        >
          {selected && (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}

      <Link to={`/property/${property.id}`} className="block">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className={cn(
              "truncate text-lg font-semibold transition-colors",
              isLetAgreed
                ? "text-zinc-500 line-through"
                : "text-zinc-100 group-hover:text-emerald-400",
            )}>
              {property.title}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{property.address}</span>
            </div>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <StatusBadge status={property.status} />
          {property.source === "rightmove" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-400/10 px-2 py-0.5 text-xs text-sky-400">
              <Globe className="h-3 w-3" />
              Rightmove
            </span>
          )}
          {property.rating !== null && property.rating > 0 && (
            <RatingStars rating={property.rating} size="sm" />
          )}
        </div>

        <div className="mb-4 flex items-center gap-4 text-sm text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Bed className="h-4 w-4" />
            {property.bedrooms} bed
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="h-4 w-4" />
            {property.bathrooms} bath
          </span>
          {property.tower && (
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {property.tower}
            </span>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className={cn(
              "text-2xl font-bold",
              isLetAgreed ? "text-zinc-500" : "text-emerald-400",
            )}>
              {formatCurrency(property.rent)}
            </span>
            <span className="text-sm text-zinc-500"> /mo</span>
          </div>
          {property.comments.length > 0 && (
            <span className="flex items-center gap-1 text-sm text-zinc-500">
              <MessageSquare className="h-3.5 w-3.5" />
              {property.comments.length}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
