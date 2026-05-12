import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { NewRequestForm } from "./new-request-form";

export const metadata = { title: "New Pickup Request" };

export default async function NewRequestPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/resident/requests">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to requests
          </Link>
        </Button>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Submit a recycling request
        </h1>
        <p className="text-muted-foreground">
          Fill in the details below and we&apos;ll schedule a pickup.
        </p>
      </div>

      <NewRequestForm
        userId={profile.id}
        defaultAddress={profile.address ?? ""}
      />
    </div>
  );
}
