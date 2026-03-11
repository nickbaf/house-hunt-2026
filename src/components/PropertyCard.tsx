import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bed,
  Bath,
  Building2,
  MapPin,
  MessageSquare,
  Globe,
  Ruler,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Layers,
  ThumbsUp,
} from "lucide-react";
import type { Property } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { RatingStars } from "@/components/RatingStars";
import { getAvailableUsernames } from "@/auth/decrypt";
import { formatCurrency, cn } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function PropertyCard({ property, selected, onToggleSelect }: PropertyCardProps) {
  const humanUsers = getAvailableUsernames();
  const isLetAgreed = property.status === "let_agreed";
  const approvalCount = (property.approvals ?? []).length;
  const allApproved = humanUsers.length > 0 && approvalCount >= humanUsers.length;
  const [imgIdx, setImgIdx] = useState(0);
  const images = property.images ?? [];
  const hasImages = images.length > 0;

  const prevImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIdx((i) => (i - 1 + images.length) % images.length);
  };

  const nextImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIdx((i) => (i + 1) % images.length);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all hover:border-zinc-700 hover:bg-zinc-900",
        selected && "border-emerald-500/50 bg-emerald-500/5",
        isLetAgreed && "opacity-50",
      )}
    >
      {onToggleSelect && (
        <button
          onClick={() => onToggleSelect(property.id)}
          className={cn(
            "absolute top-3 right-3 z-20 flex h-6 w-6 items-center justify-center rounded-md border transition-colors",
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

      {/* Image section */}
      <div className="relative aspect-[16/10] w-full bg-zinc-800">
        {hasImages ? (
          <>
            <img
              src={images[imgIdx]}
              alt={property.title}
              className="h-full w-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImg}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextImg}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
                  {imgIdx + 1}/{images.length}
                </span>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-10 w-10 text-zinc-700" />
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 drop-shadow-md">
          <StatusBadge status={property.status} className="!bg-zinc-950/75 backdrop-blur-sm shadow-sm" />
          {property.source === "rightmove" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950/75 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-sky-400 shadow-sm">
              <Globe className="h-3 w-3" />
              Rightmove
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <Link to={`/property/${property.id}`} className="flex flex-1 flex-col p-4">
        {/* Price row */}
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className={cn(
              "text-xl font-bold",
              isLetAgreed ? "text-zinc-500" : "text-emerald-400",
            )}>
              {formatCurrency(property.rent)}
            </span>
            <span className="text-sm text-zinc-500"> pcm</span>
          </div>
          {property.rating !== null && property.rating > 0 && (
            <RatingStars rating={property.rating} size="sm" />
          )}
        </div>

        {/* Title */}
        <h3 className={cn(
          "text-sm font-semibold leading-snug transition-colors",
          isLetAgreed
            ? "text-zinc-500 line-through"
            : "text-zinc-100 group-hover:text-emerald-400",
        )}>
          {property.title}
        </h3>

        {/* Address */}
        <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{property.address}</span>
        </div>

        {/* Property specs */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" />
            {property.bedrooms} bed
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            {property.bathrooms} bath
          </span>
          {property.sqft != null && (
            <span className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" />
              {property.sqft} sqft
            </span>
          )}
          {property.floor != null && (
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              Floor {property.floor}
            </span>
          )}
          {property.tower && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {property.tower}
            </span>
          )}
        </div>

        {/* Key features preview */}
        {property.keyFeatures?.length > 0 && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">
            {property.keyFeatures.slice(0, 3).join(" | ")}
          </p>
        )}

        {/* Footer: agent + comments */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-zinc-800/60">
          {property.agentName ? (
            <span className="truncate text-xs text-zinc-500">
              {property.agentName}
            </span>
          ) : (
            <span />
          )}
          <div className="flex shrink-0 items-center gap-3">
            <span className={cn(
              "flex items-center gap-1 text-xs",
              allApproved ? "text-emerald-400" : "text-zinc-500",
            )}>
              <ThumbsUp className={cn("h-3 w-3", allApproved && "fill-emerald-400")} />
              {approvalCount}/{humanUsers.length}
            </span>
            {property.comments.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <MessageSquare className="h-3 w-3" />
                {property.comments.length}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
