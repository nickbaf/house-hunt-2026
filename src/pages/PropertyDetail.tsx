import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Bed,
  Bath,
  Building2,
  MapPin,
  Phone,
  ExternalLink,
  Pencil,
  Trash2,
  Calendar,
  Ruler,
  Layers,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Sofa,
  Clock,
  Banknote,
  CalendarCheck,
} from "lucide-react";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import { useData } from "@/context/DataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { RatingStars } from "@/components/RatingStars";
import { CommentThread } from "@/components/CommentThread";
import { PropertyForm } from "@/components/PropertyForm";
import { ImageLightbox } from "@/components/ImageLightbox";
import { STATUS_HEX } from "@/lib/map-colors";
import { PROPERTY_STATUSES, STATUS_CONFIG, type PropertyStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { properties, updateProperty, deleteProperty, updateStatus, addComment, deleteComment } =
    useData();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAllImages, setShowAllImages] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const property = properties.find((p) => p.id === id);

  if (!property) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <p className="text-lg text-zinc-400">Property not found</p>
        <Link
          to="/"
          className="mt-4 text-sm text-emerald-400 hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <button
          onClick={() => setEditing(false)}
          className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel Edit
        </button>
        <h1 className="mb-6 text-2xl font-bold text-zinc-100">Edit Property</h1>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <PropertyForm
            initialData={property}
            onSubmit={async (data) => {
              await updateProperty(property.id, data);
              setEditing(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onCancel={() => setEditing(false)}
            submitLabel="Save Changes"
          />
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    setDeleting(true);
    await deleteProperty(property.id);
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{property.title}</h1>
          <div className="mt-2 flex items-center gap-1.5 text-zinc-400">
            <MapPin className="h-4 w-4 shrink-0" />
            {property.address}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      {property.images.length > 0 && (() => {
        const PREVIEW_COUNT = 8;
        const visibleImages = showAllImages
          ? property.images
          : property.images.slice(0, PREVIEW_COUNT);
        const hiddenCount = property.images.length - PREVIEW_COUNT;

        return (
          <div className="mb-6">
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {visibleImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className="overflow-hidden rounded-lg border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <img
                    src={img}
                    alt={`${property.title} - ${i + 1}`}
                    className="h-40 w-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </button>
              ))}
              {!showAllImages && hiddenCount > 0 && (
                <button
                  onClick={() => setShowAllImages(true)}
                  className="flex h-40 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
                >
                  <span className="text-center text-sm font-medium">
                    +{hiddenCount} more<br />photos
                  </span>
                </button>
              )}
            </div>
            {showAllImages && property.images.length > PREVIEW_COUNT && (
              <button
                onClick={() => setShowAllImages(false)}
                className="mt-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Show fewer photos
              </button>
            )}
          </div>
        );
      })()}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={[...property.images, ...(property.floorplans ?? [])]}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Price */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-sm text-zinc-500">Monthly Rent</p>
                <p className="text-3xl font-bold text-emerald-400">
                  {formatCurrency(property.rent)}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="mb-1.5 text-sm text-zinc-500">Status</p>
                <select
                  value={property.status}
                  onChange={(e) => updateStatus(property.id, e.target.value as PropertyStatus)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-emerald-500/50"
                >
                  {PROPERTY_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <InfoItem icon={Bed} label="Bedrooms" value={String(property.bedrooms)} />
              <InfoItem icon={Bath} label="Bathrooms" value={String(property.bathrooms)} />
              {property.floor !== null && (
                <InfoItem icon={Layers} label="Floor" value={String(property.floor)} />
              )}
              {property.sqft !== null && (
                <InfoItem icon={Ruler} label="Sq Ft" value={String(property.sqft)} />
              )}
            </div>
          </div>

          {/* Key Features */}
          {property.keyFeatures?.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Key Features
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {property.keyFeatures.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Floorplans */}
          {property.floorplans?.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Floorplans
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {property.floorplans.map((fp, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(property.images.length + i)}
                    className="overflow-hidden rounded-lg border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <img
                      src={fp}
                      alt={`Floorplan ${i + 1}`}
                      className="w-full rounded-lg object-contain bg-white/5 hover:scale-105 transition-transform duration-200"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Details
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {property.tower && (
                <DetailRow icon={Building2} label="Tower" value={property.tower} />
              )}
              {property.visitDate && (
                <DetailRow icon={Calendar} label="Visit Date" value={formatDate(property.visitDate)} />
              )}
              {property.agentName && (
                <DetailRow icon={Building2} label="Agent" value={property.agentName} />
              )}
              {property.agentPhone && (
                <DetailRow icon={Phone} label="Phone" value={property.agentPhone} />
              )}
            </div>
            {property.nearestStations?.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-2">
                  Nearest Stations
                </h3>
                {property.nearestStations.map((s, i) => (
                  <DetailRow key={i} icon={MapPin} label={s.name} value={s.distance} />
                ))}
              </>
            )}
            {property.url && (
              <a
                href={property.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                View Listing
              </a>
            )}
          </div>

          {/* Letting Details */}
          {(property.letAvailableDate || property.furnishType || property.minTenancy || property.deposit != null || property.letType) && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Letting Details
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {property.letAvailableDate && (
                  <DetailRow icon={CalendarCheck} label="Available" value={property.letAvailableDate} />
                )}
                {property.furnishType && (
                  <DetailRow icon={Sofa} label="Furnishing" value={property.furnishType} />
                )}
                {property.minTenancy != null && (
                  <DetailRow icon={Clock} label="Min. Tenancy" value={`${property.minTenancy} months`} />
                )}
                {property.deposit != null && (
                  <DetailRow icon={Banknote} label="Deposit" value={property.deposit === 0 ? "£0" : `£${property.deposit.toLocaleString()}`} />
                )}
                {property.letType && (
                  <DetailRow icon={Calendar} label="Let Type" value={property.letType} />
                )}
              </div>
            </div>
          )}

          {/* Pros & Cons */}
          {(property.pros.length > 0 || property.cons.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                    Pros
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {property.pros.map((pro, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {pro}
                    </div>
                  ))}
                  {property.pros.length === 0 && (
                    <p className="text-sm text-zinc-500 italic">None yet</p>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4 text-red-400" />
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                    Cons
                  </h3>
                </div>
                <div className="space-y-1.5">
                  {property.cons.map((con, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      {con}
                    </div>
                  ))}
                  {property.cons.length === 0 && (
                    <p className="text-sm text-zinc-500 italic">None yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (() => {
            const DESC_LIMIT = 300;
            const isLong = property.description.length > DESC_LIMIT;
            const displayText = !isLong || showFullDescription
              ? property.description
              : property.description.slice(0, DESC_LIMIT).trimEnd() + "...";

            return (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                  Description
                </h2>
                <p className="text-sm leading-relaxed text-zinc-400 whitespace-pre-line">
                  {displayText}
                </p>
                {isLong && (
                  <button
                    onClick={() => setShowFullDescription((v) => !v)}
                    className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {showFullDescription ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Comments */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <CommentThread
              comments={property.comments}
              onAdd={(text) => addComment(property.id, text)}
              onDelete={(commentId) => deleteComment(property.id, commentId)}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="mb-3 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Rating
            </h3>
            <RatingStars
              rating={property.rating}
              onChange={(r) => updateProperty(property.id, { rating: r || null })}
            />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="mb-3 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              Status
            </h3>
            <StatusBadge status={property.status} />
          </div>

          {property.latitude != null && property.longitude != null && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
              <div className="px-5 pt-4 pb-2">
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                  Location
                </h3>
              </div>
              <div className="h-48">
                <style>{`
                  .mini-map .leaflet-tile-pane {
                    filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9);
                  }
                  .mini-map .leaflet-control-zoom { display: none; }
                  .mini-map .leaflet-control-attribution { font-size: 8px; opacity: 0.5; }
                `}</style>
                <MapContainer
                  center={[property.latitude, property.longitude]}
                  zoom={15}
                  className="mini-map h-full w-full"
                  style={{ background: "#27272a" }}
                  zoomControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                  touchZoom={false}
                >
                  <TileLayer
                    attribution='&copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  />
                  <CircleMarker
                    center={[property.latitude, property.longitude]}
                    radius={8}
                    pathOptions={{
                      color: STATUS_HEX[property.status],
                      fillColor: STATUS_HEX[property.status],
                      fillOpacity: 0.7,
                      weight: 2,
                    }}
                  />
                </MapContainer>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-sm text-zinc-500">
            <p>Added by <span className="text-zinc-300">{property.addedBy}</span></p>
            <p>on {formatDate(property.addedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-zinc-500" />
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-sm font-medium text-zinc-200">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-zinc-500 shrink-0" />
      <div>
        <span className="text-xs text-zinc-500">{label}: </span>
        <span className="text-sm text-zinc-200">{value}</span>
      </div>
    </div>
  );
}
