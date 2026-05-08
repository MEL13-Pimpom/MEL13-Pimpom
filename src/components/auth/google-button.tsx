"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signInWithGoogleAction } from "@/lib/actions/auth";
import { toast } from "sonner";

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  const [pending, startTransition] = useTransition();
  const [redirecting, setRedirecting] = useState(false);

  const handleClick = () => {
    startTransition(async () => {
      const result = await signInWithGoogleAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setRedirecting(true);
      window.location.href = result.url;
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-11 gap-2"
      onClick={handleClick}
      disabled={pending || redirecting}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.96h5.52c-.24 1.44-1.68 4.2-5.52 4.2-3.32 0-6.04-2.76-6.04-6.16S8.68 6.04 12 6.04c1.88 0 3.16.8 3.88 1.48l2.64-2.56C16.84 3.4 14.6 2.4 12 2.4 6.72 2.4 2.4 6.72 2.4 12s4.32 9.6 9.6 9.6c5.52 0 9.2-3.88 9.2-9.36 0-.6-.08-1.08-.16-1.56H12z"
        />
      </svg>
      <span>{redirecting ? "Redirecting..." : label}</span>
    </Button>
  );
}
