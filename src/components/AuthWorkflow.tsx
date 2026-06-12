"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { dashboardPathForRole } from "@/lib/auth-redirect";
import { ensureProfile } from "@/lib/auth";
import { motion } from "framer-motion";

export function AuthWorkflow() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    registration_no: "",
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
      const registration_no = formData.registration_no.trim();
      const department = formData.department.trim();
      const bio = formData.bio.trim();

      if (!email.endsWith("@anits.edu.in")) {
        setMessage("Error: Please register with a valid ANITS campus email address (@anits.edu.in).");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            full_name: name,
            registration_no,
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
          setMessage("Verification email has been sent! Please check your campus email inbox to verify your account.");
        } else {
          const profile = await ensureProfile(data.user, {
            name,
            email,
            registration_no,
            role: "student",
            department,
            year: formData.year,
            bio,
          });
          router.replace(dashboardPathForRole(profile.role));
        }
      }
    } else {
      // Login via Registration Number
      const registration_no = formData.registration_no.trim();
      
      // 1. Find the email associated with this registration number using secure RPC
      const { data: email, error: rpcError } = await supabase
        .rpc("get_email_by_registration_no", { reg_no: registration_no });

      if (rpcError || !email) {
        setMessage("Error: Registration number not found.");
        setLoading(false);
        return;
      }

      // 2. Sign in with the found email
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (error) setMessage(`Error: ${error.message}`);
      else if (data.user) {
        const profile = await ensureProfile(data.user);
        if (profile.is_banned) {
          await supabase.auth.signOut();
          setMessage("Error: Your account has been suspended. Contact the organizers.");
          setLoading(false);
          return;
        }
        router.replace(dashboardPathForRole(profile.role));
      }
    }
    setLoading(false);
  };



  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "clamp(20px, 5vw, 40px) clamp(16px, 4vw, 20px)" }}>
      <div className="card auth-card" style={{ width: "100%", maxWidth: "560px", background: "white" }}>
        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              type="button" 
              onClick={() => setMode("login")} 
              className="btn mode-btn" 
              style={{ flex: 1, background: mode === "login" ? "var(--pink)" : "white", color: mode === "login" ? "white" : "black" }}
            >
              LOGIN
            </button>
            <button 
              type="button" 
              onClick={() => setMode("signup")} 
              className="btn mode-btn" 
              style={{ flex: 1, background: mode === "signup" ? "var(--green)" : "white", color: "var(--black)" }}
            >
              SIGN UP
            </button>
          </div>

          <div className="font-space auth-fields" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {mode === "signup" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                <label className="auth-label">
                  <span className="font-bebas field-title">YOUR FULL NAME</span>
                  <input className="brutal-card auth-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={loading} placeholder="Tony Stark" />
                </label>

                <label className="auth-label">
                  <span className="font-bebas field-title">REGISTRATION NUMBER</span>
                  <input className="brutal-card auth-input" value={formData.registration_no} onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })} required disabled={loading} placeholder="312xxxxxxxxx" />
                </label>
                
                <div className="auth-grid-row">
                  <label className="auth-label">
                    <span className="font-bebas field-title">DEPARTMENT</span>
                    <select className="brutal-card auth-input" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} required disabled={loading}>
                      <option value="">Select...</option>
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Civil">Civil</option>
                      <option value="MBA">MBA</option>
                    </select>
                  </label>
                  <label className="auth-label">
                    <span className="font-bebas field-title">YEAR</span>
                    <select className="brutal-card auth-input" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} required disabled={loading}>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </label>
                </div>

                <label className="auth-label">
                  <span className="font-bebas field-title">BIO / INTERESTS</span>
                  <textarea className="brutal-card auth-input" style={{ minHeight: "80px", resize: "none" }} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Robotics, Design, Speedrunning..." disabled={loading} />
                </label>
              </div>
            )}
            
            {mode === "signup" || mode === "reset" ? (
              <label className="auth-label">
                <span className="font-bebas field-title">CAMPUS EMAIL</span>
                <input className="brutal-card auth-input" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={loading} placeholder="id@anits.edu.in" />
              </label>
            ) : (
              <label className="auth-label">
                <span className="font-bebas field-title">REGISTRATION NUMBER</span>
                <input className="brutal-card auth-input" value={formData.registration_no} onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })} required disabled={loading} placeholder="312xxxxxxxxx" />
              </label>
            )}
            
            {mode !== "reset" && (
              <label className="auth-label">
                <span className="font-bebas field-title">PASSWORD</span>
                <input className="brutal-card auth-input" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required disabled={loading} minLength={6} placeholder="••••••••" />
              </label>
            )}
          </div>

          {message && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="sticker" 
              style={{ background: message.includes("Error") ? "var(--pink)" : "var(--green)", textAlign: "center", color: message.includes("Error") ? "white" : "black" }}
            >
              {message}
            </motion.div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
            <button type="submit" className="btn btn-green auth-submit" disabled={loading}>
              {loading ? "AUTHENTICATING..." : mode === "login" ? "ENTER UNIVERSE" : mode === "reset" ? "SEND LINK" : "JOIN UNIVERSE"}
            </button>

            {mode === "login" && (
              <button type="button" style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5, fontSize: "0.9rem" }} className="font-bebas" onClick={() => setMode("reset")}>
                FORGOT PASSWORD?
              </button>
            )}
            {mode === "reset" && (
              <button type="button" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem" }} className="font-bebas" onClick={() => setMode("login")}>
                ← BACK TO LOGIN
              </button>
            )}


          </div>

          <Link href="/events" className="font-bebas arena-link">
            JUST BROWSE THE ARENA FOR NOW →
          </Link>
        </form>
      </div>

      <style jsx>{`
        .auth-card { padding: 40px; }
        .auth-label { display: flex; flex-direction: column; gap: 8px; }
        .field-title { font-size: 1.2rem; letter-spacing: 1px; }
        .auth-input { padding: 16px; border: 3px solid black; }
        .auth-grid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .auth-submit { width: 100%; padding: 18px; justify-content: center; font-size: 1.6rem; }

        .arena-link { text-align: center; opacity: 0.5; text-decoration: none; font-size: 0.9rem; margin-top: 10px; }

        @media (max-width: 480px) {
          .auth-card { padding: 24px; }
          .auth-grid-row { grid-template-columns: 1fr; }
          .auth-submit { font-size: 1.3rem; padding: 14px; }
          .mode-btn { font-size: 1rem; padding: 10px; }

        }
      `}</style>
    </div>
  );
}
