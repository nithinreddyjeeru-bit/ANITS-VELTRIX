"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { LeaderboardEntry } from "@/lib/types";

export function useLeaderboard(limit = 50) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { data } = await supabase
        .from("profiles")
        .select("id, name, email, department, avatar_url, xp, level")
        .eq("is_banned", false)
        .order("xp", { ascending: false })
        .limit(limit);

      if (data) {
        const ranked = data.map((p, i) => ({ ...p, rank: i + 1 }));
        setEntries(ranked);
        if (user) {
          const mine = ranked.find(r => r.id === user.id);
          setMyRank(mine || null);
        }
      }
      setLoading(false);
    };

    fetch();

    // Realtime: refresh when profiles XP changes
    const channel = supabase
      .channel("leaderboard-live")
      .on("postgres_changes" as any, {
        event: "UPDATE", schema: "public", table: "profiles"
      }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel).catch(console.error); };
  }, [limit]);

  return { entries, loading, myRank };
}
