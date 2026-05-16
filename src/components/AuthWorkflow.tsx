"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { dashboardPathForRole } from "@/lib/auth-redirect";
import { ensureProfile } from "@/lib/auth";

export function AuthWorkflow() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    year: "1",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      setMessage(error ? `Error: ${error.message}` : "Check your email for the reset link.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const email = formData.email.trim().toLowerCase();
      const name = formData.name.trim();
      const department = formData.department.trim();
      const bio = formData.bio.trim();

      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            full_name: name,
            role: "student",
            department,
            year: Number(formData.year),
            bio,
          },
        },
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else if (data.user) {
        if (!data.session) {
          setMessage("Account created, but Supabase email confirmation is still ON. Turn it OFF in Supabase Auth settings for direct login.");
        } else {
          const profile = await ensureProfile(data.user, {
            name,
            email,
            role: "student",
            department,
            year: formData.year,
            bio,
          });
          router.replace(dashboardPathForRole(profile.role));
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      if (error) setMessage(`Error: ${error.message}`);
      else if (data.user) {
        const profile = await ensureProfile(data.user);
        router.replace(dashboardPathForRole(profile.role));
      }
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setMessage(`Error: ${error.message}`);
    setLoading(false);
  };

  return (
    <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", gap: "10px" }}>
        <button type="button" onClick={() => setMode("login")} className="btn" style={{ flex: 1, background: mode === "login" ? "var(--pink)" : "white", color: mode === "login" ? "white" : "black" }}>LOGIN</button>
        <button type="button" onClick={() => setMode("signup")} className="btn" style={{ flex: 1, background: mode === "signup" ? "var(--green)" : "white" }}>SIGN UP</button>
      </div>

      <div className="font-space" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {mode === "signup" && (
          <>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span className="font-bebas" style={{ fontSize: "1.2rem" }}>YOUR FULL NAME</span>
              <input className="brutal-card" style={{ padding: "15px" }} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={loading} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span className="font-bebas" style={{ fontSize: "1.2rem" }}>DEPARTMENT</span>
              <select className="brutal-card" style={{ padding: "15px" }} value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required disabled={loading}>
                <option value="">Select department</option>
                <option value="CSE">CSE</option>
                <option value="CSE AI & ML">CSE AI & ML</option>
                <option value="CSE Data Science">CSE Data Science</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
                <option value="Chemical">Chemical</option>
                <option value="MBA">MBA</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span className="font-bebas" style={{ fontSize: "1.2rem" }}>YEAR</span>
              <select className="brutal-card" style={{ padding: "15px" }} value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} required disabled={loading}>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span className="font-bebas" style={{ fontSize: "1.2rem" }}>BIO / INTERESTS</span>
              <textarea className="brutal-card" style={{ padding: "15px", minHeight: "90px", resize: "vertical" }} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Hackathons, robotics, design, sports..." disabled={loading} />
            </label>
          </>
        )}
        <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span className="font-bebas" style={{ fontSize: "1.2rem" }}>CAMPUS EMAIL</span>
          <input className="brutal-card" type="email" style={{ padding: "15px" }} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={loading} />
        </label>
        {mode !== "reset" && (
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span className="font-bebas" style={{ fontSize: "1.2rem" }}>PASSWORD</span>
            <input className="brutal-card" type="password" style={{ padding: "15px" }} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required disabled={loading} minLength={6} />
          </label>
        )}
      </div>

      {message && (
        <div className="sticker" style={{ background: message.includes("Error") ? "var(--pink)" : "var(--green)", textAlign: "center" }}>
          {message}
        </div>
      )}

      <button type="submit" className="btn btn-green" style={{ width: "100%", padding: "16px", justifyContent: "center" }} disabled={loading}>
        {loading ? "PROCESSING..." : mode === "login" ? "ENTER UNIVERSE" : mode === "reset" ? "SEND RESET LINK" : "CREATE ACCOUNT"}
      </button>

      {mode === "login" && (
        <button type="button" style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.6 }} className="font-bebas" onClick={() => setMode("reset")}>
          FORGOT PASSWORD?
        </button>
      )}
      {mode === "reset" && (
        <button type="button" style={{ background: "none", border: "none", cursor: "pointer" }} className="font-bebas" onClick={() => setMode("login")}>
          ← BACK TO LOGIN
        </button>
      )}

      <button type="button" onClick={handleGoogle} className="btn" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
        CONTINUE WITH GOOGLE
      </button>

      <Link href="/events" className="font-bebas" style={{ textAlign: "center", opacity: 0.6, textDecoration: "none" }}>JUST BROWSE FOR NOW →</Link>
    </form>
  );
}
