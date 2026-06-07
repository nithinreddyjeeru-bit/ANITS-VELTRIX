"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Team, TeamMember } from "@/lib/types";

export type TeamWithMembers = Team & {
  members: (TeamMember & { profile?: { name: string; email: string } })[];
  member_count: number;
};

export function useEventTeams(eventId: string) {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [myTeam, setMyTeam] = useState<TeamWithMembers | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: teamRows } = await supabase
      .from("teams")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    const teamIds = (teamRows || []).map((t) => t.id);

    // Single batched query for all members across these teams (no N+1 loop).
    const { data: allMembers } = teamIds.length
      ? await supabase
          .from("team_members")
          .select("*, profile:profiles(name, email)")
          .in("team_id", teamIds)
      : { data: [] as any[] };

    const withMembers: TeamWithMembers[] = (teamRows || []).map((t) => {
      const members = (allMembers || []).filter((m) => m.team_id === t.id);
      return { ...t, members, member_count: members.length };
    });
    setTeams(withMembers);

    if (user) {
      const mine = withMembers.find((t) =>
        t.members.some((m) => m.user_id === user.id)
      );
      setMyTeam(mine || null);
    } else {
      setMyTeam(null);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const createTeam = async (name: string, maxSize: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please log in first");

    const { data: reg } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();
    if (!reg) throw new Error("Register for this event before creating a squad");

    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        name: name.trim(),
        event_id: eventId,
        leader_id: user.id,
        max_size: maxSize,
      })
      .select()
      .single();
    if (error) throw error;

    await supabase.from("team_members").insert({
      team_id: team.id,
      user_id: user.id,
      role: "leader",
    });

    await supabase
      .from("registrations")
      .update({ team_id: team.id })
      .eq("id", reg.id);

    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Squad formed! ⚔️",
      body: `You created "${name}" for this event.`,
      type: "success",
      link: `/events/${eventId}`,
    });

    await fetchTeams();
    return team;
  };

  const joinTeam = async (teamId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please log in first");

    const { data: reg } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();
    if (!reg) throw new Error("Register for this event before joining a squad");

    const team = teams.find((t) => t.id === teamId);
    if (!team) throw new Error("Squad not found");
    if (team.member_count >= team.max_size) throw new Error("Squad is full");

    const { error } = await supabase.from("team_members").insert({
      team_id: teamId,
      user_id: user.id,
      role: "member",
    });
    if (error) throw error;

    await supabase
      .from("registrations")
      .update({ team_id: teamId })
      .eq("id", reg.id);

    await fetchTeams();
  };

  const leaveTeam = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !myTeam) return;

    await supabase
      .from("team_members")
      .delete()
      .eq("team_id", myTeam.id)
      .eq("user_id", user.id);

    await supabase
      .from("registrations")
      .update({ team_id: null })
      .eq("event_id", eventId)
      .eq("user_id", user.id);

    await fetchTeams();
  };

  return { teams, myTeam, loading, createTeam, joinTeam, leaveTeam, refetch: fetchTeams };
}
