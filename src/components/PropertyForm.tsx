import { useState } from "react";
import { Plus, X, Loader2, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { PROPERTY_STATUSES, STATUS_CONFIG, type Property, type PropertyStatus } from "@/types";
import { cn } from "@/lib/utils";

type PropertyFormData = Omit<Property, "id" | "addedBy" | "addedAt" | "comments" | "approvals" | "rightmoveId" | "source" | "lastSeen" | "floorplans" | "keyFeatures" | "nearestStations" | "description" | "letAvailableDate" | "deposit" | "minTenancy" | "letType" | "furnishType">;

interface PropertyFormProps {
  initialData?: Property;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}

const emptyForm: PropertyFormData = {
  title: "",
  address: "",
  tower: "",
  rent: 0,
  bedrooms: 2,
  bathrooms: 2,
  sqft: null,
  floor: null,
  url: "",
  images: [],
  agentName: "",
  agentPhone: "",
  status: "interested",
  rating: null,
  pros: [],
  cons: [],
  visitDate: null,
  latitude: null,
  longitude: null,
};

export function PropertyForm({ initialData, onSubmit, onCancel, submitLabel }: PropertyFormProps) {
  const [form, setForm] = useState<PropertyFormData>(
    initialData
      ? {
          title: initialData.title,
          address: initialData.address,
          tower: initialData.tower,
          rent: initialData.rent,
          bedrooms: initialData.bedrooms,
          bathrooms: initialData.bathrooms,
          sqft: initialData.sqft,
          floor: initialData.floor,
          url: initialData.url,
          images: initialData.images,
          agentName: initialData.agentName,
          agentPhone: initialData.agentPhone,
          status: initialData.status,
          rating: initialData.rating,
          pros: initialData.pros,
          cons: initialData.cons,
          visitDate: initialData.visitDate,
          latitude: initialData.latitude,
          longitude: initialData.longitude,
        }
      : emptyForm,
  );
  const [newPro, setNewPro] = useState("");
  const [newCon, setNewCon] = useState("");
  const [newImage, setNewImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showLocation, setShowLocation] = useState(
    initialData?.latitude != null,
  );
  const [geocoding, setGeocoding] = useState(false);

  const geocodeAddress = async () => {
    if (!form.address.trim()) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
          q: form.address,
          format: "json",
          limit: "1",
        })}`,
        { headers: { "User-Agent": "HouseHunt2026/1.0" } },
      );
      const data = await res.json();
      if (data.length > 0) {
        setForm((f) => ({
          ...f,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        }));
      }
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  const addChip = (field: "pros" | "cons", value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    setForm((f) => ({ ...f, [field]: [...f[field], value.trim()] }));
    setter("");
  };

  const removeChip = (field: "pros" | "cons", index: number) => {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }));
  };

  const addImage = () => {
    if (!newImage.trim()) return;
    setForm((f) => ({ ...f, images: [...f.images, newImage.trim()] }));
    setNewImage("");
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25";

  const labelClass = "block text-sm font-medium text-zinc-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Pan Peninsula - 25th Floor 2 Bed"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Address *</label>
          <input
            type="text"
            required
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="e.g. 1 Pan Peninsula Square, E14 9HA"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Tower / Building</label>
          <input
            type="text"
            value={form.tower}
            onChange={(e) => setForm((f) => ({ ...f, tower: e.target.value }))}
            placeholder="e.g. Pan Peninsula"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Monthly Rent (GBP) *</label>
          <input
            type="number"
            required
            min={0}
            value={form.rent || ""}
            onChange={(e) => setForm((f) => ({ ...f, rent: Number(e.target.value) }))}
            placeholder="e.g. 3500"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Bedrooms</label>
          <input
            type="number"
            min={0}
            value={form.bedrooms}
            onChange={(e) => setForm((f) => ({ ...f, bedrooms: Number(e.target.value) }))}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Bathrooms</label>
          <input
            type="number"
            min={0}
            value={form.bathrooms}
            onChange={(e) => setForm((f) => ({ ...f, bathrooms: Number(e.target.value) }))}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Floor</label>
          <input
            type="number"
            min={0}
            value={form.floor ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                floor: e.target.value ? Number(e.target.value) : null,
              }))
            }
            placeholder="e.g. 25"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Sq Ft</label>
          <input
            type="number"
            min={0}
            value={form.sqft ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sqft: e.target.value ? Number(e.target.value) : null,
              }))
            }
            placeholder="e.g. 850"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Listing URL</label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            placeholder="https://rightmove.co.uk/..."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Agent Name</label>
          <input
            type="text"
            value={form.agentName}
            onChange={(e) => setForm((f) => ({ ...f, agentName: e.target.value }))}
            placeholder="e.g. Foxtons"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Agent Phone</label>
          <input
            type="tel"
            value={form.agentPhone}
            onChange={(e) => setForm((f) => ({ ...f, agentPhone: e.target.value }))}
            placeholder="e.g. 020 7000 0000"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as PropertyStatus }))
            }
            className={inputClass}
          >
            {PROPERTY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Visit Date & Time</label>
          <input
            type="datetime-local"
            value={form.visitDate ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                visitDate: e.target.value || null,
              }))
            }
            className={inputClass}
          />
        </div>
      </div>

      {/* Image URLs */}
      <div>
        <label className={labelClass}>Image URLs</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
            placeholder="https://..."
            className={cn(inputClass, "flex-1")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addImage();
              }
            }}
          />
          <button
            type="button"
            onClick={addImage}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {form.images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {form.images.map((img, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
              >
                <span className="max-w-[200px] truncate">{img}</span>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                >
                  <X className="h-3 w-3 text-zinc-500 hover:text-red-400" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Pros */}
      <div>
        <label className={labelClass}>Pros</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPro}
            onChange={(e) => setNewPro(e.target.value)}
            placeholder="e.g. Amazing views"
            className={cn(inputClass, "flex-1")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addChip("pros", newPro, setNewPro);
              }
            }}
          />
          <button
            type="button"
            onClick={() => addChip("pros", newPro, setNewPro)}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {form.pros.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {form.pros.map((pro, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs text-emerald-400"
              >
                {pro}
                <button type="button" onClick={() => removeChip("pros", i)}>
                  <X className="h-3 w-3 hover:text-emerald-200" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cons */}
      <div>
        <label className={labelClass}>Cons</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCon}
            onChange={(e) => setNewCon(e.target.value)}
            placeholder="e.g. Noisy street"
            className={cn(inputClass, "flex-1")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addChip("cons", newCon, setNewCon);
              }
            }}
          />
          <button
            type="button"
            onClick={() => addChip("cons", newCon, setNewCon)}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {form.cons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {form.cons.map((con, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs text-red-400"
              >
                {con}
                <button type="button" onClick={() => removeChip("cons", i)}>
                  <X className="h-3 w-3 hover:text-red-200" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Location */}
      <div>
        <button
          type="button"
          onClick={() => setShowLocation((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
        >
          <MapPin className="h-4 w-4" />
          Location (Lat/Lng)
          {showLocation ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showLocation && (
          <div className="mt-3 space-y-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      latitude: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                  placeholder="e.g. 51.5054"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      longitude: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                  placeholder="e.g. -0.0235"
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={geocodeAddress}
              disabled={geocoding || !form.address.trim()}
              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {geocoding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MapPin className="h-3.5 w-3.5" />
              )}
              Geocode from address
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
