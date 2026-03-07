import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { ArrowLeft, MapPinOff, Bed, Bath, ExternalLink } from "lucide-react";
import { useData } from "@/context/DataContext";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUS_HEX } from "@/lib/map-colors";
import { formatCurrency } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

const CANARY_WHARF: [number, number] = [51.5054, -0.0235];

const tileFilterCSS = `
  .dark-map-tiles .leaflet-tile-pane {
    filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9);
  }
`;

export function MapView() {
  const { properties } = useData();

  const { mapped, unmapped } = useMemo(() => {
    const mapped = properties.filter(
      (p) => p.latitude != null && p.longitude != null,
    );
    const unmapped = properties.filter(
      (p) => p.latitude == null || p.longitude == null,
    );
    return { mapped, unmapped };
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
        {unmapped.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <MapPinOff className="h-3.5 w-3.5" />
            {unmapped.length} without location
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
          <style>{tileFilterCSS}</style>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {mapped.map((property) => {
            const color = STATUS_HEX[property.status];
            const isLetAgreed = property.status === "let_agreed";

            return (
              <CircleMarker
                key={property.id}
                center={[property.latitude!, property.longitude!]}
                radius={8}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: isLetAgreed ? 0.25 : 0.7,
                  weight: 2,
                  opacity: isLetAgreed ? 0.4 : 0.9,
                }}
              >
                <Popup>
                  <div className="min-w-[200px] space-y-2 text-zinc-900">
                    <div className="font-semibold leading-tight">
                      {property.title}
                    </div>
                    <div className="text-xs text-zinc-600">{property.address}</div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={property.status} />
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <Bed className="h-3.5 w-3.5" />
                        {property.bedrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5" />
                        {property.bathrooms}
                      </span>
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(property.rent)}/mo
                      </span>
                    </div>
                    <Link
                      to={`/property/${property.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Details
                    </Link>
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
