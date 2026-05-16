// ============================================================
// ANITS VELTRIX — Shared TypeScript Types
// ============================================================

export type UserRole = 'student' | 'admin' | 'club_admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  registration_no: string;
  role: UserRole;
  department: string;
  year: number;
  avatar_url: string;
  bio: string;
  xp: number;
  level: number;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  mode: 'online' | 'offline';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
  event_date: string;
  end_date?: string;
  registration_deadline?: string;
  max_seats: number;
  xp_reward: number;
  banner_url: string;
  prize_pool?: string;
  rules?: string;
  contact_info?: string;
  status: 'draft' | 'upcoming' | 'live' | 'completed' | 'cancelled';
  created_by?: string;
  club_id?: string;
  is_team_event: boolean;
  team_size: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  // computed
  registration_count?: number;
  is_registered?: boolean;
  is_bookmarked?: boolean;
}

export interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  status: 'confirmed' | 'cancelled' | 'attended';
  qr_token: string;
  team_id?: string;
  registered_at: string;
  // joined
  event?: Event;
  profile?: Profile;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  logo_url: string;
  banner_url: string;
  admin_id?: string;
  member_count: number;
  is_approved: boolean;
  created_at: string;
  // computed
  is_member?: boolean;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: 'member' | 'admin';
  joined_at: string;
  profile?: Profile;
}

export interface Bookmark {
  id: string;
  user_id: string;
  event_id: string;
  saved_at: string;
  event?: Event;
}

export interface Certificate {
  id: string;
  user_id: string;
  event_id: string;
  title: string;
  issued_at: string;
  file_url: string;
  verify_code: string;
  event?: Event;
}

export interface Attendance {
  id: string;
  user_id: string;
  event_id: string;
  scanned_at: string;
  scanned_by?: string;
  event?: Event;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  author_id?: string;
  club_id?: string;
  is_global: boolean;
  created_at: string;
  author?: Profile;
  club?: Club;
}

export interface Team {
  id: string;
  name: string;
  event_id: string;
  leader_id: string;
  max_size: number;
  created_at: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: Profile;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  department: string;
  avatar_url: string;
  xp: number;
  level: number;
  rank: number;
}

export interface AuditLog {
  id: string;
  admin_id?: string;
  action_type: string;
  target_id?: string;
  target_name: string;
  details: string;
  created_at: string;
}

export interface AdminStats {
  total_students: number;
  total_registrations: number;
  total_attendance: number;
  total_events: number;
  total_clubs: number;
  total_certificates: number;
}
