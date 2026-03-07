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
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { RatingStars } from "@/components/RatingStars";
import { CommentThread } from "@/components/CommentThread";
import { PropertyForm } from "@/components/PropertyForm";
import { PROPERTY_STATUSES, STATUS_CONFIG, type PropertyStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { properties, updateProperty, deleteProperty, updateStatus, addComment, deleteComment } =
    useData();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      {property.images.length > 0 && (
        <div className="mb-6 grid gap-2 grid-cols-2 sm:grid-cols-3">
          {property.images.map((img, i) => (
            <a key={i} href={img} target="_blank" rel="noopener noreferrer">
              <img
                src={img}
                alt={`${property.title} - ${i + 1}`}
                className="h-40 w-full rounded-lg border border-zinc-800 object-cover hover:opacity-80 transition-opacity"
              />
            </a>
          ))}
        </div>
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
