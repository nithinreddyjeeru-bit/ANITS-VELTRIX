"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Event, Profile } from "@/lib/types";
import ComicProgress from "@/components/ComicProgress";
import { 
  CheckCircle, ArrowLeft, Calendar, MapPin, QrCode, 
  ShieldCheck, Ticket, Users, PlusCircle, Search, 
  Send, User, BookOpen, CreditCard, Sparkles, Zap, Trash2
} from "lucide-react";
import QRCode from "qrcode";

interface ActiveTeamDisplay {
  id: string;
  name: string;
  leader_name: string;
  member_count: number;
  max_size: number;
  invite_code: string;
  skills_needed?: string;
}

export default function RegisterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  // Flow State
  // "mode-select" -> "solo-flow" | "team-flow"
  const [flow, setFlow] = useState<"select" | "solo" | "team" | "success">("select");
  const [teamOption, setTeamOption] = useState<"create" | "join" | null>(null);

  // Solo Steps: 0: Personal, 1: College, 2: Review, 3: Payment, 4: Success
  const [soloStep, setSoloStep] = useState(0);

  // Solo Form Fields
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    registrationNo: "",
    department: "",
    year: "1",
    section: "A",
    gender: "",
    skills: ""
  });

  // Team Form Fields
  const [teamName, setTeamName] = useState("");
  const [teamSize, setTeamSize] = useState(4);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [activeTeams, setActiveTeams] = useState<ActiveTeamDisplay[]>([]);
  const [searchingTeams, setSearchingTeams] = useState(false);

  // Success ticket values
  const [qrToken, setQrToken] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [successTeamCode, setSuccessTeamCode] = useState("");
  const [pendingJoinTeam, setPendingJoinTeam] = useState("");

  const soloStepsNames = ["Personal Info", "College Info", "Review Details", "Checkout Pass"];

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUserId(user.id);

      // Fetch profile details
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setUserProfile(profile);
        setFormData({
          fullName: profile.name || "",
          email: profile.email || "",
          mobile: "",
          registrationNo: profile.registration_no || "",
          department: profile.department || "",
          year: String(profile.year || 1),
          section: "A",
          gender: "",
          skills: ""
        });
      }

      // Fetch Event details
      const { data: ev } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();
      
      setEvent(ev);

      // Check if user is already registered for this event
      const { data: existingReg } = await supabase
        .from("registrations")
        .select("*")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .single();

      if (existingReg) {
        setQrToken(existingReg.qr_token);
        await generateQR(existingReg.qr_token);
        setFlow("success");
      } else if (ev && !ev.is_team_event) {
        // If event only supports Solo, bypass choice step
        setFlow("solo");
      }

      setLoading(false);
    };

    if (id) init();
  }, [id, router]);

  // Load existing teams for Joining flow
  useEffect(() => {
    if (flow === "team" && teamOption === "join") {
      fetchActiveTeams();
    }
  }, [flow, teamOption]);

  const fetchActiveTeams = async () => {
    try {
      setSearchingTeams(true);
      // Fetch teams
      const { data: teamsData, error: teamsErr } = await supabase
        .from("teams")
        .select("*, leader:profiles(name)")
        .eq("event_id", id);

      if (teamsErr) throw teamsErr;

      // Fetch all member counts for each team
      const { data: membersData, error: memErr } = await supabase
        .from("team_members")
        .select("team_id, status")
        .eq("status", "approved");

      if (memErr) throw memErr;

      const formatted: ActiveTeamDisplay[] = (teamsData || []).map(t => {
        const matchingMembers = (membersData || []).filter(m => m.team_id === t.id);
        
        // Add a random required skill helper for comic lobby style
        const skillsPool = ["UI Designer", "React Coder", "Rust Specialist", "Pitch deck creator", "Backend dev"];
        const randomSkill = skillsPool[Math.floor(Math.abs(t.name.charCodeAt(0)) % skillsPool.length)];

        return {
          id: t.id,
          name: t.name,
          leader_name: t.leader?.name || "Anonymous",
          member_count: matchingMembers.length + 1, // Include leader
          max_size: t.max_size,
          invite_code: t.invite_code || "",
          skills_needed: randomSkill
        };
      });

      setActiveTeams(formatted);
    } catch (err) {
      console.error("Error loading teams:", err);
    } finally {
      setSearchingTeams(false);
    }
  };

  const generateQR = async (token: string) => {
    const qrData = JSON.stringify({ token, event_id: id, app: "veltrix" });
    const url = await QRCode.toDataURL(qrData, { 
      width: 300, 
      margin: 2, 
      color: { dark: "#0B0B0B", light: "#FFF6E3" } 
    });
    setQrDataUrl(url);
  };

  // --- SOLO FLIGHT HANDLERS ---
  const handleSoloNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (soloStep < soloStepsNames.length - 1) {
      setSoloStep(prev => prev + 1);
    }
  };

  const handleSoloPrev = () => {
    if (soloStep > 0) {
      setSoloStep(prev => prev - 1);
    } else {
      setFlow("select");
    }
  };

  const handleCompleteSoloRegistration = async () => {
    if (!userId || !event) return;
    setSubmitting(true);
    setError("");

    try {
      // 1. Double check capacity bounds
      const { count } = await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", id);
      
      if ((count || 0) >= event.max_seats) {
        throw new Error("Sold out! There are no remaining tickets for this mission.");
      }

      // 2. Generate sandboxed payment details
      const paymentStatus = event.prize_pool ? "paid" : "free";

      // 3. Register user
      const { data: reg, error: regErr } = await supabase
        .from("registrations")
        .insert({
          user_id: userId,
          event_id: id,
          status: paymentStatus === "paid" ? "confirmed" : "confirmed", // Solo users go straight to confirmed
          payment_status: paymentStatus,
          certificate_status: "pending"
        })
        .select("qr_token")
        .single();

      if (regErr) throw regErr;

      setQrToken(reg.qr_token);
      await generateQR(reg.qr_token);

      // 4. Send trigger Notification
      await supabase.from("notifications").insert({
        user_id: userId,
        title: `Registered: ${event.title}!`,
        body: `You joined solo mission. Show QR to claim ${event.xp_reward} XP!`,
        type: "success",
        link: `/events/${id}`
      });

      setFlow("success");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // --- TEAM CREATION FLOW HANDLERS ---
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !userId || !event) return;
    setSubmitting(true);
    setError("");

    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // 1. Create team
      const { data: teamData, error: teamErr } = await supabase
        .from("teams")
        .insert({
          name: teamName.trim(),
          event_id: id,
          leader_id: userId,
          max_size: teamSize,
          invite_code: inviteCode,
          status: "confirmed"
        })
        .select("id")
        .single();

      if (teamErr) throw teamErr;

      // 2. Add Team Lead as members
      const { error: memErr } = await supabase
        .from("team_members")
        .insert({
          team_id: teamData.id,
          user_id: userId,
          role: "leader",
          status: "approved"
        });

      if (memErr) throw memErr;

      // 3. Register user with team correlation
      const { data: reg, error: regErr } = await supabase
        .from("registrations")
        .insert({
          user_id: userId,
          event_id: id,
          team_id: teamData.id,
          status: "confirmed",
          payment_status: event.prize_pool ? "paid" : "free"
        })
        .select("qr_token")
        .single();

      if (regErr) throw regErr;

      setSuccessTeamCode(inviteCode);
      setQrToken(reg.qr_token);
      await generateQR(reg.qr_token);

      // 4. Send Confirmation Notification
      await supabase.from("notifications").insert({
        user_id: userId,
        title: `🏆 Squad Created: ${teamName}!`,
        body: `Teammates can use code [${inviteCode}] to request to join in.`,
        type: "success",
        link: "/dashboard"
      });

      setFlow("success");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // --- TEAM JOIN FLOW HANDLERS ---
  const handleRequestToJoin = async (targetTeam: ActiveTeamDisplay) => {
    if (!userId || !event) return;
    setSubmitting(true);
    setError("");

    try {
      // 1. Create a pending team member entry
      const { error: memErr } = await supabase
        .from("team_members")
        .insert({
          team_id: targetTeam.id,
          user_id: userId,
          role: "member",
          status: "pending"
        });

      if (memErr) throw memErr;

      // 2. Insert pending registration mapping (awaiting lead payment clearance)
      const { error: regErr } = await supabase
        .from("registrations")
        .insert({
          user_id: userId,
          event_id: id,
          team_id: targetTeam.id,
          status: "pending", // Set as pending until accepted
          payment_status: "pending"
        });

      if (regErr) throw regErr;

      // 3. Query the Team Lead's ID to notify them
      const { data: leadProfile } = await supabase
        .from("teams")
        .select("leader_id")
        .eq("id", targetTeam.id)
        .single();

      if (leadProfile?.leader_id) {
        await supabase.from("notifications").insert({
          user_id: leadProfile.leader_id,
          title: `⚡ Squad Join Request!`,
          body: `${userProfile?.name || "Someone"} requested to join ${targetTeam.name}. Review their profile in the Lobby!`,
          type: "warning",
          link: "/dashboard"
        });
      }

      setPendingJoinTeam(targetTeam.name);
      setFlow("success");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ padding: "80px", textAlign: "center" }}>
      <motion.div className="font-bangers" style={{ fontSize: "3rem" }}
        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }}>
        INITIALIZING ARENA...
      </motion.div>
    </div>
  );

  return (
    <div className="register-page font-space">
      <div className="register-shell">
        <Link href={`/events/${id}`} className="font-bebas register-back">
          <ArrowLeft size={16} /> BACK TO EVENT
        </Link>
        
        <h1 className="font-bangers main-heading">SECURE ENTRY PASS</h1>
        <p className="description-text">Event: <strong className="font-bebas text-pink">{event?.title}</strong></p>

        <AnimatePresence mode="wait">
          {/* FLOW SELECT STAGE (HYBRID DECISION POINT) */}
          {flow === "select" && (
            <motion.div 
              key="select" 
              className="selection-grid"
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }}
            >
              <div className="brutal-card selection-card solo-card" onClick={() => setFlow("solo")}>
                <div className="icon-wrapper bg-pink"><User size={40} /></div>
                <h2 className="font-bebas selection-title">SOLO CAMPAIGN</h2>
                <p>Register as a single operative. Build your own profile and track solo XP rewards.</p>
                <button className="btn btn-pink font-bebas select-btn">CHOOSE SOLO →</button>
              </div>

              <div className="brutal-card selection-card team-card" onClick={() => { setFlow("team"); setTeamOption(null); }}>
                <div className="icon-wrapper bg-yellow"><Users size={40} /></div>
                <h2 className="font-bebas selection-title">SQUAD BATTLE</h2>
                <p>Form a new team or join an existing roster. Strategize, delegate tasks, and conquer together.</p>
                <button className="btn btn-yellow font-bebas select-btn">CHOOSE SQUAD →</button>
              </div>
            </motion.div>
          )}

          {/* SOLO EVENT REGISTRATION FLOW (4 STEPS) */}
          {flow === "solo" && (
            <motion.div 
              key="solo"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
            >
              <ComicProgress steps={soloStepsNames} currentStep={soloStep} />

              <div className="brutal-card form-container">
                {/* STEP 1: Personal details */}
                {soloStep === 0 && (
                  <form onSubmit={handleSoloNext} className="comic-form">
                    <h2 className="font-bebas step-heading"><User /> PERSONAL INFORMATION</h2>
                    <div className="inputs-grid">
                      <label className="input-label">
                        <span className="font-bebas">Operative Full Name</span>
                        <input className="brutal-card" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
                      </label>
                      <label className="input-label">
                        <span className="font-bebas">Transmission Email</span>
                        <input className="brutal-card" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                      </label>
                      <label className="input-label">
                        <span className="font-bebas">Comm Mobile Number</span>
                        <input className="brutal-card" type="tel" placeholder="9876543210" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} required />
                      </label>
                      <label className="input-label">
                        <span className="font-bebas">Operational Skills (Optional)</span>
                        <input className="brutal-card" placeholder="UI Design, Python, CyberSec" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} />
                      </label>
                    </div>
                    <div className="btn-row">
                      {event?.is_team_event && (
                        <button type="button" className="btn btn-black" onClick={() => setFlow("select")}>← CHANGE ROLE</button>
                      )}
                      <button type="submit" className="btn btn-green next-btn">CONTINUE TO COLLEGE DETAILS →</button>
                    </div>
                  </form>
                )}

                {/* STEP 2: College details */}
                {soloStep === 1 && (
                  <form onSubmit={handleSoloNext} className="comic-form">
                    <h2 className="font-bebas step-heading"><BookOpen /> ANITS ACADEMIC DATA</h2>
                    <div className="inputs-grid">
                      <label className="input-label">
                        <span className="font-bebas">College Registration Number</span>
                        <input className="brutal-card" value={formData.registrationNo} onChange={e => setFormData({...formData, registrationNo: e.target.value})} required />
                      </label>
                      <label className="input-label">
                        <span className="font-bebas">Academic Branch</span>
                        <select className="brutal-card" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required>
                          <option value="">Select Department...</option>
                          <option value="CSE">Computer Science (CSE)</option>
                          <option value="IT">Information Tech (IT)</option>
                          <option value="ECE">Electronics (ECE)</option>
                          <option value="EEE">Electrical (EEE)</option>
                          <option value="Mechanical">Mechanical</option>
                          <option value="Civil">Civil</option>
                          <option value="MBA">MBA</option>
                        </select>
                      </label>
                      <div className="inputs-row">
                        <label className="input-label">
                          <span className="font-bebas">Current Year</span>
                          <select className="brutal-card" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} required>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                          </select>
                        </label>
                        <label className="input-label">
                          <span className="font-bebas">Section</span>
                          <input className="brutal-card" maxLength={1} value={formData.section} onChange={e => setFormData({...formData, section: e.target.value.toUpperCase()})} required />
                        </label>
                      </div>
                    </div>
                    <div className="btn-row">
                      <button type="button" className="btn btn-black" onClick={handleSoloPrev}>← PREVIOUS</button>
                      <button type="submit" className="btn btn-green next-btn">REVIEW SUBMISSION →</button>
                    </div>
                  </form>
                )}

                {/* STEP 3: Review Details */}
                {soloStep === 2 && (
                  <div className="comic-form">
                    <h2 className="font-bebas step-heading"><Sparkles /> VERIFY TRANSMISSION</h2>
                    <p className="form-helper">Make sure all details match your college ID card before generating the pass.</p>
                    
                    <div className="review-list brutal-card bg-cream">
                      <div className="review-item"><strong>NAME:</strong> <span>{formData.fullName}</span></div>
                      <div className="review-item"><strong>EMAIL:</strong> <span>{formData.email}</span></div>
                      <div className="review-item"><strong>MOBILE:</strong> <span>{formData.mobile}</span></div>
                      <div className="review-item"><strong>REG NO:</strong> <span>{formData.registrationNo}</span></div>
                      <div className="review-item"><strong>DEPARTMENT:</strong> <span>{formData.department} ({formData.year} Year, Sec {formData.section})</span></div>
                      {formData.skills && <div className="review-item"><strong>SKILLS:</strong> <span>{formData.skills}</span></div>}
                    </div>

                    <div className="btn-row">
                      <button type="button" className="btn btn-black" onClick={handleSoloPrev}>← EDIT DETAILS</button>
                      <button type="button" className="btn btn-green next-btn" onClick={() => setSoloStep(3)}>PROCEED TO CHECKOUT →</button>
                    </div>
                  </div>
                )}

                {/* STEP 4: Sandboxed Checkout Payment */}
                {soloStep === 3 && (
                  <div className="comic-form">
                    <h2 className="font-bebas step-heading"><CreditCard /> CHECKOUT PASS GATEWAY</h2>
                    <p className="form-helper">Confirm booking credentials. Sandbox simulation activated.</p>
                    
                    <div className="brutal-card payment-card">
                      <div className="payment-heading font-bebas">TRANSACTION SUMMARY</div>
                      <div className="payment-row"><span>1x {event?.title} Solo Ticket</span> <span>{event?.prize_pool ? "₹ 150.00" : "FREE"}</span></div>
                      <div className="payment-row highlight"><strong>Total Due</strong> <strong>{event?.prize_pool ? "₹ 150.00" : "₹ 0.00"}</strong></div>
                      
                      <div className="payment-simulation font-space">
                        ⚡ SANDBOX SECURITY ACTIVE. NO ACTUAL CARD CHARGES.
                      </div>
                    </div>

                    {error && (
                      <div className="error-toast brutal-card">{error}</div>
                    )}

                    <div className="btn-row">
                      <button type="button" className="btn btn-black" onClick={handleSoloPrev}>← PREVIOUS</button>
                      <button type="button" className="btn btn-green next-btn" onClick={handleCompleteSoloRegistration} disabled={submitting}>
                        {submitting ? "AUTHENTICATING PASS..." : event?.prize_pool ? "PAY & SECURE PASS" : "CLAIM FREE PASS"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TEAM EVENT REGISTRATION FLOW (CREATE vs JOIN) */}
          {flow === "team" && (
            <motion.div 
              key="team"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
            >
              {/* Back to main selector */}
              {teamOption === null ? (
                <div className="brutal-card squad-option-container">
                  <div className="back-bar">
                    <button className="btn btn-black font-bebas" onClick={() => setFlow("select")}>← BACK</button>
                  </div>
                  
                  <h2 className="font-bebas option-heading">CHOOSE SQUAD ROLE</h2>
                  
                  <div className="squad-options">
                    <div className="option-choice brutal-card" onClick={() => setTeamOption("create")}>
                      <PlusCircle size={32} />
                      <h3 className="font-bebas">CREATE NEW SQUAD</h3>
                      <p>Generate a unique squad room, act as the Team Lead, invite members and configure max slots.</p>
                    </div>

                    <div className="option-choice brutal-card" onClick={() => setTeamOption("join")}>
                      <Search size={32} />
                      <h3 className="font-bebas">JOIN EXISTING SQUAD</h3>
                      <p>Search active squads on campus, submit a request, and wait for confirmation to pay.</p>
                    </div>
                  </div>
                </div>
              ) : teamOption === "create" ? (
                /* CREATE TEAM SUB-FORM */
                <div className="brutal-card form-container">
                  <form onSubmit={handleCreateTeam} className="comic-form">
                    <h2 className="font-bebas step-heading"><PlusCircle /> DEPLOY SQUAD MISSION</h2>
                    <div className="inputs-grid">
                      <label className="input-label">
                        <span className="font-bebas">Squad / Team Name</span>
                        <input 
                          className="brutal-card" 
                          placeholder="Code Titans, Robo Warriors..." 
                          value={teamName} 
                          onChange={e => setTeamName(e.target.value)} 
                          required 
                        />
                      </label>
                      <label className="input-label">
                        <span className="font-bebas">Max Squad Capacity</span>
                        <select 
                          className="brutal-card" 
                          value={teamSize} 
                          onChange={e => setTeamSize(Number(e.target.value))}
                        >
                          <option value="2">2 Members</option>
                          <option value="3">3 Members</option>
                          <option value="4">4 Members (Standard)</option>
                          <option value="5">5 Members</option>
                        </select>
                      </label>
                    </div>

                    <div className="brutal-card payment-card" style={{ margin: "20px 0" }}>
                      <div className="payment-heading font-bebas">SQUAD LEAD CHECKOUT</div>
                      <p className="form-helper">Creating team registers you as the confirmed squad leader.</p>
                      <div className="payment-row highlight"><strong>Total Due</strong> <strong>{event?.prize_pool ? "₹ 150.00" : "₹ 0.00"}</strong></div>
                    </div>

                    {error && (
                      <div className="error-toast brutal-card">{error}</div>
                    )}

                    <div className="btn-row">
                      <button type="button" className="btn btn-black" onClick={() => setTeamOption(null)}>← BACK</button>
                      <button type="submit" className="btn btn-green next-btn" disabled={submitting}>
                        {submitting ? "INITIALIZING ROOM..." : "PAY & DEPLOY SQUAD"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* JOIN TEAM SEARCH FEED */
                <div className="brutal-card form-container">
                  <div className="back-bar">
                    <button className="btn btn-black font-bebas" style={{ marginBottom: "15px" }} onClick={() => setTeamOption(null)}>← BACK</button>
                  </div>
                  
                  <h2 className="font-bebas step-heading"><Search /> SEARCH CAMPUS SQUADS</h2>
                  
                  <div className="search-bar brutal-card">
                    <Search size={20} />
                    <input 
                      type="text" 
                      placeholder="Type squad name to search..." 
                      value={teamSearchQuery}
                      onChange={e => setTeamSearchQuery(e.target.value)}
                    />
                  </div>

                  {searchingTeams ? (
                    <div className="searching-toast font-bebas">SCANNING TRANSMISSIONS...</div>
                  ) : (
                    <div className="teams-feed">
                      {activeTeams
                        .filter(t => t.name.toLowerCase().includes(teamSearchQuery.toLowerCase()))
                        .map(t => {
                          const slotsLeft = t.max_size - t.member_count;
                          const isFull = slotsLeft <= 0;

                          return (
                            <div key={t.id} className="team-item brutal-card">
                              <div className="team-meta">
                                <span className="team-item-name font-bebas">{t.name}</span>
                                <span className="team-item-details">Leader: <strong>{t.leader_name}</strong> | Slots: {t.member_count}/{t.max_size}</span>
                                {t.skills_needed && (
                                  <span className="skills-badge font-space">🎯 Need: {t.skills_needed}</span>
                                )}
                              </div>
                              <div className="team-actions">
                                <button 
                                  className={`btn ${isFull ? "btn-black" : "btn-green"}`} 
                                  disabled={isFull || submitting}
                                  onClick={() => handleRequestToJoin(t)}
                                >
                                  {isFull ? "FULL" : "REQUEST JOIN"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      
                      {activeTeams.length === 0 && (
                        <div className="empty-teams-message">
                          ❌ No active squads found. Try creating one to lead the charge!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* SUCCESS SCREEN STAGE */}
          {flow === "success" && (
            <motion.div 
              key="success" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="brutal-card registration-pass"
            >
              <div className="success-icon-wrapper">
                <CheckCircle size={70} color="var(--green)" />
              </div>

              {pendingJoinTeam ? (
                /* Submitting a Request to join a team */
                <>
                  <div className="sticker bg-yellow" style={{ marginBottom: "20px" }}>REQUEST DISPATCHED</div>
                  <h1 className="font-bangers pass-title">AWAITING SQUAD CLEARANCE</h1>
                  <p className="font-space pass-desc">
                    Your request to join team <strong className="text-pink">{pendingJoinTeam}</strong> has been successfully sent to the Team Lead. 
                  </p>
                  <div className="pending-badge brutal-card">
                    ⚡ STATUS: PENDING LEAD APPROVAL
                  </div>
                  <p className="form-helper" style={{ margin: "20px 0" }}>
                    Once approved, your dashboard will unlock the payment step so you can secure your QR pass!
                  </p>
                </>
              ) : (
                /* Confirmed registration (Solo or Team Lead creation) */
                <>
                  <div className="sticker bg-green" style={{ marginBottom: "20px" }}>EVENT PASS SECURED</div>
                  <h1 className="font-bangers pass-title">MISSION LOCKED & LOADED</h1>
                  <p className="font-space pass-desc">
                    Congratulations! Your spot is confirmed. Present this secure QR at the venue entrance to register attendance and earn XP.
                  </p>

                  {successTeamCode && (
                    <div className="team-code-alert brutal-card">
                      <h4 className="font-bebas">SQUAD INVITATION LINK</h4>
                      <p>Share this code with teammates so they can request to join in: <strong>{successTeamCode}</strong></p>
                    </div>
                  )}

                  {/* QR Placement */}
                  {qrDataUrl && (
                    <div className="qr-container brutal-card">
                      <img src={qrDataUrl} alt="Secure Ticket QR" />
                      <span className="font-bebas qr-token-tag">PASS ID: {qrToken.slice(0, 8).toUpperCase()}</span>
                    </div>
                  )}
                </>
              )}

              <div className="success-buttons font-space">
                {qrDataUrl && !pendingJoinTeam && (
                  <a href={qrDataUrl} download={`veltrix-pass-${id}.png`} className="btn btn-black">
                    DOWNLOAD QR TICKET
                  </a>
                )}
                <Link href="/dashboard/student" className="btn btn-green">
                  GO TO MY LOBBY →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .register-page {
          min-height: 100vh;
          background: #F5F5F5;
          padding: 40px clamp(16px, 4vw, 20px);
        }
        .register-shell {
          max-width: 800px;
          margin: 0 auto;
        }
        .register-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          color: black;
          font-weight: bold;
          font-size: 1.2rem;
          margin-bottom: 20px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .register-back:hover {
          opacity: 1;
        }
        .main-heading {
          font-size: 3.5rem;
          margin: 0;
          line-height: 0.9;
        }
        .description-text {
          font-size: 1.2rem;
          margin-top: 10px;
          margin-bottom: 30px;
          opacity: 0.8;
        }
        .text-pink {
          color: var(--pink, #FF007F);
        }
        .brutal-card {
          background: white;
          border: 4px solid #000;
          box-shadow: 8px 8px 0px #000;
          padding: 30px;
        }
        .selection-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-top: 20px;
        }
        .selection-card {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.2s;
        }
        .selection-card:hover {
          transform: translate(-4px, -4px);
          box-shadow: 12px 12px 0px #000;
        }
        .icon-wrapper {
          width: 80px;
          height: 80px;
          border: 3px solid #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 4px 4px 0px #000;
          color: black;
        }
        .bg-pink { background: var(--pink, #FF007F); color: white; }
        .bg-yellow { background: var(--yellow, #FFE600); }
        .bg-green { background: var(--green, #39FF14); }
        .selection-title {
          font-size: 2rem;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
        .select-btn {
          margin-top: auto;
          width: 100%;
          padding: 12px;
          font-size: 1.1rem;
        }
        
        /* FORM DETAILS */
        .form-container {
          background: white;
        }
        .step-heading {
          font-size: 2.2rem;
          margin-top: 0;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .inputs-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 30px;
        }
        .input-label {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-label span {
          font-size: 1.1rem;
          font-weight: bold;
        }
        .input-label input, .input-label select {
          padding: 14px;
          font-size: 1.05rem;
          border: 3px solid #000;
          box-shadow: 3px 3px 0px #000;
          outline: none;
          background: white;
        }
        .inputs-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }
        .btn-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-top: 20px;
        }
        .next-btn {
          flex: 1;
          justify-content: center;
        }

        /* REVIEW AND PAYMENTS */
        .review-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
          border: 3px solid #000;
          margin-bottom: 24px;
        }
        .bg-cream {
          background: #FFF6E3;
        }
        .review-item {
          display: flex;
          justify-content: space-between;
          font-size: 1.1rem;
          border-bottom: 1px dashed rgba(0,0,0,0.15);
          padding-bottom: 8px;
        }
        .payment-card {
          border-color: var(--pink, #FF007F);
          background: #FFF0F5;
          margin-bottom: 24px;
        }
        .payment-heading {
          font-size: 1.6rem;
          color: var(--pink, #FF007F);
          margin-bottom: 12px;
        }
        .payment-row {
          display: flex;
          justify-content: space-between;
          font-size: 1.1rem;
          margin-bottom: 8px;
        }
        .payment-row.highlight {
          border-top: 3px double #000;
          padding-top: 10px;
          font-size: 1.25rem;
        }
        .payment-simulation {
          margin-top: 15px;
          background: var(--yellow, #FFE600);
          color: black;
          font-size: 0.85rem;
          font-weight: bold;
          padding: 8px;
          border: 2px solid #000;
          text-align: center;
        }
        .error-toast {
          background: var(--pink, #FF007F);
          color: white;
          padding: 12px;
          font-weight: bold;
          margin-bottom: 20px;
        }

        /* SQUAD CREATION / SEARCH OPTIONS */
        .squad-option-container {
          text-align: center;
        }
        .option-heading {
          font-size: 2.5rem;
          margin-bottom: 24px;
        }
        .squad-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
        }
        .option-choice {
          padding: 30px;
          cursor: pointer;
          transition: transform 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .option-choice:hover {
          transform: translateY(-5px);
          box-shadow: 12px 12px 0px #000;
          border-color: var(--yellow, #FFE600);
        }
        .option-choice h3 {
          font-size: 1.6rem;
          margin: 15px 0 10px 0;
        }
        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 3px solid #000;
          margin-bottom: 20px;
        }
        .search-bar input {
          border: none;
          outline: none;
          font-size: 1.1rem;
          flex: 1;
        }
        .searching-toast {
          text-align: center;
          font-size: 1.5rem;
          padding: 20px;
        }
        .teams-feed {
          display: flex;
          flex-direction: column;
          gap: 15px;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 8px;
        }
        .team-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border: 3px solid #000;
          box-shadow: 4px 4px 0px #000;
        }
        .team-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .team-item-name {
          font-size: 1.6rem;
        }
        .team-item-details {
          font-size: 0.95rem;
          opacity: 0.7;
        }
        .skills-badge {
          background: #EAEAEA;
          border: 1px solid #000;
          font-size: 0.8rem;
          padding: 2px 6px;
          align-self: flex-start;
          margin-top: 4px;
        }
        .empty-teams-message {
          text-align: center;
          padding: 30px;
          opacity: 0.6;
        }

        /* SUCCESS SCREEN PASS */
        .registration-pass {
          text-align: center;
        }
        .success-icon-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        .pass-title {
          font-size: 3.5rem;
          line-height: 0.95;
          margin-bottom: 12px;
        }
        .pass-desc {
          font-size: 1.15rem;
          opacity: 0.75;
          margin-bottom: 24px;
        }
        .pending-badge {
          display: inline-block;
          background: var(--yellow, #FFE600);
          font-size: 1.3rem;
          font-weight: bold;
          padding: 12px 24px;
          border: 3px solid #000;
        }
        .team-code-alert {
          background: #FFF6E3;
          border-color: var(--yellow, #FFE600);
          margin-bottom: 24px;
        }
        .team-code-alert h4 {
          font-size: 1.3rem;
          margin: 0 0 6px 0;
          color: black;
        }
        .team-code-alert p {
          margin: 0;
          font-size: 1rem;
        }
        .qr-container {
          background: var(--cream, #FFF6E3);
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          margin-bottom: 30px;
        }
        .qr-container img {
          width: 200px;
          height: 200px;
        }
        .qr-token-tag {
          font-size: 0.8rem;
          opacity: 0.5;
          letter-spacing: 1px;
          margin-top: 8px;
        }
        .success-buttons {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .selection-grid, .squad-options {
            grid-template-columns: 1fr;
          }
          .main-heading {
            font-size: 2.8rem;
          }
          .pass-title {
            font-size: 2.5rem;
          }
          .team-item {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }
          .team-actions {
            width: 100%;
          }
          .team-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
