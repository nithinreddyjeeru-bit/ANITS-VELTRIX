"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setProfile(null); setLoading(false); return; }

    const { data, error: err } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (err) setError(err.message);
    else setProfile(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) throw error;
    await fetchProfile();
  };

  return { profile, loading, error, refetch: fetchProfile, updateProfile };
}

export function useRegistrations() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("registrations")
        .select("*, event:events(*)")
        .eq("user_id", user.id)
        .order("registered_at", { ascending: false });

      setRegistrations(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const register = async (eventId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please login first");

    const { data, error } = await supabase
      .from("registrations")
      .insert({ user_id: user.id, event_id: eventId })
      .select("*, event:events(*)")
      .single();

    if (error) throw error;

    // Create notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Registration Confirmed! 🎉",
      body: `You've registered for ${data.event?.title}. Your QR code is ready.`,
      type: "success",
      link: `/events/${eventId}`
    });

    setRegistrations(prev => [data, ...prev]);
    return data;
  };

  const isRegistered = (eventId: string) =>
    registrations.some(r => r.event_id === eventId);

  return { registrations, loading, register, isRegistered };
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("bookmarks")
        .select("*, event:events(*)")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });
      setBookmarks(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const toggleBookmark = async (eventId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please login first");

    const existing = bookmarks.find(b => b.event_id === eventId);
    if (existing) {
      await supabase.from("bookmarks").delete().eq("id", existing.id);
      setBookmarks(prev => prev.filter(b => b.event_id !== eventId));
    } else {
      const { data } = await supabase
        .from("bookmarks")
        .insert({ user_id: user.id, event_id: eventId })
        .select("*, event:events(*)")
        .single();
      if (data) setBookmarks(prev => [data, ...prev]);
    }
  };

  const isBookmarked = (eventId: string) =>
    bookmarks.some(b => b.event_id === eventId);

  return { bookmarks, loading, toggleBookmark, isBookmarked };
}
