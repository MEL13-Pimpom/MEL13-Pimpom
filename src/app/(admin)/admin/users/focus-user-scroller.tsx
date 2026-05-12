"use client";

import { useEffect } from "react";

export function FocusUserScroller({ userId }: { userId: string }) {
  useEffect(() => {
    const el = document.querySelector(`[data-user-id="${userId}"]`);
    if (el && "scrollIntoView" in el) {
      (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [userId]);
  return null;
}
