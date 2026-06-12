import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export default async function proxy(request: NextRequest) {
  const token = request.cookies.get("sb-access-token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Dashboard routes protection
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      const response = NextResponse.redirect(new URL("/auth", request.url));
      response.cookies.delete("sb-access-token");
      response.cookies.delete("sb-refresh-token");
      return response;
    }

    // Fetch user role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      const response = NextResponse.redirect(new URL("/auth", request.url));
      response.cookies.delete("sb-access-token");
      response.cookies.delete("sb-refresh-token");
      return response;
    }

    const { role } = profile;

    // Handle role routing on root /dashboard path
    if (pathname === "/dashboard") {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }
      if (role === "club_admin") {
        return NextResponse.redirect(new URL("/dashboard/club", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard/student", request.url));
    }

    // Intercept sub-dashboards based on role
    if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard/student", request.url));
    }

    if (pathname.startsWith("/dashboard/club") && role !== "club_admin" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard/student", request.url));
    }
  }

  // 2. Redirect authenticated users away from auth route
  if (pathname.startsWith("/auth") && token) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile) {
        if (profile.role === "admin") {
          return NextResponse.redirect(new URL("/dashboard/admin", request.url));
        }
        if (profile.role === "club_admin") {
          return NextResponse.redirect(new URL("/dashboard/club", request.url));
        }
        return NextResponse.redirect(new URL("/dashboard/student", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth"],
};
