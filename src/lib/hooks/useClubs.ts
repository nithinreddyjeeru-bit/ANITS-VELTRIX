"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Club } from "@/lib/types";

export function useClubs(search?: string) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("clubs")
      .select("*")
      .eq("is_approved", true)
      .order("member_count", { ascending: false });

    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error: err } = await query;
    if (err) setError(err.message);
    else setClubs(data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchClubs(); }, [fetchClubs]);

  return { clubs, loading, error, refetch: fetchClubs };
}

export function useClubMembership(clubId: string) {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !clubId) { setLoading(false); return; }
      const { data } = await supabase
        .from("club_members")
        .select("id")
        .eq("club_id", clubId)
        .eq("user_id", user.id)
        .single();
      setIsMember(!!data);
      setLoading(false);
    };
    check();
  }, [clubId]);

  const toggleMembership = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please login first");
    if (isMember) {
      await supabase.from("club_members").delete()
        .eq("club_id", clubId).eq("user_id", user.id);
      setIsMember(false);
    } else {
      await supabase.from("club_members").insert({ club_id: clubId, user_id: user.id });
      setIsMember(true);
    }
  };

  return { isMember, loading, toggleMembership };
}

export function useMyClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("club_members")
        .select("club:clubs(*)")
        .eq("user_id", user.id);
      setClubs(data?.map((d: any) => d.club).filter(Boolean) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return { clubs, loading };
}
