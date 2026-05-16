"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { AdminStats, Profile, AuditLog } from "@/lib/types";

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    total_students: 0, total_registrations: 0, total_attendance: 0,
    total_events: 0, total_clubs: 0, total_certificates: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const [students, registrations, attendance, events, clubs, certs] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("registrations").select("*", { count: "exact", head: true }),
      supabase.from("attendance").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("clubs").select("*", { count: "exact", head: true }),
      supabase.from("certificates").select("*", { count: "exact", head: true }),
    ]);
    setStats({
      total_students: students.count || 0,
      total_registrations: registrations.count || 0,
      total_attendance: attendance.count || 0,
      total_events: events.count || 0,
      total_clubs: clubs.count || 0,
      total_certificates: certs.count || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { stats, loading, refetch: fetch };
}

export function useAllUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setUsers(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const updateRole = async (userId: string, role: "student" | "admin" | "club_admin") => {
    await supabase.from("profiles").update({ role }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
  };

  const toggleBan = async (userId: string, isBanned: boolean) => {
    await supabase.from("profiles").update({ is_banned: !isBanned }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !isBanned } : u));
  };

  return { users, loading, updateRole, toggleBan };
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setLogs(data || []);
      setLoading(false);
    };
    fetch();

    const channel = (supabase.channel("audit-live") as any)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" },
        (payload: any) => setLogs(prev => [payload.new, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(channel).catch(console.error); };
  }, []);

  return { logs, loading };
}

export async function issueCertificate(userId: string, eventId: string, title: string, fileUrl = "") {
  const { data, error } = await supabase
    .from("certificates")
    .insert({ user_id: userId, event_id: eventId, title, file_url: fileUrl })
    .select()
    .single();
  if (error) throw error;

  await supabase.from("notifications").insert({
    user_id: userId,
    title: "Certificate Issued! 🏅",
    body: `Your certificate for "${title}" is ready to download.`,
    type: "success",
    link: "/certificates",
  });
  return data;
}

export async function issueCertificateWithFile(
  userId: string,
  eventId: string,
  title: string,
  file?: File
) {
  const { data: cert, error } = await supabase
    .from("certificates")
    .insert({ user_id: userId, event_id: eventId, title })
    .select()
    .single();
  if (error) throw error;

  let fileUrl = "";
  if (file) {
    const { uploadCertificatePdf } = await import("@/lib/storage");
    fileUrl = await uploadCertificatePdf(userId, cert.id, file);
    await supabase.from("certificates").update({ file_url: fileUrl }).eq("id", cert.id);
  }

  await supabase.from("notifications").insert({
    user_id: userId,
    title: "Certificate Issued! 🏅",
    body: `Your certificate for "${title}" is ready.`,
    type: "success",
    link: "/certificates",
  });

  return { ...cert, file_url: fileUrl };
}

export async function sendAnnouncement(title: string, body: string, authorId: string, isGlobal = true) {
  const { error } = await supabase.from("announcements").insert({ title, body, author_id: authorId, is_global: isGlobal });
  if (error) throw error;
}

export function useCertificates(userId?: string) {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        uid = user?.id;
      }
      if (!uid) { setLoading(false); return; }
      const { data } = await supabase
        .from("certificates")
        .select("*, event:events(title, category, event_date)")
        .eq("user_id", uid)
        .order("issued_at", { ascending: false });
      setCertificates(data || []);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  return { certificates, loading };
}
