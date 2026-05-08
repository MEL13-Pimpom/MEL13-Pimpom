import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "./signup-form";
import { GoogleButton } from "@/components/auth/google-button";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Create account — Recycling Pickup Scheduler",
};

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Join the program as a resident or collector"
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <SignupForm />
      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>
      <GoogleButton label="Sign up with Google" />
    </AuthCard>
  );
}
