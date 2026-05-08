import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types/database";

export async function getCurrentProfile(): Promise<Profile> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) redirect("/login");
  return profile;
}

export async function requireRole(allowed: UserRole | UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];
  if (!allowedRoles.includes(profile.role)) {
    redirect("/");
  }
  return profile;
}
