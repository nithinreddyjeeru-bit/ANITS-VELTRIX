import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile, UserRole } from "@/lib/types";

export type ProfileInput = {
  name?: string;
  email?: string;
  registration_no?: string;
  role?: UserRole;
  department?: string;
  year?: number | string;
  bio?: string;
};

function cleanRole(role: unknown): UserRole {
  return role === "admin" || role === "club_admin" || role === "student" ? role : "student";
}

function cleanYear(year: unknown): number {
  const parsed = Number(year);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

export function profileInputFromUser(user: User, fallback?: ProfileInput): Required<ProfileInput> {
  const metadata = user.user_metadata ?? {};
  const email = (fallback?.email ?? user.email ?? "").trim().toLowerCase();
  const fallbackName = email ? email.split("@")[0] : "Student";

  return {
    name: (fallback?.name ?? (metadata.full_name as string | undefined) ?? fallbackName).trim(),
    email,
    registration_no: (fallback?.registration_no ?? (metadata.registration_no as string | undefined) ?? "").trim(),
    role: cleanRole(fallback?.role ?? metadata.role),
    department: (fallback?.department ?? (metadata.department as string | undefined) ?? "").trim(),
    year: cleanYear(fallback?.year ?? metadata.year),
    bio: (fallback?.bio ?? (metadata.bio as string | undefined) ?? "").trim(),
  };
}

export async function ensureProfile(user: User, fallback?: ProfileInput): Promise<Profile> {
  const values = profileInputFromUser(user, fallback);

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") throw existingError;
  if (existing && !fallback) return existing as Profile;

  const query = existing
    ? supabase
        .from("profiles")
        .update({
          name: values.name,
          email: values.email,
          registration_no: values.registration_no,
          role: values.role,
          department: values.department,
          year: values.year,
          bio: values.bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
    : supabase
    .from("profiles")
        .insert({
        id: user.id,
        name: values.name,
        email: values.email,
        registration_no: values.registration_no,
        role: values.role,
        department: values.department,
        year: values.year,
        bio: values.bio,
        updated_at: new Date().toISOString(),
        });

  const { data, error } = await query.select("*").single();

  if (error) throw error;
  return data as Profile;
}
