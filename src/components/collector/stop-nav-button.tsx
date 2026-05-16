"use client";

import { Navigation } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildSingleStopUrl, type Stop } from "@/lib/utils/google-maps";

interface Props {
  stop: Stop;
}

export function StopNavButton({ stop }: Props) {
  const handleClick = () => {
    const url = buildSingleStopUrl(stop);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Button size="sm" variant="outline" onClick={handleClick}>
      <Navigation className="mr-1 h-4 w-4" />
      Navigate
    </Button>
  );
}
