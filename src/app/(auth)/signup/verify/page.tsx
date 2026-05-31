import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { VerifySignupForm } from "./verify-form";

export const metadata = {
  title: "Verify your email — Recycling Pickup Scheduler",
};

type SearchParams = Promise<{ email?: string }>;

export default async function VerifySignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { email } = await searchParams;

  if (!email) {
    redirect("/signup");
  }

  return (
    <AuthCard
      title="Verify your email"
      subtitle={`Enter the 6-digit code we sent to ${email}`}
      footer={
        <Link href="/login" className="text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <VerifySignupForm email={email} />
    </AuthCard>
  );
}
