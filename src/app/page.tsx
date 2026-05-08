import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function RootPage() {
  const profile = await getCurrentProfile();

  switch (profile.role) {
    case "admin":
      redirect("/admin/dashboard");
    case "collector":
      redirect("/collector/dashboard");
    case "resident":
    default:
      redirect("/resident/dashboard");
  }
}
