"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Notification } from "@/lib/types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let channel: any;

    const initNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isMounted) {
        if (isMounted) setLoading(false);
        return;
      }

      // 1. Initial Fetch
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!isMounted) return;
      
      const list = data || [];
      setNotifications(list);
      setUnread(list.filter(n => !n.is_read).length);
      setLoading(false);

      // 2. Setup Realtime
      // We use a unique channel name per session to avoid collisions
      channel = supabase
        .channel(`notifs-${user.id}-${Date.now()}`)
        .on("postgres_changes" as any, {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        }, (payload: any) => {
          if (isMounted) {
            setNotifications(prev => [payload.new, ...prev]);
            setUnread(prev => prev + 1);
          }
        })
        .subscribe();
    };

    initNotifications();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, []);

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  return { notifications, unread, loading, markAllRead, markRead };
}
