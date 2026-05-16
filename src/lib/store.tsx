"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "./supabase";
import { ensureProfile } from "./auth";
import type { Profile, UserRole } from "./types";
import { levelFromXp } from "./xp";

/** Minimal session-backed user for shell + legacy UI; always synced from `profiles`. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  xp: number;
  level: number;
  isBanned: boolean;
}

interface VeltrixContextType {
  user: SessionUser | null;
  profile: Profile | null;
  isLoaded: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const VeltrixContext = createContext<VeltrixContextType | undefined>(undefined);

function mapProfileToUser(row: Profile, email: string): SessionUser {
  return {
    id: row.id,
    name: row.name || "Student",
    email: row.email || email,
    role: (row.role as UserRole) || "student",
    xp: row.xp ?? 0,
    level: row.level ?? levelFromXp(row.xp ?? 0),
    isBanned: row.is_banned ?? false,
  };
}

export function VeltrixProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadProfileForSession = useCallback(async (userId: string | undefined, email: string | null) => {
    if (!userId || !email) {
      setProfile(null);
      setUser(null);
      return;
    }
    const { data: row, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    let p: Profile;
    if (error || !row) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        setProfile(null);
        setUser(null);
        return;
      }
      p = await ensureProfile(authUser);
    } else {
      p = row as Profile;
    }
    setProfile(p);
    setUser(mapProfileToUser(p, email));
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setProfile(null);
      setUser(null);
      return;
    }
    await loadProfileForSession(session.user.id, session.user.email ?? null);
  }, [loadProfileForSession]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.user) {
          await loadProfileForSession(session.user.id, session.user.email ?? null);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("VeltrixProvider Init Error:", err);
      } finally {
        if (mounted) setIsLoaded(true);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        loadProfileForSession(session.user.id, session.user.email ?? null);
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoaded(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfileForSession]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <VeltrixContext.Provider
      value={{ user, profile, isLoaded, refreshProfile, signOut }}
    >
      {children}
    </VeltrixContext.Provider>
  );
}

export function useVeltrix() {
  const context = useContext(VeltrixContext);
  if (context === undefined) {
    throw new Error("useVeltrix must be used within a VeltrixProvider");
  }
  return context;
}
