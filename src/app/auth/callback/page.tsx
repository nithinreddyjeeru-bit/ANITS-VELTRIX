"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { dashboardPathForRole } from "@/lib/auth-redirect";
import { ensureProfile } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const finish = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace("/auth");
        return;
      }
      const profile = await ensureProfile(session.user);
      router.replace(dashboardPathForRole(profile.role));
    };
    finish();
  }, [router]);

  return (
    <div className="loading-screen">
      <span className="font-bangers" style={{ fontSize: "2rem" }}>⚡ ENTERING VELTRIX...</span>
    </div>
  );
}
