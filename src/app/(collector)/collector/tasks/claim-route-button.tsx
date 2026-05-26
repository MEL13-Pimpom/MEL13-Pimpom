"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { claimRouteAction } from "@/lib/actions/collector";

export function ClaimRouteButton({ routeId }: { routeId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handle = () =>
    startTransition(async () => {
      const result = await claimRouteAction(routeId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Route claimed — it's yours now.");
      router.refresh();
    });

  return (
    <Button onClick={handle} disabled={pending} size="sm">
      <Hand className="w-4 h-4 mr-1" />
      {pending ? "Claiming..." : "Claim this route"}
    </Button>
  );
}
