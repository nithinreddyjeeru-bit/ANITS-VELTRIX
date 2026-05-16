"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PageHero } from "@/components/VeltrixUI";
import type { Profile } from "@/lib/types";
import { dashboardPathForRole } from "@/lib/auth-redirect";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ events: 0, certs: 0, rank: 0 });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(p);

      const [regs, certs, ranks] = await Promise.all([
        supabase.from("registrations").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("certificates").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profiles").select("id").eq("is_banned", false).order("xp", { ascending: false }),
      ]);

      const rankList = ranks.data || [];
      const idx = rankList.findIndex((r) => r.id === user.id);

      setStats({
        events: regs.count || 0,
        certs: certs.count || 0,
        rank: idx >= 0 ? idx + 1 : 0,
      });
    };
    load();
  }, [router]);

  if (!profile) {
    return <p className="font-bangers" style={{ padding: "80px", textAlign: "center" }}>LOADING HERO CARD...</p>;
  }

  const dash = dashboardPathForRole(profile.role);

  return (
    <>
      <PageHero
        kicker="Profile"
        title={profile.name.toUpperCase()}
        copy={`Level ${profile.level} · ${profile.xp.toLocaleString()} XP · ${profile.department || "VELTRIX STUDENT"}`}
        action={{ label: "Edit profile", href: "/settings" }}
        secondaryAction={{ label: "Dashboard", href: dash }}
      />

      <section style={{ padding: "0 60px 100px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px", maxWidth: "1000px", margin: "0 auto" }}>
        <div className="brutal-card card-green">
          <div className="font-bangers" style={{ fontSize: "3rem" }}>{profile.xp}</div>
          <div className="font-bebas" style={{ opacity: 0.7, letterSpacing: "2px" }}>TOTAL XP</div>
        </div>
        <div className="brutal-card card-pink">
          <div className="font-bangers" style={{ fontSize: "3rem" }}>#{stats.rank || "—"}</div>
          <div className="font-bebas" style={{ opacity: 0.7, letterSpacing: "2px" }}>GLOBAL RANK</div>
        </div>
        <div className="brutal-card card-blue">
          <div className="font-bangers" style={{ fontSize: "3rem" }}>{stats.events}</div>
          <div className="font-bebas" style={{ opacity: 0.7, letterSpacing: "2px" }}>EVENTS JOINED</div>
        </div>
        <div className="brutal-card">
          <div className="font-bangers" style={{ fontSize: "3rem" }}>{stats.certs}</div>
          <div className="font-bebas" style={{ opacity: 0.7, letterSpacing: "2px" }}>CERTIFICATES</div>
        </div>
      </section>

      {profile.bio && (
        <div className="brutal-card" style={{ maxWidth: "700px", margin: "0 auto 60px", padding: "32px" }}>
          <h3 className="font-bangers" style={{ fontSize: "1.5rem", marginBottom: "12px" }}>BIO</h3>
          <p className="font-space" style={{ lineHeight: 1.7, opacity: 0.8 }}>{profile.bio}</p>
        </div>
      )}

      <div style={{ textAlign: "center", paddingBottom: "80px" }}>
        <Link href="/leaderboard" className="btn btn-black">VIEW LEADERBOARD</Link>
      </div>
    </>
  );
}
