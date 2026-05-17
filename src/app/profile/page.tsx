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

      <section style={{ padding: "0 clamp(16px, 4vw, 60px) 100px", maxWidth: "1000px", margin: "0 auto" }}>
        <div className="profile-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", marginBottom: "40px" }}>
          <div className="brutal-card card-green stat-item">
            <div className="font-bangers stat-val">{profile.xp}</div>
            <div className="font-bebas stat-label">TOTAL XP</div>
          </div>
          <div className="brutal-card card-pink stat-item">
            <div className="font-bangers stat-val">#{stats.rank || "—"}</div>
            <div className="font-bebas stat-label">GLOBAL RANK</div>
          </div>
          <div className="brutal-card card-blue stat-item">
            <div className="font-bangers stat-val">{stats.events}</div>
            <div className="font-bebas stat-label">EVENTS JOINED</div>
          </div>
          <div className="brutal-card stat-item">
            <div className="font-bangers stat-val">{stats.certs}</div>
            <div className="font-bebas stat-label">CERTIFICATES</div>
          </div>
        </div>

        {profile.bio && (
          <div className="brutal-card bio-card" style={{ maxWidth: "700px", margin: "0 auto 60px", padding: "32px" }}>
            <h3 className="font-bangers" style={{ fontSize: "1.5rem", marginBottom: "12px" }}>BIO</h3>
            <p className="font-space" style={{ lineHeight: 1.7, opacity: 0.8 }}>{profile.bio}</p>
          </div>
        )}

        <div style={{ textAlign: "center", paddingBottom: "80px" }}>
          <Link href="/leaderboard" className="btn btn-black">VIEW LEADERBOARD</Link>
        </div>
      </section>

      <style jsx>{`
        .stat-val { font-size: 3rem; line-height: 1; }
        .stat-label { opacity: 0.7; letter-spacing: 2px; font-size: 0.9rem; margin-top: 4px; }
        .stat-item { padding: 30px; }

        @media (max-width: 768px) {
          .profile-stats-grid { grid-template-columns: 1fr 1fr; }
          .stat-item { padding: 20px; }
          .stat-val { font-size: 2.2rem; }
        }

        @media (max-width: 480px) {
          .profile-stats-grid { grid-template-columns: 1fr; }
          .bio-card { padding: 20px; }
        }
      `}</style>
    </>
  );
}
