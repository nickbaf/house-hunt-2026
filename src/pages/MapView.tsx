import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { ArrowLeft, MapPinOff, Bed, Bath, ExternalLink } from "lucide-react";
import { useData } from "@/context/DataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUS_HEX } from "@/lib/map-colors";
import { formatCurrency } from "@/lib/utils";
import type { Property, PropertyStatus } from "@/types";
import "leaflet/dist/leaflet.css";

const CANARY_WHARF: [number, number] = [51.5054, -0.0235];

const mapCSS = `
  .dark-map-tiles .leaflet-tile-pane {
    filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9);
  }
  .leaflet-popup-content-wrapper {
    border-radius: 12px !important;
    box-shadow: 0 8px 30px rgba(0,0,0,0.12) !important;
    padding: 0 !important;
  }
  .leaflet-popup-content {
    margin: 0 !important;
    width: auto !important;
  }
  .leaflet-popup-tip {
    box-shadow: none !important;
  }
  .popup-scroll::-webkit-scrollbar {
    width: 5px;
  }
  .popup-scroll::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  .popup-scroll::-webkit-scrollbar-thumb {
    background: #c4c4c4;
    border-radius: 4px;
  }
`;

interface LocationGroup {
  key: string;
  lat: number;
  lng: number;
  properties: Property[];
}

const STATUS_PRIORITY: Record<PropertyStatus, number> = {
  interested: 0,
  viewing_scheduled: 1,
  visited: 2,
  applied: 3,
  offer_made: 4,
  accepted: 5,
  new: 6,
  rejected: 7,
  passed: 8,
  let_agreed: 9,
};

export function MapView() {
  const { properties } = useData();

  const { groups, unmappedCount } = useMemo(() => {
    const mapped = properties.filter(
      (p) => p.latitude != null && p.longitude != null,
    );
    const unmappedCount = properties.length - mapped.length;

    const byLocation = new Map<string, Property[]>();
    for (const p of mapped) {
      const key = `${p.latitude!.toFixed(5)},${p.longitude!.toFixed(5)}`;
      const arr = byLocation.get(key) ?? [];
      arr.push(p);
      byLocation.set(key, arr);
    }

    const groups: LocationGroup[] = [];
    for (const [key, props] of byLocation) {
      groups.push({
        key,
        lat: props[0].latitude!,
        lng: props[0].longitude!,
        properties: props.sort(
          (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status],
        ),
      });
    }
    return { groups, unmappedCount };
  }, [properties]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <h1 className="text-lg font-semibold text-zinc-100">Map View</h1>
        </div>
        {unmappedCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <MapPinOff className="h-3.5 w-3.5" />
            {unmappedCount} without location
          </span>
        )}
      </div>

      <div className="relative flex-1">
        <MapContainer
          center={CANARY_WHARF}
          zoom={14}
          className="dark-map-tiles h-full w-full"
          style={{ background: "#27272a" }}
        >
          <style>{mapCSS}</style>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {groups.map((group) => {
            const topProp = group.properties[0];
            const color = STATUS_HEX[topProp.status];
            const allLetAgreed = group.properties.every(
              (p) => p.status === "let_agreed",
            );
            const count = group.properties.length;

            return (
              <CircleMarker
                key={group.key}
                center={[group.lat, group.lng]}
                radius={count > 1 ? 10 : 8}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: allLetAgreed ? 0.25 : 0.7,
                  weight: 2,
                  opacity: allLetAgreed ? 0.4 : 0.9,
                }}
              >
                <Popup maxWidth={280} minWidth={240} autoPan>
                  <div className="p-3">
                    {count > 1 && (
                      <div className="pb-2 mb-2 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wide">
                        {count} properties here
                      </div>
                    )}
                    <div
                      className={count > 2 ? "popup-scroll overflow-y-auto pr-1" : ""}
                      style={count > 2 ? { maxHeight: 260 } : undefined}
                    >
                      {group.properties.map((property, i) => (
                        <div
                          key={property.id}
                          className={i > 0 ? "border-t border-zinc-100 pt-2.5 mt-2.5" : ""}
                        >
                          <div className="font-semibold leading-snug text-[13px] text-zinc-800">
                            {property.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={property.status} />
                          </div>
                          <div className="flex items-center gap-3 text-[13px] mt-1 text-zinc-600">
                            <span className="flex items-center gap-1">
                              <Bed className="h-3.5 w-3.5" />
                              {property.bedrooms}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bath className="h-3.5 w-3.5" />
                              {property.bathrooms}
                            </span>
                            <span className="font-bold text-emerald-600">
                              {formatCurrency(property.rent)}/mo
                            </span>
                          </div>
                          <Link
                            to={`/property/${property.id}`}
                            className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Details
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border border-zinc-700 bg-zinc-900/90 p-3 backdrop-blur-sm">
          <p className="mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Status
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {(Object.entries(STATUS_HEX) as [string, string][]).map(
              ([status, hex]) => (
                <div key={status} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="text-xs text-zinc-400 capitalize">
                    {status.replace(/_/g, " ")}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
