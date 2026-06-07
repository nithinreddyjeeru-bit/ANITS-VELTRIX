"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  Zap, 
  Users, 
  Target, 
  Trophy, 
  MapPin, 
  Calendar, 
  Info, 
  Tag, 
  Layers, 
  Image as ImageIcon,
  CheckCircle2,
  Share2,
  Clock,
  Shield,
  Phone,
  Globe,
  Plus,
  Sparkles,
  FileText
} from "lucide-react";
import { useVeltrix } from "@/lib/store";
import { createEvent } from "@/lib/hooks/useEvents";
import type { Event } from "@/lib/types";

const STEPS = [
  { id: 1, title: "Basic Info", icon: Info },
  { id: 2, title: "Visuals", icon: ImageIcon },
  { id: 3, title: "Critical Details", icon: Target },
  { id: 4, title: "Teams & Rewards", icon: Trophy },
  { id: 5, title: "Review & Publish", icon: CheckCircle2 },
];

const CATEGORIES = [
  { id: "TECH", label: "Tech", color: "var(--blue)" },
  { id: "ROBOTICS", label: "Robotics", color: "var(--orange)" },
  { id: "DESIGN", label: "Design", color: "var(--pink)" },
  { id: "GAMING", label: "Gaming", color: "var(--purple)" },
  { id: "CULTURAL", label: "Cultural", color: "var(--green)" },
  { id: "WORKSHOP", label: "Workshop", color: "var(--blue)" },
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Pro"];

const TEMPLATES = [
  { 
    id: "hack", 
    label: "Hackathon", 
    icon: Zap,
    data: { title: "24-HOUR HACKATHON", category: "Tech", xp_reward: 500, is_team_event: true, team_size: 4, difficulty: "Intermediate" } 
  },
  { 
    id: "workshop", 
    label: "Workshop", 
    icon: FileText,
    data: { title: "MASTERCLASS WORKSHOP", category: "Workshop", xp_reward: 150, is_team_event: false, difficulty: "Beginner" } 
  },
  { 
    id: "gaming", 
    label: "Gaming", 
    icon: Trophy,
    data: { title: "ESPORTS TOURNAMENT", category: "Gaming", xp_reward: 300, is_team_event: true, team_size: 5, difficulty: "Advanced" } 
  },
];

export function EventCreationForm() {
  const { user } = useVeltrix();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState<Partial<Event>>({
    title: "",
    description: "",
    category: "Tech",
    venue: "",
    mode: "offline",
    difficulty: "Beginner",
    event_date: "",
    registration_deadline: "",
    max_seats: 100,
    xp_reward: 100,
    banner_url: "",
    prize_pool: "",
    rules: "",
    contact_info: "",
    is_team_event: false,
    team_size: 4,
    tags: [],
    status: "draft"
  });

  const [dragActive, setDragActive] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const applyTemplate = (data: any) => {
    setForm(prev => ({ ...prev, ...data }));
    setStep(1);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    if ("files" in e.target && e.target.files?.[0]) {
      file = e.target.files[0];
    } else if ("dataTransfer" in e && e.dataTransfer.files?.[0]) {
      file = e.dataTransfer.files[0];
    }

    if (file) {
      setBannerFile(file);
      const url = URL.createObjectURL(file);
      setForm(prev => ({ ...prev, banner_url: url }));
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!user) return router.push("/auth");
    setLoading(true);
    setError("");

    try {
      // Upload the banner to Supabase Storage (the blob: preview URL is not persistable).
      let bannerUrl = form.banner_url || "";
      if (bannerFile) {
        const { uploadEventBanner } = await import("@/lib/storage");
        bannerUrl = await uploadEventBanner(user.id, bannerFile);
      } else if (bannerUrl.startsWith("blob:")) {
        bannerUrl = "";
      }

      const eventData = {
        ...form,
        banner_url: bannerUrl,
        status: isDraft ? "draft" : "upcoming",
        created_by: user.id,
        event_date: form.event_date ? new Date(form.event_date).toISOString() : new Date().toISOString(),
        registration_deadline: form.registration_deadline ? new Date(form.registration_deadline).toISOString() : undefined,
      };

      await createEvent(eventData as Partial<Event>);
      if (!isDraft) {
        setSuccess(true);
        setTimeout(() => router.push("/events"), 2500);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const activeCatColor = CATEGORIES.find(c => c.label === form.category)?.color || "var(--black)";

  if (success) {
    return (
      <div style={{ 
        height: "80vh", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        textAlign: "center",
        background: "var(--cream)"
      }}>
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          style={{ 
            width: "120px", 
            height: "120px", 
            background: "var(--green)", 
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            border: "4px solid black",
            boxShadow: "8px 8px 0 black",
            marginBottom: "24px"
          }}
        >
          <Sparkles size={64} color="black" />
        </motion.div>
        
        {/* Simple Confetti Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: 0, x: 0, opacity: 1 }}
            animate={{ 
              y: [0, -200, 400], 
              x: [0, (i - 10) * 40], 
              opacity: [1, 1, 0],
              rotate: [0, 360]
            }}
            transition={{ duration: 2, delay: i * 0.05 }}
            style={{ 
              position: "absolute",
              width: "10px",
              height: "10px",
              background: i % 2 === 0 ? "var(--pink)" : "var(--green)",
              border: "1px solid black"
            }}
          />
        ))}

        <h1 className="font-bangers" style={{ fontSize: "4.5rem", color: "var(--black)" }}>MISSION GENERATED!</h1>
        <p className="font-space" style={{ fontSize: "1.3rem", opacity: 0.7, maxWidth: "500px" }}>
          The mission card has been broadcasted to the arena. Prepare for incoming registrations.
        </p>
        <div style={{ marginTop: "40px", display: "flex", gap: "20px" }}>
          <button className="btn btn-green" onClick={() => router.push("/events")}>GO TO EVENTS</button>
          <button className="btn" style={{ background: "white" }}><Share2 size={18} /> SHARE MISSION</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 60px", maxWidth: "1500px", margin: "0 auto", background: "var(--cream)", minHeight: "100vh" }}>
      {/* Templates Row */}
      <div style={{ marginBottom: "32px", display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "12px" }}>
        <div style={{ alignSelf: "center", marginRight: "8px" }}>
          <span className="font-bebas" style={{ fontSize: "1rem", opacity: 0.5 }}>QUICK START:</span>
        </div>
        {TEMPLATES.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => applyTemplate(t.data)}
              style={{ 
                padding: "10px 20px", 
                background: "white", 
                border: "2px solid black", 
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "4px 4px 0 black",
                transition: "all 0.2s ease"
              }}
              onMouseOver={e => e.currentTarget.style.transform = "translate(-2px, -2px)"}
              onMouseOut={e => e.currentTarget.style.transform = "none"}
            >
              <Icon size={18} />
              <span className="font-bebas" style={{ fontSize: "1.1rem" }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "60px", alignItems: "start" }}>
        
        {/* Left: Multi-Step Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* Progress Bar */}
          <div className="card" style={{ background: "white", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
               {/* Line */}
               <div style={{ position: "absolute", top: "18px", left: "0", right: "0", height: "3px", background: "#eee", zIndex: 0 }} />
               <div style={{ position: "absolute", top: "18px", left: "0", width: `${((step - 1) / (STEPS.length - 1)) * 100}%`, height: "3px", background: "var(--green)", zIndex: 1, transition: "width 0.3s ease" }} />
               
               {STEPS.map(s => (
                 <div key={s.id} style={{ zIndex: 2, position: "relative" }}>
                   <div style={{ 
                     width: "36px", 
                     height: "36px", 
                     background: step >= s.id ? "var(--green)" : "white",
                     border: "2px solid black",
                     borderRadius: "50%",
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     fontSize: "0.9rem",
                     fontWeight: "bold",
                     boxShadow: step === s.id ? "3px 3px 0 black" : "none"
                   }}>
                     {step > s.id ? "✓" : s.id}
                   </div>
                   <div className="font-bebas" style={{ 
                     position: "absolute", 
                     top: "42px", 
                     left: "50%", 
                     transform: "translateX(-50%)", 
                     fontSize: "0.75rem", 
                     whiteSpace: "nowrap",
                     opacity: step === s.id ? 1 : 0.4
                   }}>{s.title}</div>
                 </div>
               ))}
            </div>
          </div>

          <div className="card" style={{ background: "white", padding: "48px", minHeight: "650px" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {step === 1 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ background: "var(--green)", padding: "10px", borderRadius: "8px", border: "2px solid black" }}><Info size={24} /></div>
                      <h2 className="font-bangers" style={{ fontSize: "2.4rem" }}>BASIC MISSION INTEL</h2>
                    </div>
                    
                    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span className="font-bebas" style={{ fontSize: "1.2rem" }}>MISSION TITLE</span>
                      <input 
                        className="brutal-card" 
                        style={{ padding: "18px", fontSize: "1.2rem", border: "3px solid black" }} 
                        placeholder="e.g. ROBO-WARS 2026"
                        value={form.title}
                        onChange={e => setForm({...form, title: e.target.value})}
                      />
                    </label>

                    <div>
                      <span className="font-bebas" style={{ fontSize: "1.2rem", display: "block", marginBottom: "16px" }}>CATEGORY SELECTOR</span>
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setForm({...form, category: cat.label})}
                            style={{ 
                              padding: "10px 24px", 
                              borderRadius: "12px", 
                              border: "3px solid black",
                              fontFamily: "'Bebas Neue', sans-serif",
                              fontSize: "1.2rem",
                              background: form.category === cat.label ? cat.color : "white",
                              cursor: "pointer",
                              boxShadow: form.category === cat.label ? "4px 4px 0 black" : "none",
                              transform: form.category === cat.label ? "translateY(-4px)" : "none",
                              transition: "all 0.2s ease"
                            }}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span className="font-bebas" style={{ fontSize: "1.2rem" }}>MISSION BRIEFING (DESCRIPTION)</span>
                      <textarea 
                        className="brutal-card" 
                        style={{ padding: "18px", minHeight: "140px", resize: "none", border: "3px solid black" }} 
                        placeholder="Detail the objectives, timeline, and what students will experience..."
                        value={form.description}
                        onChange={e => setForm({...form, description: e.target.value})}
                      />
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span className="font-bebas" style={{ fontSize: "1.2rem" }}>MODE</span>
                        <div style={{ display: "flex", gap: "10px" }}>
                           {['offline', 'online'].map(m => (
                             <button 
                                key={m}
                                type="button"
                                onClick={() => setForm({...form, mode: m as any})}
                                style={{ 
                                  flex: 1, 
                                  padding: "12px", 
                                  border: "3px solid black", 
                                  background: form.mode === m ? "var(--green)" : "white",
                                  fontFamily: "'Bebas Neue', sans-serif",
                                  fontSize: "1.1rem",
                                  boxShadow: form.mode === m ? "3px 3px 0 black" : "none"
                                }}
                             >
                               {m.toUpperCase()}
                             </button>
                           ))}
                        </div>
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span className="font-bebas" style={{ fontSize: "1.2rem" }}>DIFFICULTY</span>
                        <select 
                          className="brutal-card" 
                          style={{ padding: "16px", border: "3px solid black" }}
                          value={form.difficulty}
                          onChange={e => setForm({...form, difficulty: e.target.value as any})}
                        >
                          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </label>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ background: "var(--pink)", padding: "10px", borderRadius: "8px", border: "2px solid black" }}><ImageIcon size={24} color="white" /></div>
                      <h2 className="font-bangers" style={{ fontSize: "2.4rem" }}>VISUALS & TIMING</h2>
                    </div>
                    
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={(e) => { e.preventDefault(); setDragActive(false); handleBannerUpload(e); }}
                      onClick={() => bannerInputRef.current?.click()}
                      style={{ 
                        width: "100%", 
                        height: "240px", 
                        border: dragActive ? "4px dashed var(--green)" : "4px dashed black",
                        borderRadius: "20px",
                        background: "var(--cream)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        overflow: "hidden",
                        position: "relative",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {form.banner_url ? (
                        <div style={{ width: "100%", height: "100%", position: "relative" }}>
                          <img src={form.banner_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", bottom: "16px", right: "16px", background: "var(--pink)", color: "white", padding: "8px 16px", border: "2px solid black", fontFamily: "'Bebas Neue', sans-serif" }}>CHANGE POSTER</div>
                        </div>
                      ) : (
                        <>
                          <div className="sticker" style={{ background: "white", marginBottom: "16px", transform: "rotate(-3deg)" }}>
                            <Upload size={32} />
                          </div>
                          <span className="font-bangers" style={{ fontSize: "2rem", letterSpacing: "2px" }}>[ DROP MISSION POSTER ]</span>
                          <span className="font-space" style={{ fontSize: "0.9rem", opacity: 0.5 }}>RECOMMENDED: 1200 x 630px</span>
                        </>
                      )}
                      <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={handleBannerUpload} />
                    </div>

                    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span className="font-bebas" style={{ fontSize: "1.2rem" }}>VENUE (LOCATION)</span>
                      <div style={{ position: "relative" }}>
                        <MapPin style={{ position: "absolute", left: "18px", top: "20px", opacity: 0.4 }} size={22} />
                        <input 
                          className="brutal-card" 
                          style={{ width: "100%", padding: "18px 18px 18px 52px", border: "3px solid black" }} 
                          placeholder="e.g. Auditorium, Admin Block"
                          value={form.venue}
                          onChange={e => setForm({...form, venue: e.target.value})}
                        />
                      </div>
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span className="font-bebas" style={{ fontSize: "1.2rem" }}>EVENT DATE & START TIME</span>
                        <input 
                          type="datetime-local" 
                          className="brutal-card" 
                          style={{ padding: "18px", border: "3px solid black" }}
                          value={form.event_date}
                          onChange={e => setForm({...form, event_date: e.target.value})}
                        />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span className="font-bebas" style={{ fontSize: "1.2rem" }}>REGISTRATION DEADLINE</span>
                        <input 
                          type="datetime-local" 
                          className="brutal-card" 
                          style={{ padding: "18px", border: "3px solid black" }}
                          value={form.registration_deadline}
                          onChange={e => setForm({...form, registration_deadline: e.target.value})}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ background: "var(--orange)", padding: "10px", borderRadius: "8px", border: "2px solid black" }}><Target size={24} /></div>
                      <h2 className="font-bangers" style={{ fontSize: "2.4rem" }}>CRITICAL MISSION INTEL</h2>
                    </div>

                    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span className="font-bebas" style={{ fontSize: "1.2rem" }}>MISSION RULES & GUIDELINES</span>
                        <span className="font-space" style={{ fontSize: "0.8rem", opacity: 0.5 }}>LINE BY LINE</span>
                      </div>
                      <textarea 
                        className="brutal-card" 
                        style={{ padding: "18px", minHeight: "150px", border: "3px solid black" }} 
                        placeholder="1. Each team must have a laptop&#10;2. Zero tolerance for plagiarism&#10;3. Submit before 5:00 PM"
                        value={form.rules}
                        onChange={e => setForm({...form, rules: e.target.value})}
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span className="font-bebas" style={{ fontSize: "1.2rem" }}>PRIZE POOL / REWARDS</span>
                      <div style={{ position: "relative" }}>
                        <Trophy style={{ position: "absolute", left: "18px", top: "20px", opacity: 0.4 }} size={22} />
                        <input 
                          className="brutal-card" 
                          style={{ width: "100%", padding: "18px 18px 18px 52px", border: "3px solid black" }} 
                          placeholder="e.g. ₹5000 Cash + Merit Certificates + Internships"
                          value={form.prize_pool}
                          onChange={e => setForm({...form, prize_pool: e.target.value})}
                        />
                      </div>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span className="font-bebas" style={{ fontSize: "1.2rem" }}>CONTACT INTEL (ORGANIZERS)</span>
                      <div style={{ position: "relative" }}>
                        <Phone style={{ position: "absolute", left: "18px", top: "20px", opacity: 0.4 }} size={22} />
                        <input 
                          className="brutal-card" 
                          style={{ width: "100%", padding: "18px 18px 18px 52px", border: "3px solid black" }} 
                          placeholder="e.g. Rahul: 9876543210, Anjali: 8765432109"
                          value={form.contact_info}
                          onChange={e => setForm({...form, contact_info: e.target.value})}
                        />
                      </div>
                    </label>
                  </div>
                )}

                {step === 4 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ background: "var(--purple)", padding: "10px", borderRadius: "8px", border: "2px solid black" }}><Trophy size={24} color="white" /></div>
                      <h2 className="font-bangers" style={{ fontSize: "2.4rem" }}>REWARDS & SQUAD INTEL</h2>
                    </div>

                    <div style={{ 
                      padding: "24px", 
                      background: "var(--cream)", 
                      borderRadius: "20px", 
                      border: "3px solid black",
                      display: "flex",
                      gap: "20px",
                      alignItems: "center",
                      position: "relative"
                    }}>
                      <div style={{ 
                        width: "72px", 
                        height: "72px", 
                        background: "var(--green)", 
                        borderRadius: "16px", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        border: "3px solid black",
                        boxShadow: "4px 4px 0 black"
                      }}>
                        <Zap size={36} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span className="font-bebas" style={{ fontSize: "1.4rem" }}>MISSION XP REWARD</span>
                        <p className="font-space" style={{ fontSize: "0.9rem", opacity: 0.6, marginBottom: "12px" }}>Students earn this XP after attendance verification.</p>
                        <input 
                          type="number"
                          className="brutal-card"
                          style={{ width: "160px", padding: "12px", border: "2px solid black", fontSize: "1.2rem" }}
                          value={form.xp_reward}
                          onChange={e => setForm({...form, xp_reward: Number(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div>
                      <span className="font-bebas" style={{ fontSize: "1.2rem", display: "block", marginBottom: "16px" }}>SQUAD CONFIGURATION</span>
                      <div style={{ display: "flex", gap: "24px" }}>
                        <button 
                          type="button"
                          onClick={() => setForm({...form, is_team_event: false})}
                          style={{ 
                            flex: 1, 
                            padding: "24px", 
                            background: !form.is_team_event ? "var(--green)" : "white",
                            border: "3px solid black",
                            borderRadius: "20px",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "12px",
                            boxShadow: !form.is_team_event ? "8px 8px 0 black" : "none",
                            transform: !form.is_team_event ? "translateY(-4px)" : "none",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <Target size={40} />
                          <span className="font-bangers" style={{ fontSize: "1.8rem" }}>SOLO MISSION</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => setForm({...form, is_team_event: true})}
                          style={{ 
                            flex: 1, 
                            padding: "24px", 
                            background: form.is_team_event ? "var(--pink)" : "white",
                            border: "3px solid black",
                            borderRadius: "20px",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "12px",
                            boxShadow: form.is_team_event ? "8px 8px 0 black" : "none",
                            transform: form.is_team_event ? "translateY(-4px)" : "none",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <Users size={40} />
                          <span className="font-bangers" style={{ fontSize: "1.8rem" }}>SQUAD MISSION</span>
                        </button>
                      </div>
                    </div>

                    {form.is_team_event && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        style={{ 
                          padding: "24px", 
                          background: "var(--cream)", 
                          border: "3px solid black", 
                          borderRadius: "20px",
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "24px"
                        }}
                      >
                        <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <span className="font-bebas" style={{ fontSize: "1.2rem" }}>SQUAD SIZE (MAX)</span>
                          <input 
                            type="number"
                            className="brutal-card" 
                            style={{ padding: "16px", border: "2px solid black" }}
                            value={form.team_size}
                            onChange={e => setForm({...form, team_size: Number(e.target.value)})}
                          />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <span className="font-bebas" style={{ fontSize: "1.2rem" }}>MAX SQUADS</span>
                          <input 
                            type="number"
                            className="brutal-card" 
                            style={{ padding: "16px", border: "2px solid black" }}
                            value={form.max_seats}
                            onChange={e => setForm({...form, max_seats: Number(e.target.value)})}
                          />
                        </label>
                      </motion.div>
                    )}
                  </div>
                )}

                {step === 5 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "32px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
                      <div style={{ background: "var(--green)", padding: "10px", borderRadius: "8px", border: "2px solid black" }}><CheckCircle2 size={24} /></div>
                      <h2 className="font-bangers" style={{ fontSize: "2.4rem" }}>READY FOR LAUNCH?</h2>
                    </div>
                    
                    <div className="card" style={{ padding: "32px", background: "var(--cream)", border: "3px dashed black" }}>
                      <h4 className="font-bebas" style={{ fontSize: "1.4rem", marginBottom: "20px" }}>MISSION CHECKLIST</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "white", padding: "12px 20px", border: "2px solid black", borderRadius: "12px" }}>
                           <CheckCircle2 size={18} color="var(--green)" />
                           <span className="font-space">Intel & Briefing Verified</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "white", padding: "12px 20px", border: "2px solid black", borderRadius: "12px" }}>
                           <CheckCircle2 size={18} color="var(--green)" />
                           <span className="font-space">Visual Identity Configured</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "white", padding: "12px 20px", border: "2px solid black", borderRadius: "12px" }}>
                           <CheckCircle2 size={18} color="var(--green)" />
                           <span className="font-space">Squad & Reward Params Set</span>
                        </div>
                      </div>
                    </div>

                    <p className="font-space" style={{ maxWidth: "450px", margin: "0 auto", opacity: 0.6, lineHeight: 1.6 }}>
                      By clicking publish, this mission will be deployed to the Veltrix Arena. All students will receive a priority broadcast.
                    </p>

                    {error && <div className="sticker sticker-pink">{error}</div>}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Form Actions */}
            <div style={{ 
              marginTop: "48px", 
              paddingTop: "32px", 
              borderTop: "3px solid black", 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <button 
                className="btn" 
                style={{ background: "white", visibility: step === 1 ? "hidden" : "visible" }}
                onClick={prevStep}
              >
                <ChevronLeft size={20} /> PREVIOUS
              </button>

              <div style={{ display: "flex", gap: "16px" }}>
                <button 
                  className="btn" 
                  style={{ background: "white" }}
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                >
                  SAVE DRAFT
                </button>
                
                {step < STEPS.length ? (
                  <button className="btn btn-green" onClick={nextStep}>
                    NEXT STEP <ChevronRight size={20} />
                  </button>
                ) : (
                  <button 
                    className="btn btn-green" 
                    style={{ background: "var(--pink)", color: "white", padding: "0 40px" }}
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                  >
                    {loading ? "TRANSMITTING..." : "PUBLISH MISSION"} <Zap size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview & Creator Tools */}
        <div style={{ position: "sticky", top: "110px", display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* Live Preview Panel */}
          <div>
            <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "red", animation: "pulse 1.2s infinite" }} />
              <span className="font-bangers" style={{ fontSize: "1.2rem", letterSpacing: "1px" }}>REAL-TIME MISSION RENDER</span>
            </div>

            {/* The Actual Comic Card Preview */}
            <div 
              className="poster-card event-card-v2" 
              style={{ width: "100%", margin: 0, boxShadow: "12px 12px 0 black" }}
            >
              <div className="poster-top" style={{ background: activeCatColor }} />
              <div className="poster-art" style={{ background: `color-mix(in srgb, ${activeCatColor} 10%, white)`, height: "240px" }}>
                {form.banner_url ? (
                  <img src={form.banner_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div className="cat-icon-wrap" style={{ border: "4px solid black" }}>
                    <ImageIcon size={40} />
                  </div>
                )}
                <div style={{
                  position: "absolute", top: "16px", left: "16px",
                  background: activeCatColor,
                  color: "white", fontFamily: "Bebas Neue, sans-serif", fontSize: "0.9rem",
                  padding: "4px 12px", border: "2px solid var(--black)", boxShadow: "3px 3px 0 black"
                }}>
                  {form.category?.toUpperCase()}
                </div>
                <div style={{
                  position: "absolute", top: "16px", right: "16px",
                  background: "var(--green)", color: "var(--black)",
                  fontFamily: "Bangers, system-ui", fontSize: "1.1rem",
                  padding: "4px 12px", border: "2px solid var(--black)", boxShadow: "3px 3px 0 black"
                }}>
                  +{form.xp_reward} XP
                </div>
              </div>

              <div className="poster-body" style={{ padding: "24px" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                   <span className="tag" style={{ background: activeCatColor + "15", borderColor: activeCatColor }}>{form.category}</span>
                   {form.is_team_event && <span className="tag">SQUAD MISSION</span>}
                   <span className="tag" style={{ background: "var(--cream)" }}>{form.difficulty}</span>
                </div>

                <h3 className="font-bangers" style={{ fontSize: "2.4rem", marginBottom: "12px", lineHeight: 1 }}>
                  {form.title || "UNTITLED MISSION"}
                </h3>
                <p className="font-space" style={{ fontSize: "0.95rem", opacity: 0.7, marginBottom: "20px", minHeight: "3em" }}>
                  {form.description || "Enter your mission description to see the briefing here..."}
                </p>

                <div className="event-meta-grid" style={{ marginBottom: "24px" }}>
                  <span className="font-space"><Calendar size={14} /> {form.event_date ? new Date(form.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "TBD"}</span>
                  <span className="font-space"><MapPin size={14} /> {form.venue || "HQ LOCATION"}</span>
                  <span className="font-space"><Users size={14} /> 0/{form.max_seats}</span>
                  <span className="font-space"><Globe size={14} /> {form.mode?.toUpperCase()}</span>
                </div>

                <div className="poster-cta primary" style={{ width: "100%", textAlign: "center", fontSize: "1.4rem" }}>
                  COMMENCE MISSION →
                </div>
              </div>
            </div>
          </div>

          {/* Creator Dashboard Sidebar */}
          <div className="card" style={{ background: "white", padding: "28px", border: "3px solid black" }}>
             <h4 className="font-bangers" style={{ fontSize: "1.6rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
               <Shield size={20} /> CREATOR UTILITIES
             </h4>
             <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ background: "var(--cream)", padding: "16px", borderRadius: "12px", border: "2px solid black" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span className="font-bebas" style={{ opacity: 0.5 }}>DRAFT VALIDATION</span>
                    <span className="font-bebas" style={{ color: form.title ? "var(--green)" : "var(--pink)" }}>{form.title ? "READY" : "INCOMPLETE"}</span>
                  </div>
                  <div style={{ height: "6px", background: "white", borderRadius: "3px", border: "1px solid black", overflow: "hidden" }}>
                    <div style={{ width: `${(step / STEPS.length) * 100}%`, height: "100%", background: "var(--green)", transition: "width 0.3s ease" }} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                     <span className="font-space" style={{ opacity: 0.6 }}>Estimated Reach</span>
                     <b className="font-bebas">1200+ Students</b>
                   </div>
                   <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                     <span className="font-space" style={{ opacity: 0.6 }}>Viral Potential</span>
                     <b className="font-bebas" style={{ color: "var(--pink)" }}>HIGH</b>
                   </div>
                </div>
             </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
        .card {
          border: 3px solid black;
          box-shadow: 10px 10px 0 black;
        }
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: var(--green);
          box-shadow: 4px 4px 0 black;
        }
      `}</style>
    </div>
  );
}
