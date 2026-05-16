"use client";

import dynamic from "next/dynamic";

export const AddressPicker = dynamic(
  () => import("./address-picker").then((m) => m.AddressPicker),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-2">
        <div className="h-9 animate-pulse rounded-md bg-muted" />
        <div className="h-[300px] animate-pulse rounded-lg bg-muted" />
      </div>
    ),
  },
);
