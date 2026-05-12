import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          My Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information and avatar. Role changes require
          administrator approval.
        </p>
      </div>

      <ProfileForm
        userId={profile.id}
        defaultValues={{
          fullName: profile.full_name ?? "",
          phone: profile.phone ?? "",
          address: profile.address ?? "",
          avatarUrl: profile.avatar_url ?? "",
        }}
        currentRole={profile.role}
      />
    </div>
  );
}
