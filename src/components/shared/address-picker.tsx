"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Loader2, MapPin } from "lucide-react";

import { geocodeAddress } from "@/lib/maps/geocoding";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons in Next.js (assets aren't bundled by default)
type IconDefaultPrototype = L.Icon.Default["options"] & { _getIconUrl?: unknown };
delete (L.Icon.Default.prototype as IconDefaultPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER: [number, number] = [-37.8136, 144.9631]; // Melbourne
const DEFAULT_ZOOM = 13;
const FOCUSED_ZOOM = 16;
const GEOCODE_DEBOUNCE_MS = 800;
const MIN_GEOCODE_LENGTH = 5;

export type GeocodingSource = "auto" | "manual";

interface AddressPickerProps {
  address: string;
  value: { lat: number; lng: number } | null;
  source: GeocodingSource | null;
  onChange: (
    coords: { lat: number; lng: number } | null,
    source: GeocodingSource | null,
  ) => void;
}

type UiState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success-auto" }
  | { kind: "manual" }
  | { kind: "failed" };

function MapRecenter({ value }: { value: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) {
      map.flyTo([value.lat, value.lng], FOCUSED_ZOOM, { duration: 0.6 });
    }
  }, [value, map]);
  return null;
}

function ClickHandler({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function AddressPicker({
  address,
  value,
  source,
  onChange,
}: AddressPickerProps) {
  const lastGeocodedAddress = useRef<string | null>(null);
  const [uiState, setUiState] = useState<UiState>(() => {
    if (value && source === "manual") return { kind: "manual" };
    if (value && source === "auto") return { kind: "success-auto" };
    return { kind: "idle" };
  });

  useEffect(() => {
    const trimmed = address.trim();

    if (trimmed.length < MIN_GEOCODE_LENGTH) {
      lastGeocodedAddress.current = null;
      if (!value) setUiState({ kind: "idle" });
      return;
    }

    if (lastGeocodedAddress.current === trimmed) {
      return;
    }

    const handle = setTimeout(async () => {
      lastGeocodedAddress.current = trimmed;
      setUiState({ kind: "loading" });
      const result = await geocodeAddress(trimmed);
      if (result) {
        onChange({ lat: result.latitude, lng: result.longitude }, "auto");
        setUiState({ kind: "success-auto" });
      } else {
        onChange(null, null);
        setUiState({ kind: "failed" });
      }
    }, GEOCODE_DEBOUNCE_MS);

    return () => clearTimeout(handle);
    // We intentionally exclude `value` and `onChange` to avoid re-geocoding when marker drags
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const handleMarkerDrag = (lat: number, lng: number) => {
    onChange({ lat, lng }, "manual");
    setUiState({ kind: "manual" });
  };

  const handleMapClick = (lat: number, lng: number) => {
    onChange({ lat, lng }, "manual");
    setUiState({ kind: "manual" });
  };

  const clickEnabled = uiState.kind === "failed" || !value;
  const center: [number, number] = value ? [value.lat, value.lng] : DEFAULT_CENTER;
  const zoom = value ? FOCUSED_ZOOM : DEFAULT_ZOOM;

  return (
    <div className="space-y-2">
      <Banner state={uiState} hasValue={value !== null} />
      <div className="overflow-hidden rounded-lg border border-border">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom
          style={{ height: 300, width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler enabled={clickEnabled} onPick={handleMapClick} />
          <MapRecenter value={value} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              draggable
              eventHandlers={{
                dragend(e) {
                  const m = e.target as L.Marker;
                  const { lat, lng } = m.getLatLng();
                  handleMarkerDrag(lat, lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

function Banner({
  state,
  hasValue,
}: {
  state: UiState;
  hasValue: boolean;
}) {
  // While loading, ignore other states.
  if (state.kind === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Locating address…</span>
      </div>
    );
  }

  if (state.kind === "success-auto") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
        <span aria-hidden>✓</span>
        <span>
          Location found. Drag the pin if it isn&apos;t quite right.
        </span>
      </div>
    );
  }

  if (state.kind === "manual" || (hasValue && state.kind === "idle")) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
        <MapPin className="h-4 w-4" />
        <span>You placed this location manually.</span>
      </div>
    );
  }

  if (state.kind === "failed") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        <span aria-hidden>⚠</span>
        <span>
          Could not find that address. Refine it or click the map to place a
          pin.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
      <MapPin className="h-4 w-4" />
      <span>Type an address to show its location.</span>
    </div>
  );
}
