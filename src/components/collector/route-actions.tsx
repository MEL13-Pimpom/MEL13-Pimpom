"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  buildGoogleMapsRouteUrl,
  type Stop,
} from "@/lib/utils/google-maps";

interface Props {
  stops: Stop[];
}

function getCurrentLatLng(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve(`${pos.coords.latitude},${pos.coords.longitude}`);
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  });
}

export function RouteActions({ stops }: Props) {
  const [pending, startTransition] = useTransition();

  const openOptimizedRoute = () => {
    startTransition(async () => {
      const toastId = toast.loading("Getting your current location…");
      const originLatLng = await getCurrentLatLng();
      if (originLatLng) {
        toast.success("Opening Google Maps", { id: toastId });
      } else {
        toast.message("Using the first stop as origin", { id: toastId });
      }
      const url = buildGoogleMapsRouteUrl(stops, {
        originLatLng: originLatLng ?? undefined,
      });
      window.open(url, "_blank", "noopener,noreferrer");
    });
  };

  const disabled = pending || stops.length === 0;

  return (
    <Button onClick={openOptimizedRoute} disabled={disabled}>
      <Sparkles className="mr-2 h-4 w-4" />
      Open optimize route in Google Maps
    </Button>
  );
}
