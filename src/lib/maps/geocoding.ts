export type GeocodeResult =
  | { latitude: number; longitude: number; displayName: string }
  | null;

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const trimmed = address.trim();
  if (trimmed.length === 0) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", trimmed);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "au");

    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim usage policy requires identifying the app
        "Accept-Language": "en-AU,en",
      },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as NominatimResult[];
    if (!Array.isArray(data) || data.length === 0) return null;

    const top = data[0];
    const latitude = Number(top.lat);
    const longitude = Number(top.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude, displayName: top.display_name };
  } catch {
    return null;
  }
}
