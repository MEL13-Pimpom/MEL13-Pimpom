import { ChangePasswordForm } from "./change-password-form";

export const metadata = { title: "Change Password" };

export default function PasswordPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Change Password
        </h1>
        <p className="text-muted-foreground">
          Pick a strong password you haven&apos;t used elsewhere.
        </p>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
