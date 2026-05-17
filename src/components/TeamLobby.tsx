"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Team, TeamMember, Profile } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Users, Copy, CheckCircle, XCircle, Send, Shield, Zap } from "lucide-react";

interface TeamLobbyProps {
  teamId: string;
  userId: string;
  isLead: boolean;
  onLeaveOrDisband?: () => void;
}

interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export default function TeamLobby({ teamId, userId, isLead, onLeaveOrDisband }: TeamLobbyProps) {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<(TeamMember & { profile?: Profile })[]>([]);
  const [joinRequests, setJoinRequests] = useState<(TeamMember & { profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [myReadyState, setMyReadyState] = useState(false);
  const [readyUsers, setReadyUsers] = useState<Record<string, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const broadcastChannelRef = useRef<any>(null);

  useEffect(() => {
    fetchTeamDetails();
    setupRealtimeLobby();

    return () => {
      if (broadcastChannelRef.current) {
        supabase.removeChannel(broadcastChannelRef.current);
      }
    };
  }, [teamId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      // Fetch Team details
      const { data: teamData, error: teamErr } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single();

      if (teamErr) throw teamErr;
      setTeam(teamData);

      // Fetch Members
      const { data: membersData, error: memErr } = await supabase
        .from("team_members")
        .select("*, profile:profiles(*)")
        .eq("team_id", teamId);

      if (memErr) throw memErr;

      // Filter active (approved) and pending join requests
      const approvedMembers = membersData.filter(m => m.status === "approved" || m.role === "leader");
      const pendingRequests = membersData.filter(m => m.status === "pending" && m.role !== "leader");

      setMembers(approvedMembers);
      setJoinRequests(pendingRequests);
    } catch (err) {
      console.error("Error fetching team lobby details:", err);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeLobby = () => {
    // Subscribe to Supabase Broadcast channel for lobby changes & dynamic chat
    const channel = supabase.channel(`team_lobby_${teamId}`, {
      config: {
        broadcast: { self: true }
      }
    });

    channel
      .on("broadcast", { event: "chat-message" }, ({ payload }) => {
        setMessages(prev => [...prev, payload]);
      })
      .on("broadcast", { event: "ready-toggle" }, ({ payload }) => {
        setReadyUsers(prev => ({
          ...prev,
          [payload.userId]: payload.isReady
        }));
      })
      .on("broadcast", { event: "lobby-update" }, () => {
        fetchTeamDetails();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Joined real-time lobby channel for team ${teamId}`);
        }
      });

    broadcastChannelRef.current = channel;
  };

  const toggleReady = () => {
    const newState = !myReadyState;
    setMyReadyState(newState);
    
    // Broadcast my ready state change to teammates
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: "broadcast",
        event: "ready-toggle",
        payload: { userId, isReady: newState }
      });
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Fetch user details for display name
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .single();

    const senderName = profile?.name || "Player";

    const newMessage: ChatMessage = {
      senderId: userId,
      senderName,
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (broadcastChannelRef.current) {
      await broadcastChannelRef.current.send({
        type: "broadcast",
        event: "chat-message",
        payload: newMessage
      });
    }

    setInputMessage("");
  };

  const handleCopyInvite = () => {
    if (!team?.invite_code) return;
    navigator.clipboard.writeText(team.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAcceptRequest = async (requestId: string, reqUserId: string) => {
    try {
      // 1. Approve team member in database
      const { error } = await supabase
        .from("team_members")
        .update({ status: "approved" })
        .eq("id", requestId);

      if (error) throw error;

      // 2. Automatically update registration status for this user
      // Also updates their payment eligibility
      await supabase
        .from("registrations")
        .update({ status: "approved" })
        .eq("user_id", reqUserId)
        .eq("event_id", team?.event_id);

      // 3. Send Notification to user
      await supabase.from("notifications").insert({
        user_id: reqUserId,
        title: `⚡ Joined ${team?.name || "squad"}!`,
        body: `Your request to join ${team?.name} was approved by the Team Lead! Please proceed to complete checkout.`,
        type: "success",
        link: "/dashboard"
      });

      // 4. Send lobby broadcast update
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.send({
          type: "broadcast",
          event: "lobby-update",
          payload: {}
        });
      }

      fetchTeamDetails();
    } catch (err) {
      console.error("Error approving request:", err);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      fetchTeamDetails();
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  };

  if (loading) {
    return (
      <div className="brutal-card lobby-loading">
        <h3 className="font-bebas">LOADING MISSION LOBBY...</h3>
      </div>
    );
  }

  return (
    <div className="team-lobby-grid font-space">
      {/* LEFT COLUMN: Squad list & settings */}
      <div className="squad-panel brutal-card">
        <div className="squad-header">
          <div className="title-section">
            <Zap className="accent-zap" />
            <h2 className="font-bebas squad-title">{team?.name}</h2>
          </div>
          <div className="invite-tag" onClick={handleCopyInvite}>
            <span className="font-bebas tag-label">INVITE CODE:</span>
            <span className="font-bebas invite-code">{team?.invite_code}</span>
            <Copy size={16} className={`copy-icon ${copied ? "copied" : ""}`} />
          </div>
          {copied && <span className="copied-toast">COPIED TO CLIPBOARD!</span>}
        </div>

        <div className="section-divider" />

        {/* Squad list */}
        <h3 className="section-subheading font-bebas">
          <Users size={18} /> SQUAD MEMBERS ({members.length}/{team?.max_size})
        </h3>
        
        <div className="members-list">
          {members.map((member) => {
            const isMe = member.user_id === userId;
            const isUserReady = member.user_id === userId ? myReadyState : readyUsers[member.user_id];

            return (
              <motion.div 
                key={member.id} 
                className={`member-card brutal-card ${isMe ? "me" : ""}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="member-avatar">
                  {member.profile?.avatar_url ? (
                    <img src={member.profile.avatar_url} alt={member.profile.name} />
                  ) : (
                    <div className="avatar-placeholder">{member.profile?.name?.[0] || "P"}</div>
                  )}
                </div>
                <div className="member-info">
                  <div className="name-row">
                    <span className="member-name">{member.profile?.name} {isMe && "(YOU)"}</span>
                    {member.role === "leader" && (
                      <span className="leader-badge font-bebas">
                        <Shield size={12} /> SQUAD LEAD
                      </span>
                    )}
                  </div>
                  <span className="member-details">{member.profile?.department} - Year {member.profile?.year}</span>
                </div>
                
                <div className={`readiness-indicator ${isUserReady ? "ready" : "pending"}`}>
                  <span className="font-bebas">{isUserReady ? "READY" : "PREPARING"}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Readiness Switch for member */}
        <div className="lobby-actions">
          <button 
            className={`btn ready-btn ${myReadyState ? "active-ready" : ""}`}
            onClick={toggleReady}
          >
            {myReadyState ? "✓ SQUAD READY" : "LOCK SQUAD READINESS"}
          </button>
        </div>

        {/* Join requests for Team Lead */}
        {isLead && joinRequests.length > 0 && (
          <div className="join-requests-section">
            <h3 className="section-subheading font-bebas warning-accent">
              ⚠️ JOIN REQUESTS ({joinRequests.length})
            </h3>
            <div className="requests-list">
              {joinRequests.map((req) => (
                <div key={req.id} className="request-card brutal-card">
                  <div className="request-info">
                    <span className="request-name">{req.profile?.name}</span>
                    <span className="request-sub">{req.profile?.department} | Reg: {req.profile?.registration_no}</span>
                  </div>
                  <div className="request-actions">
                    <button className="icon-btn accept" onClick={() => handleAcceptRequest(req.id, req.user_id)}>
                      <CheckCircle size={18} />
                    </button>
                    <button className="icon-btn reject" onClick={() => handleRejectRequest(req.id)}>
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Real-time Arena chat */}
      <div className="chat-panel brutal-card">
        <h3 className="chat-header font-bebas">
          <MessageSquare size={18} /> LOBBY COMMS CHANNEL
        </h3>

        <div className="chat-messages-container">
          {messages.length === 0 ? (
            <div className="empty-chat font-space">
              ⚡ Channel open. Start coordinate strategies with the team!
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isSenderMe = msg.senderId === userId;
              return (
                <div key={idx} className={`chat-bubble-row ${isSenderMe ? "me" : ""}`}>
                  <div className="chat-bubble brutal-card">
                    <span className="chat-sender font-bebas">{msg.senderName}</span>
                    <p className="chat-text">{msg.text}</p>
                    <span className="chat-time">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={sendChatMessage} className="chat-form">
          <input 
            type="text" 
            placeholder="Type transmission..." 
            className="brutal-card chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button type="submit" className="btn chat-submit-btn">
            <Send size={18} />
          </button>
        </form>
      </div>

      <style jsx>{`
        .team-lobby-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 30px;
          margin-top: 20px;
        }
        .brutal-card {
          background: white;
          border: 4px solid #000;
          box-shadow: 8px 8px 0px #000;
          padding: 24px;
        }
        .squad-panel {
          display: flex;
          flex-direction: column;
        }
        .squad-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }
        .title-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .accent-zap {
          color: var(--yellow, #FFE600);
          fill: var(--yellow, #FFE600);
          width: 24px;
          height: 24px;
        }
        .squad-title {
          font-size: 2.2rem;
          margin: 0;
          letter-spacing: 1px;
        }
        .invite-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--pink, #FF007F);
          border: 2px solid #000;
          padding: 6px 12px;
          cursor: pointer;
          transition: transform 0.2s;
          box-shadow: 2px 2px 0px #000;
        }
        .invite-tag:active {
          transform: translate(2px, 2px);
          box-shadow: 0px 0px 0px #000;
        }
        .tag-label {
          color: white;
          font-size: 0.9rem;
        }
        .invite-code {
          color: white;
          font-size: 1.1rem;
          letter-spacing: 1px;
          font-weight: bold;
        }
        .copy-icon {
          color: white;
          transition: transform 0.3s;
        }
        .copy-icon.copied {
          transform: scale(1.3) rotate(360deg);
        }
        .copied-toast {
          position: absolute;
          right: 0;
          top: -25px;
          background: var(--green, #39FF14);
          font-size: 0.8rem;
          padding: 2px 8px;
          border: 2px solid #000;
          font-weight: bold;
        }
        .section-divider {
          height: 4px;
          background: #000;
          margin: 20px 0;
        }
        .section-subheading {
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .warning-accent {
          color: var(--pink, #FF007F);
        }
        .members-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        .member-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          border: 3px solid #000;
          box-shadow: 4px 4px 0px #000;
        }
        .member-card.me {
          background: #F9F9F9;
          border-color: var(--pink, #FF007F);
        }
        .member-avatar img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid #000;
        }
        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid #000;
          background: var(--yellow, #FFE600);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.2rem;
        }
        .member-info {
          flex: 1;
        }
        .name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .member-name {
          font-weight: bold;
          font-size: 1.1rem;
        }
        .leader-badge {
          background: var(--yellow, #FFE600);
          border: 1px solid #000;
          font-size: 0.75rem;
          padding: 1px 6px;
          border-radius: 2px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }
        .member-details {
          font-size: 0.85rem;
          opacity: 0.6;
          display: block;
        }
        .readiness-indicator {
          border: 2px solid #000;
          padding: 4px 10px;
          font-size: 0.9rem;
          font-weight: bold;
        }
        .readiness-indicator.ready {
          background: var(--green, #39FF14);
        }
        .readiness-indicator.pending {
          background: #E0E0E0;
        }
        .ready-btn {
          width: 100%;
          padding: 14px;
          font-size: 1.3rem;
          font-weight: bold;
          background: var(--pink, #FF007F);
          color: white;
          border: 3px solid #000;
          box-shadow: 4px 4px 0px #000;
          cursor: pointer;
        }
        .ready-btn.active-ready {
          background: var(--green, #39FF14);
          color: black;
        }
        .join-requests-section {
          margin-top: 24px;
        }
        .requests-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .request-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          border: 2px solid #000;
          box-shadow: 3px 3px 0px #000;
        }
        .request-name {
          font-weight: bold;
          display: block;
        }
        .request-sub {
          font-size: 0.8rem;
          opacity: 0.6;
        }
        .request-actions {
          display: flex;
          gap: 8px;
        }
        .icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          transition: transform 0.2s;
        }
        .icon-btn:hover {
          transform: scale(1.15);
        }
        .icon-btn.accept {
          color: var(--green, #39FF14);
        }
        .icon-btn.reject {
          color: var(--pink, #FF007F);
        }

        /* CHAT PANEL */
        .chat-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 480px;
        }
        .chat-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.5rem;
          margin-top: 0;
          margin-bottom: 16px;
        }
        .chat-messages-container {
          flex: 1;
          height: 350px;
          overflow-y: auto;
          border: 3px solid #000;
          background: #F9F9F9;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }
        .empty-chat {
          text-align: center;
          opacity: 0.5;
          margin: auto;
          font-size: 0.95rem;
          padding: 20px;
        }
        .chat-bubble-row {
          display: flex;
          justify-content: flex-start;
        }
        .chat-bubble-row.me {
          justify-content: flex-end;
        }
        .chat-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border: 2px solid #000;
          box-shadow: 2px 2px 0px #000;
          background: white;
          position: relative;
        }
        .chat-bubble-row.me .chat-bubble {
          background: var(--yellow, #FFE600);
        }
        .chat-sender {
          font-size: 0.8rem;
          font-weight: bold;
          display: block;
          margin-bottom: 2px;
        }
        .chat-text {
          margin: 0;
          font-size: 0.95rem;
          word-break: break-all;
        }
        .chat-time {
          font-size: 0.7rem;
          opacity: 0.4;
          display: block;
          text-align: right;
          margin-top: 4px;
        }
        .chat-form {
          display: flex;
          gap: 10px;
        }
        .chat-input {
          flex: 1;
          padding: 12px;
          border: 3px solid #000;
          box-shadow: 3px 3px 0px #000;
          font-size: 1rem;
        }
        .chat-submit-btn {
          padding: 12px 18px;
          background: var(--yellow, #FFE600);
          border: 3px solid #000;
          box-shadow: 3px 3px 0px #000;
          cursor: pointer;
        }
        .chat-submit-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 0px 0px 0px #000;
        }

        .lobby-loading {
          text-align: center;
          padding: 60px;
        }

        @media (max-width: 991px) {
          .team-lobby-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
