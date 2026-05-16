"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Event } from "@/lib/types";

export function useEvents(options?: { category?: string; search?: string; limit?: number }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (options?.category && options.category !== "All") {
        query = query.eq("category", options.category);
      }
      if (options?.search) {
        query = query.ilike("title", `%${options.search}%`);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setEvents(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [options?.category, options?.search, options?.limit]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}

export function useEvent(id: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();
      if (err) setError(err.message);
      else setEvent(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  return { event, loading, error };
}

export function useRegistrationCount(eventId: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!eventId) return;
    const fetch = async () => {
      const { count: c } = await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);
      setCount(c || 0);
    };
    fetch();

    // Realtime subscription
    const channel = supabase
      .channel(`reg-count-${eventId}`)
      .on("postgres_changes" as any, {
        event: "*", schema: "public", table: "registrations",
        filter: `event_id=eq.${eventId}`
      }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel).catch(console.error); };
  }, [eventId]);

  return count;
}

export async function createEvent(data: Partial<Event>) {
  const { data: result, error } = await supabase
    .from("events")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateEvent(id: string, data: Partial<Event>) {
  const { data: result, error } = await supabase
    .from("events")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}
