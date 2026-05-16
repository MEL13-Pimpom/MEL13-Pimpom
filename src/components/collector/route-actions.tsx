"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildGoogleMapsRouteUrl, type Stop } from "@/lib/maps/google-maps";

interface Props {
  stops: Stop[];
}

export function RouteActions({ stops }: Props) {
  const openRoute = () => {
    const url = buildGoogleMapsRouteUrl(stops);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Button onClick={openRoute} disabled={stops.length === 0}>
      <Sparkles className="mr-2 h-4 w-4" />
      Open route in Google Maps
    </Button>
  );
}
