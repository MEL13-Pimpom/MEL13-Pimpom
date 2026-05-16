export type Stop = {
  address: string;
  latitude: number;
  longitude: number;
};

const MAX_STOPS = 10; // 9 waypoints + 1 destination

function toLatLng(stop: Stop): string {
  return `${stop.latitude},${stop.longitude}`;
}

export function buildGoogleMapsRouteUrl(
  stops: Stop[],
  options?: { originLatLng?: string },
): string {
  if (stops.length === 0) {
    return "https://www.google.com/maps";
  }

  const trimmed = stops.slice(0, MAX_STOPS);
  const originLatLng = options?.originLatLng;

  const destination = toLatLng(trimmed[trimmed.length - 1]);

  let origin: string;
  let waypointStops: Stop[];

  if (originLatLng) {
    origin = originLatLng;
    waypointStops = trimmed.slice(0, trimmed.length - 1);
  } else {
    origin = toLatLng(trimmed[0]);
    waypointStops = trimmed.slice(1, trimmed.length - 1);
  }

  const params = new URLSearchParams();
  params.set("api", "1");
  params.set("origin", origin);
  params.set("destination", destination);
  params.set("travelmode", "driving");

  if (waypointStops.length > 0) {
    params.set("waypoints", waypointStops.map(toLatLng).join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function buildSingleStopUrl(stop: Stop): string {
  const params = new URLSearchParams();
  params.set("api", "1");
  params.set("destination", toLatLng(stop));
  params.set("travelmode", "driving");
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
