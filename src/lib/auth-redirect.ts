import type { UserRole } from "@/lib/types";

export function dashboardPathForRole(role: UserRole | string | null | undefined): string {
  if (role === "admin") return "/dashboard/admin";
  if (role === "club_admin") return "/dashboard/club";
  return "/dashboard/student";
}
