import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = {
  title: "Set new password — Recycling Pickup Scheduler",
};

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=recovery_session_expired");
  }

  return (
    <AuthCard
      title="Set a new password"
      subtitle="Choose a strong password to secure your account"
      footer={
        <Link href="/login" className="text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
